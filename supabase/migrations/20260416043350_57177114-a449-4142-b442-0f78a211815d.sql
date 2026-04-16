-- PPLP v2.5: Add VVU columns to user_actions
ALTER TABLE public.user_actions
  ADD COLUMN IF NOT EXISTS vvu_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iis_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impact_multiplier numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anti_abuse_factor numeric DEFAULT 1;

-- Light Score 3-tier tracking table
CREATE TABLE IF NOT EXISTS public.light_score_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  raw_pls numeric DEFAULT 0,
  raw_nls numeric DEFAULT 0,
  raw_lls numeric DEFAULT 0,
  raw_tls numeric DEFAULT 0,
  display_tls numeric DEFAULT 0,
  tier_id text DEFAULT 'seed_light',
  trust_tier text DEFAULT 'new',
  consistency_multiplier numeric DEFAULT 1,
  reliability_multiplier numeric DEFAULT 1,
  governance_weight numeric DEFAULT 0,
  mint_mode text DEFAULT 'basic',
  computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.light_score_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own light score tiers"
  ON public.light_score_tiers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Smart Activation status table
CREATE TABLE IF NOT EXISTS public.smart_activation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  earning_enabled boolean DEFAULT false,
  voting_enabled boolean DEFAULT false,
  proposal_enabled boolean DEFAULT false,
  mentor_enabled boolean DEFAULT false,
  curator_enabled boolean DEFAULT false,
  validator_enabled boolean DEFAULT false,
  activated_at timestamptz,
  last_check_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.smart_activation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activation status"
  ON public.smart_activation FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- VVU event log (append-only ledger)
CREATE TABLE IF NOT EXISTS public.vvu_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_id uuid,
  event_type text NOT NULL,
  base_value numeric DEFAULT 0,
  quality_score numeric DEFAULT 0,
  trust_weight numeric DEFAULT 0,
  iis numeric DEFAULT 0,
  impact_multiplier numeric DEFAULT 0,
  anti_abuse_factor numeric DEFAULT 1,
  erp numeric DEFAULT 1,
  final_vvu numeric DEFAULT 0,
  layer_scores jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vvu_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own VVU ledger"
  ON public.vvu_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast aggregation
CREATE INDEX IF NOT EXISTS idx_vvu_ledger_user_date ON public.vvu_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_light_score_tiers_user ON public.light_score_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_vvu ON public.user_actions(user_id, status) WHERE vvu_score > 0;