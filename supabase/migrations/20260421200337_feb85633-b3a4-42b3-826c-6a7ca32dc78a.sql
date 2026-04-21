-- ============================================================================
-- pplp_mint_requests_v2: New table for lockWithPPLP v1 mint pipeline
-- ============================================================================

CREATE TABLE public.pplp_mint_requests_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipient_address text NOT NULL,
  action_name text NOT NULL DEFAULT 'FUN_REWARD',
  action_hash text NOT NULL,                    -- 0x-prefixed keccak256 hex
  amount_wei numeric NOT NULL,
  amount_display numeric NOT NULL,
  evidence_hash text NOT NULL,                  -- 0x-prefixed keccak256 hex
  evidence_payload jsonb,                       -- raw evidence for audit
  policy_version integer NOT NULL DEFAULT 1,
  nonce numeric NOT NULL,
  deadline bigint NOT NULL,
  digest text NOT NULL,                         -- 0x-prefixed EIP-712 digest
  signatures jsonb NOT NULL DEFAULT '[]'::jsonb,
  signatures_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_sig'
    CHECK (status IN ('pending_sig','signed','broadcasting','minted','failed','cancelled','expired')),
  tx_hash text,
  block_number bigint,
  error_message text,
  processing_attempts integer NOT NULL DEFAULT 0,
  locked_at timestamptz,
  source text NOT NULL DEFAULT 'auto-mint',     -- auto-mint | claim | manual
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  minted_at timestamptz
);

CREATE INDEX idx_pplp_mr_v2_status_created ON public.pplp_mint_requests_v2 (status, created_at);
CREATE INDEX idx_pplp_mr_v2_user_status ON public.pplp_mint_requests_v2 (user_id, status);
CREATE INDEX idx_pplp_mr_v2_recipient ON public.pplp_mint_requests_v2 (recipient_address);
CREATE INDEX idx_pplp_mr_v2_deadline ON public.pplp_mint_requests_v2 (deadline) WHERE status IN ('pending_sig','signed');

-- updated_at trigger
CREATE TRIGGER trg_pplp_mr_v2_updated_at
  BEFORE UPDATE ON public.pplp_mint_requests_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.pplp_mint_requests_v2 ENABLE ROW LEVEL SECURITY;

-- User can view own requests
CREATE POLICY "Users view own mint requests v2"
ON public.pplp_mint_requests_v2 FOR SELECT
USING (auth.uid() = user_id);

-- Attester (active gov_attesters wallet) can view all
CREATE POLICY "Attesters view all mint requests v2"
ON public.pplp_mint_requests_v2 FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gov_attesters ga
    JOIN public.profiles p ON lower(p.wallet_address) = lower(ga.wallet_address)
    WHERE p.id = auth.uid() AND ga.is_active = true
  )
);

-- Attester can update signatures (only signatures + signatures_count + status if needed handled by edge fn)
CREATE POLICY "Attesters update mint requests v2"
ON public.pplp_mint_requests_v2 FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.gov_attesters ga
    JOIN public.profiles p ON lower(p.wallet_address) = lower(ga.wallet_address)
    WHERE p.id = auth.uid() AND ga.is_active = true
  )
);

-- Service role full access (implicit via service_role bypass, but explicit policy for clarity)
CREATE POLICY "Service role full access mint requests v2"
ON public.pplp_mint_requests_v2 FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
