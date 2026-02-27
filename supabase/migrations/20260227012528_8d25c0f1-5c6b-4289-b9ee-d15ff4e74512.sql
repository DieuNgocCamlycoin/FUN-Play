
-- =============================================
-- MINT PIPELINE + PROFILE PPLP FIELDS
-- =============================================

-- Profile PPLP fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pplp_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pplp_version TEXT DEFAULT 'v2.0',
  ADD COLUMN IF NOT EXISTS mantra_ack_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_pct INTEGER DEFAULT 0;

-- MINT_EPOCHS - epoch-based mint pool
CREATE TABLE public.mint_epochs (
  epoch_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  mint_pool_amount NUMERIC NOT NULL DEFAULT 0,
  rules_version TEXT NOT NULL DEFAULT 'v2.0',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'onchain')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ,
  onchain_tx_hash TEXT,
  UNIQUE (period_start, period_end)
);

ALTER TABLE public.mint_epochs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view finalized epochs"
  ON public.mint_epochs FOR SELECT
  USING (status IN ('finalized', 'onchain'));

CREATE POLICY "Admins can manage epochs"
  ON public.mint_epochs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- MINT_ALLOCATIONS - per-user allocation in each epoch
CREATE TABLE public.mint_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id UUID NOT NULL REFERENCES public.mint_epochs(epoch_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eligible BOOLEAN NOT NULL DEFAULT false,
  allocation_amount NUMERIC NOT NULL DEFAULT 0,
  reason_codes TEXT[] DEFAULT '{}',
  light_score_at_epoch INTEGER DEFAULT 0,
  level_at_epoch TEXT DEFAULT 'presence',
  onchain_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (epoch_id, user_id)
);

CREATE INDEX idx_allocations_epoch ON public.mint_allocations (epoch_id);
CREATE INDEX idx_allocations_user ON public.mint_allocations (user_id, created_at DESC);

ALTER TABLE public.mint_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allocations"
  ON public.mint_allocations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage allocations"
  ON public.mint_allocations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- FEATURES_USER_DAY - materialized daily features for scoring
CREATE TABLE public.features_user_day (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count_posts INTEGER DEFAULT 0,
  count_comments INTEGER DEFAULT 0,
  count_videos INTEGER DEFAULT 0,
  count_likes_given INTEGER DEFAULT 0,
  count_shares INTEGER DEFAULT 0,
  count_help INTEGER DEFAULT 0,
  count_reports_valid INTEGER DEFAULT 0,
  count_donations INTEGER DEFAULT 0,
  avg_rating_weighted NUMERIC DEFAULT 0,
  consistency_streak INTEGER DEFAULT 0,
  sequence_count INTEGER DEFAULT 0,
  anti_farm_risk NUMERIC DEFAULT 0 CHECK (anti_farm_risk BETWEEN 0 AND 1),
  onchain_value_score NUMERIC DEFAULT 0,
  checkin_done BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX idx_features_date ON public.features_user_day (date DESC);

ALTER TABLE public.features_user_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own features"
  ON public.features_user_day FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage features"
  ON public.features_user_day FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- FK from light_score_ledger to score_explanations
ALTER TABLE public.light_score_ledger
  ADD CONSTRAINT fk_ledger_explain
  FOREIGN KEY (explain_ref) REFERENCES public.score_explanations(explain_ref);
