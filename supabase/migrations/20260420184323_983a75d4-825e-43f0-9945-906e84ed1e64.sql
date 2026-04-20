-- Add processing fields to claim_requests for auto-processor
ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS processing_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS auto_eligible boolean,
  ADD COLUMN IF NOT EXISTS auto_processed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_claim_requests_pending_auto
  ON public.claim_requests (status, claim_type, created_at)
  WHERE status IN ('pending','approved') AND tx_hash IS NULL;

-- Daily cap tracking per user per day for FUN auto-mint
CREATE TABLE IF NOT EXISTS public.fun_auto_mint_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mint_date date NOT NULL DEFAULT (now()::date),
  amount_minted numeric NOT NULL DEFAULT 0,
  claim_count integer NOT NULL DEFAULT 0,
  tier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mint_date)
);

ALTER TABLE public.fun_auto_mint_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily mint stats"
  ON public.fun_auto_mint_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages daily mint stats"
  ON public.fun_auto_mint_daily FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_fun_auto_mint_daily_user_date
  ON public.fun_auto_mint_daily (user_id, mint_date);

-- Helper: get tier daily cap (in FUN units, not wei)
CREATE OR REPLACE FUNCTION public.fun_auto_mint_tier_cap(p_tier text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(p_tier,'new'))
    WHEN 'veteran' THEN 999999999999
    WHEN 'trusted' THEN 500000
    WHEN 'standard' THEN 100000
    WHEN 'new' THEN 10000
    -- T0/T1/T2/T3/T4 fallback mapping
    WHEN 't4' THEN 999999999999
    WHEN 't3' THEN 500000
    WHEN 't2' THEN 100000
    WHEN 't1' THEN 10000
    WHEN 't0' THEN 0
    ELSE 10000
  END::numeric
$$;

-- Helper: check & reserve cap atomically. Returns true if ok, false if exceeded.
CREATE OR REPLACE FUNCTION public.fun_auto_mint_reserve(
  p_user_id uuid,
  p_amount numeric,
  p_tier text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap numeric;
  v_used numeric;
BEGIN
  v_cap := public.fun_auto_mint_tier_cap(p_tier);

  INSERT INTO public.fun_auto_mint_daily (user_id, mint_date, amount_minted, claim_count, tier)
  VALUES (p_user_id, now()::date, 0, 0, p_tier)
  ON CONFLICT (user_id, mint_date) DO NOTHING;

  SELECT amount_minted INTO v_used
  FROM public.fun_auto_mint_daily
  WHERE user_id = p_user_id AND mint_date = now()::date
  FOR UPDATE;

  IF (v_used + p_amount) > v_cap THEN
    RETURN false;
  END IF;

  UPDATE public.fun_auto_mint_daily
  SET amount_minted = amount_minted + p_amount,
      claim_count = claim_count + 1,
      tier = p_tier,
      updated_at = now()
  WHERE user_id = p_user_id AND mint_date = now()::date;

  RETURN true;
END;
$$;

-- Refund cap if mint fails after reservation
CREATE OR REPLACE FUNCTION public.fun_auto_mint_refund(
  p_user_id uuid,
  p_amount numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.fun_auto_mint_daily
  SET amount_minted = greatest(0, amount_minted - p_amount),
      claim_count = greatest(0, claim_count - 1),
      updated_at = now()
  WHERE user_id = p_user_id AND mint_date = now()::date;
END;
$$;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_fun_auto_mint_daily_updated ON public.fun_auto_mint_daily;
CREATE TRIGGER trg_fun_auto_mint_daily_updated
  BEFORE UPDATE ON public.fun_auto_mint_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();