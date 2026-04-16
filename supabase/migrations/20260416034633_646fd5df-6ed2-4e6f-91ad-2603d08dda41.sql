
-- =============================================
-- 1. epoch_config — Governance-configurable params
-- =============================================
CREATE TABLE public.epoch_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value NUMERIC NOT NULL,
  config_group TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.epoch_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view epoch_config"
  ON public.epoch_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage epoch_config"
  ON public.epoch_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. epoch_metrics — Per-epoch computed metrics
-- =============================================
CREATE TABLE public.epoch_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id TEXT NOT NULL,
  base_expansion NUMERIC NOT NULL DEFAULT 0,
  contribution_expansion NUMERIC NOT NULL DEFAULT 0,
  ecosystem_expansion NUMERIC NOT NULL DEFAULT 0,
  total_mint NUMERIC NOT NULL DEFAULT 0,
  discipline_modulator NUMERIC NOT NULL DEFAULT 1.0,
  adjusted_mint NUMERIC NOT NULL DEFAULT 0,
  final_mint NUMERIC NOT NULL DEFAULT 0,
  guardrail_flags JSONB DEFAULT '[]'::jsonb,
  health_snapshot JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.epoch_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view epoch_metrics"
  ON public.epoch_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage epoch_metrics"
  ON public.epoch_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. user_epoch_scores — Per-user snapshot
-- =============================================
CREATE TABLE public.user_epoch_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  epoch_id TEXT NOT NULL,
  preview_score NUMERIC DEFAULT 0,
  validated_score NUMERIC DEFAULT 0,
  finalized_score NUMERIC DEFAULT 0,
  trust_factor NUMERIC DEFAULT 1.0,
  fraud_factor NUMERIC DEFAULT 0,
  consistency_factor NUMERIC DEFAULT 0,
  utility_factor NUMERIC DEFAULT 0,
  weighted_score NUMERIC DEFAULT 0,
  trust_band TEXT DEFAULT 'new',
  burst_penalty NUMERIC DEFAULT 0,
  trust_ramp NUMERIC DEFAULT 0.5,
  cross_window_bonus NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, epoch_id)
);

ALTER TABLE public.user_epoch_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own epoch scores"
  ON public.user_epoch_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all epoch scores"
  ON public.user_epoch_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage epoch scores"
  ON public.user_epoch_scores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. reward_vesting_schedules — Lock/unlock
-- =============================================
CREATE TABLE public.reward_vesting_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  epoch_id TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  instant_amount NUMERIC NOT NULL DEFAULT 0,
  locked_amount NUMERIC NOT NULL DEFAULT 0,
  unlocked_amount NUMERIC NOT NULL DEFAULT 0,
  claimed_amount NUMERIC NOT NULL DEFAULT 0,
  token_state TEXT NOT NULL DEFAULT 'pending',
  next_unlock_at TIMESTAMPTZ,
  unlock_history JSONB DEFAULT '[]'::jsonb,
  contribution_unlock NUMERIC DEFAULT 0,
  usage_unlock NUMERIC DEFAULT 0,
  consistency_unlock NUMERIC DEFAULT 0,
  dormant_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, epoch_id)
);

ALTER TABLE public.reward_vesting_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vesting"
  ON public.reward_vesting_schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vesting"
  ON public.reward_vesting_schedules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage vesting"
  ON public.reward_vesting_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. treasury_vault_balances — 5 vaults
-- =============================================
CREATE TABLE public.treasury_vault_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_name TEXT NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  last_inflow_at TIMESTAMPTZ,
  last_outflow_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treasury_vault_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vault balances"
  ON public.treasury_vault_balances FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage vault balances"
  ON public.treasury_vault_balances FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 6. treasury_flows — Append-only log
-- =============================================
CREATE TABLE public.treasury_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_vault TEXT,
  to_vault TEXT,
  amount NUMERIC NOT NULL,
  reason TEXT,
  epoch_id TEXT,
  authorized_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treasury_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view treasury flows"
  ON public.treasury_flows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert treasury flows"
  ON public.treasury_flows FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7. inflation_health_metrics — Daily health
-- =============================================
CREATE TABLE public.inflation_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL UNIQUE,
  value_expansion_ratio NUMERIC DEFAULT 0,
  utility_absorption_ratio NUMERIC DEFAULT 0,
  retention_quality_ratio NUMERIC DEFAULT 0,
  fraud_pressure_ratio NUMERIC DEFAULT 0,
  locked_stability_ratio NUMERIC DEFAULT 0,
  supply_growth_rate NUMERIC DEFAULT 0,
  total_supply NUMERIC DEFAULT 0,
  circulating_supply NUMERIC DEFAULT 0,
  locked_supply NUMERIC DEFAULT 0,
  active_quality_users INTEGER DEFAULT 0,
  safe_mode_triggered BOOLEAN DEFAULT false,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inflation_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view health metrics"
  ON public.inflation_health_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage health metrics"
  ON public.inflation_health_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 8. governance_actions — Gov decisions
-- =============================================
CREATE TABLE public.governance_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  epoch_id TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  executed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);

ALTER TABLE public.governance_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view governance actions"
  ON public.governance_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage governance actions"
  ON public.governance_actions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 9. mint_batches — Finalized batches
-- =============================================
CREATE TABLE public.mint_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id TEXT NOT NULL,
  batch_number INTEGER NOT NULL DEFAULT 1,
  total_mint NUMERIC NOT NULL DEFAULT 0,
  user_count INTEGER NOT NULL DEFAULT 0,
  allocation_root TEXT,
  guardrail_flags JSONB DEFAULT '[]'::jsonb,
  governance_required BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(epoch_id, batch_number)
);

ALTER TABLE public.mint_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view mint batches"
  ON public.mint_batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage mint batches"
  ON public.mint_batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ALTER EXISTING TABLES
-- =============================================

-- mint_epochs: add adaptive mint fields
ALTER TABLE public.mint_epochs
  ADD COLUMN IF NOT EXISTS epoch_type TEXT DEFAULT 'mint',
  ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS base_expansion NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contribution_expansion NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ecosystem_expansion NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discipline_modulator NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS adjusted_mint NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_mint NUMERIC DEFAULT 0;

-- mint_allocations: add vesting fields
ALTER TABLE public.mint_allocations
  ADD COLUMN IF NOT EXISTS instant_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vesting_schedule_id UUID,
  ADD COLUMN IF NOT EXISTS trust_band TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS preview_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS validated_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finalized_score NUMERIC DEFAULT 0;

-- claim_requests: add token_state
ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS token_state TEXT DEFAULT 'claimable';

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_epoch_scores_user_epoch ON public.user_epoch_scores(user_id, epoch_id);
CREATE INDEX IF NOT EXISTS idx_reward_vesting_user ON public.reward_vesting_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_vesting_state ON public.reward_vesting_schedules(token_state);
CREATE INDEX IF NOT EXISTS idx_treasury_flows_epoch ON public.treasury_flows(epoch_id);
CREATE INDEX IF NOT EXISTS idx_inflation_health_date ON public.inflation_health_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_mint_batches_epoch ON public.mint_batches(epoch_id);
CREATE INDEX IF NOT EXISTS idx_epoch_metrics_epoch ON public.epoch_metrics(epoch_id);
CREATE INDEX IF NOT EXISTS idx_claim_requests_token_state ON public.claim_requests(token_state);
