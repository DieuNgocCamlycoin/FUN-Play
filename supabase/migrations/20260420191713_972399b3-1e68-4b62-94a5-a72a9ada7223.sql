-- ============================================
-- 1) claim_requests: GOV signing + state machine
-- ============================================
ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS epoch_id text,
  ADD COLUMN IF NOT EXISTS gov_signatures jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gov_completed_groups text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gov_signatures_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gov_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='claim_requests' AND column_name='token_state'
  ) THEN
    ALTER TABLE public.claim_requests ADD COLUMN token_state text NOT NULL DEFAULT 'locked';
  ELSE
    ALTER TABLE public.claim_requests ALTER COLUMN token_state SET DEFAULT 'locked';
    UPDATE public.claim_requests SET token_state='locked' WHERE token_state IS NULL;
  END IF;
END $$;

UPDATE public.claim_requests
SET gov_required = false,
    epoch_id = 'legacy-' || id::text
WHERE epoch_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_claim_requests_user_epoch_type
  ON public.claim_requests (user_id, epoch_id, claim_type)
  WHERE epoch_id IS NOT NULL AND epoch_id NOT LIKE 'legacy-%';

CREATE INDEX IF NOT EXISTS idx_claim_requests_gov_ready
  ON public.claim_requests (status, gov_signatures_count, tx_hash)
  WHERE tx_hash IS NULL;

CREATE INDEX IF NOT EXISTS idx_claim_requests_epoch
  ON public.claim_requests (epoch_id, status);

-- ============================================
-- 2) epoch_pools: per-epoch pool & switches
-- (separate from existing key-value epoch_config table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.epoch_pools (
  epoch_id text PRIMARY KEY,
  pool_total numeric NOT NULL DEFAULT 30000000,
  auto_process_enabled boolean NOT NULL DEFAULT true,
  gov_required boolean NOT NULL DEFAULT true,
  notes text,
  started_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.epoch_pools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "epoch_pools readable by authenticated" ON public.epoch_pools;
CREATE POLICY "epoch_pools readable by authenticated"
  ON public.epoch_pools FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "epoch_pools admin manage" ON public.epoch_pools;
CREATE POLICY "epoch_pools admin manage"
  ON public.epoch_pools FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid()));

DROP TRIGGER IF EXISTS trg_epoch_pools_updated ON public.epoch_pools;
CREATE TRIGGER trg_epoch_pools_updated
  BEFORE UPDATE ON public.epoch_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.epoch_pools (epoch_id, pool_total, auto_process_enabled, gov_required, notes)
VALUES
  ('2026-04', 30000000, true, true, 'Epoch tháng 4/2026 — quỹ 30M FUN, GOV 3/3 bắt buộc')
ON CONFLICT (epoch_id) DO NOTHING;

-- ============================================
-- 3) Helper: claim ready for on-chain transfer
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_is_chain_ready(p_claim_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.claim_requests
    WHERE id = p_claim_id
      AND tx_hash IS NULL
      AND status IN ('pending','approved','approved_for_chain')
      AND (gov_required = false OR gov_signatures_count >= 3)
  );
$$;