-- 1. pplp_activity_submissions — multi-platform activity tracking
CREATE TABLE public.pplp_activity_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'post',
  platform TEXT NOT NULL DEFAULT 'internal',
  content TEXT,
  metrics JSONB DEFAULT '{}',
  proof_link TEXT,
  proof_status TEXT NOT NULL DEFAULT 'pending',
  ai_analysis JSONB,
  fraud_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pplp_activity_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON public.pplp_activity_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
  ON public.pplp_activity_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON public.pplp_activity_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON public.pplp_activity_submissions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_pplp_submissions_user ON public.pplp_activity_submissions(user_id);
CREATE INDEX idx_pplp_submissions_platform ON public.pplp_activity_submissions(platform);
CREATE INDEX idx_pplp_submissions_status ON public.pplp_activity_submissions(proof_status);

-- 2. pplp_model_weights — adjustable AI scoring weights
CREATE TABLE public.pplp_model_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dimension TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.pplp_model_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read model weights"
  ON public.pplp_model_weights FOR SELECT
  USING (true);

-- Seed initial weights
INSERT INTO public.pplp_model_weights (dimension, weight, version) VALUES
  ('intent', 1.0, 1),
  ('depth', 1.0, 1),
  ('impact', 1.0, 1),
  ('consistency', 1.0, 1),
  ('trust', 1.0, 1);

-- 3. Add light_score_v2 to profiles (∞ scale, accumulative)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS light_score_v2 NUMERIC DEFAULT 0;

-- Updated_at trigger for submissions
CREATE TRIGGER update_pplp_submissions_updated_at
  BEFORE UPDATE ON public.pplp_activity_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();