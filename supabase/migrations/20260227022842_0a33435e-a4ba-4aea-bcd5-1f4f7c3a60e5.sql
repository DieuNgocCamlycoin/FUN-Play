
-- 1. Create scoring_rules table
CREATE TABLE public.scoring_rules (
  rule_version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  formula_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  weight_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  multiplier_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  penalty_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scoring rules"
  ON public.scoring_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage scoring rules"
  ON public.scoring_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add rule_version to light_score_ledger
ALTER TABLE public.light_score_ledger
  ADD COLUMN IF NOT EXISTS rule_version TEXT NOT NULL DEFAULT 'V1.0';

-- 3. Add anti_whale_capped to mint_allocations
ALTER TABLE public.mint_allocations
  ADD COLUMN IF NOT EXISTS anti_whale_capped BOOLEAN NOT NULL DEFAULT false;

-- 4. Seed V1.0 rule
INSERT INTO public.scoring_rules (rule_version, name, description, formula_json, weight_config_json, multiplier_config_json, penalty_config_json, effective_from, status)
VALUES (
  'V1.0',
  'PPLP Light Score V1',
  'Initial scoring model: weighted pillars + reputation + consistency + sequences - integrity penalty',
  '{"base": "sum(pillars_weighted)", "reputation_weight": true, "consistency_multiplier": true, "sequence_multiplier": true, "integrity_penalty": true}'::jsonb,
  '{"S": 0.25, "T": 0.20, "H": 0.20, "C": 0.20, "U": 0.15}'::jsonb,
  '{"consistency": {"7d": 1.1, "30d": 1.3, "90d": 1.6}, "reputation": {"30d": 0.7, "90d": 0.8, "180d": 0.9, "365d": 1.0}, "sequence_bonus": {"mentor_chain": 15, "conflict_harmony": 10, "charity_chain": 12, "builder_streak": 20}}'::jsonb,
  '{"anti_farm_penalty": 0.5, "min_integrity": 0.6}'::jsonb,
  now(),
  'active'
);
