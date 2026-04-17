ALTER TABLE public.pplp_mint_requests
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vvu_score numeric,
  ADD COLUMN IF NOT EXISTS engine_version text DEFAULT 'pplp-v2.0';

CREATE INDEX IF NOT EXISTS idx_pplp_mint_requests_engine_version
  ON public.pplp_mint_requests (engine_version);