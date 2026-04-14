
-- =============================================
-- PPLP Truth Validation Engine — Full Schema
-- CTO Diagram v13Apr2026
-- =============================================

-- 1. action_types — Predefined action categories
CREATE TABLE public.action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  pillar_group VARCHAR(50) NOT NULL,
  base_impact_score NUMERIC(5,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.action_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read action_types"
  ON public.action_types FOR SELECT
  USING (true);

-- Seed 6 action types
INSERT INTO public.action_types (code, name, pillar_group, base_impact_score) VALUES
  ('INNER_WORK', 'Thiền / Sám hối / Biết ơn', 'inner_work', 0.80),
  ('CHANNELING', 'Dẫn kênh / Chia sẻ ánh sáng', 'channeling', 1.00),
  ('GIVING', 'Gieo hạt tài chính / Cho đi', 'giving', 1.10),
  ('SOCIAL_IMPACT', 'Tác động xã hội / Giúp đỡ', 'social_impact', 1.10),
  ('SERVICE', 'Phụng sự cộng đồng / Build hệ sinh thái', 'service', 1.30),
  ('LEARNING', 'Học tập / Nghiên cứu', 'learning', 0.90);

-- 2. user_actions — User-submitted actions
CREATE TABLE public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type_id UUID NOT NULL REFERENCES public.action_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(30) NOT NULL DEFAULT 'submitted',
  source_platform VARCHAR(50),
  source_url TEXT,
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions"
  ON public.user_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view validated actions"
  ON public.user_actions FOR SELECT
  USING (status IN ('validated', 'minted'));

CREATE POLICY "Users can create own actions"
  ON public.user_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update action status"
  ON public.user_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_status ON public.user_actions(status);
CREATE INDEX idx_user_actions_submitted_at ON public.user_actions(submitted_at);

-- 3. proofs — Evidence for actions
CREATE TABLE public.proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.user_actions(id) ON DELETE CASCADE,
  proof_type VARCHAR(50) NOT NULL,
  proof_url TEXT,
  file_hash VARCHAR(255),
  external_ref VARCHAR(255),
  extracted_text TEXT,
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proofs of own actions"
  ON public.proofs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_actions ua WHERE ua.id = action_id AND ua.user_id = auth.uid()
  ));

CREATE POLICY "Users can view proofs of validated actions"
  ON public.proofs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_actions ua WHERE ua.id = action_id AND ua.status IN ('validated', 'minted')
  ));

CREATE POLICY "Users can attach proofs to own actions"
  ON public.proofs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_actions ua WHERE ua.id = action_id AND ua.user_id = auth.uid()
  ));

CREATE INDEX idx_proofs_action_id ON public.proofs(action_id);
CREATE INDEX idx_proofs_proof_url ON public.proofs(proof_url);

-- 4. pplp_validations — 5-pillar PPLP scoring
CREATE TABLE public.pplp_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.user_actions(id) ON DELETE CASCADE,
  serving_life NUMERIC(5,2) NOT NULL DEFAULT 0,
  transparent_truth NUMERIC(5,2) NOT NULL DEFAULT 0,
  healing_love NUMERIC(5,2) NOT NULL DEFAULT 0,
  long_term_value NUMERIC(5,2) NOT NULL DEFAULT 0,
  unity_over_separation NUMERIC(5,2) NOT NULL DEFAULT 0,
  ai_score NUMERIC(8,4) DEFAULT 0,
  community_score NUMERIC(8,4) DEFAULT 0,
  trust_signal_score NUMERIC(8,4) DEFAULT 0,
  final_light_score NUMERIC(20,8) DEFAULT 0,
  validation_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  explanation JSONB DEFAULT '{}'::jsonb,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pplp_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view validations of own actions"
  ON public.pplp_validations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_actions ua WHERE ua.id = action_id AND ua.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view validated results"
  ON public.pplp_validations FOR SELECT
  USING (validation_status IN ('validated', 'approved'));

CREATE INDEX idx_pplp_validations_action_id ON public.pplp_validations(action_id);

-- 5. community_reviews — Endorse/flag
CREATE TABLE public.community_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.user_actions(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  endorse_score NUMERIC(5,2) DEFAULT 0,
  flag_score NUMERIC(5,2) DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(action_id, reviewer_user_id)
);

ALTER TABLE public.community_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reviews"
  ON public.community_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.community_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can update own reviews"
  ON public.community_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_user_id);

CREATE INDEX idx_community_reviews_action_id ON public.community_reviews(action_id);

-- 6. mint_records — Mint with 99/1 split
CREATE TABLE public.mint_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.user_actions(id),
  user_id UUID NOT NULL,
  light_score NUMERIC(20,8) NOT NULL,
  mint_amount_total NUMERIC(30,8) NOT NULL,
  mint_amount_user NUMERIC(30,8) NOT NULL,
  mint_amount_platform NUMERIC(30,8) NOT NULL,
  release_mode VARCHAR(30) NOT NULL DEFAULT 'instant',
  claimable_now NUMERIC(30,8) DEFAULT 0,
  locked_amount NUMERIC(30,8) DEFAULT 0,
  mint_tx_hash VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mint_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mint records"
  ON public.mint_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_mint_records_user_id ON public.mint_records(user_id);
CREATE INDEX idx_mint_records_action_id ON public.mint_records(action_id);

-- 7. balance_ledger — Full audit trail
CREATE TABLE public.balance_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_type VARCHAR(50) NOT NULL,
  amount NUMERIC(30,8) NOT NULL,
  reference_table VARCHAR(50),
  reference_id UUID,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.balance_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger"
  ON public.balance_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_balance_ledger_user_id ON public.balance_ledger(user_id);
CREATE INDEX idx_balance_ledger_entry_type ON public.balance_ledger(entry_type);

-- 8. immutable_rules — Core protocol constants
CREATE TABLE public.immutable_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code VARCHAR(100) UNIQUE NOT NULL,
  rule_value JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.immutable_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read immutable rules"
  ON public.immutable_rules FOR SELECT
  USING (true);

-- Seed immutable rules
INSERT INTO public.immutable_rules (rule_code, rule_value) VALUES
  ('PPLP_DEFINITION', '{"value": "Proof of Pure Love Protocol"}'::jsonb),
  ('MINT_SPLIT', '{"user": 99, "platform": 1}'::jsonb),
  ('NO_PROOF_NO_SCORE', '{"enabled": true}'::jsonb),
  ('NO_SCORE_NO_MINT', '{"enabled": true}'::jsonb),
  ('ZERO_PILLAR_ZERO_SCORE', '{"enabled": true, "description": "Any pillar = 0 means total score = 0"}'::jsonb),
  ('BASE_MINT_RATE', '{"value": 10, "unit": "FUN"}'::jsonb),
  ('MAX_ACTIONS_PER_DAY', '{"scored": 10, "high_impact": 3}'::jsonb);

-- Updated_at trigger (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_actions_updated_at
  BEFORE UPDATE ON public.user_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mint_records_updated_at
  BEFORE UPDATE ON public.mint_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
