
-- Table for storing identity verification proofs
CREATE TABLE IF NOT EXISTS public.user_identity_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  proof_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'system',
  proof_hash TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_identity_proofs_user ON public.user_identity_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_proofs_type ON public.user_identity_proofs(proof_type);

-- RLS
ALTER TABLE public.user_identity_proofs ENABLE ROW LEVEL SECURITY;

-- Users can view their own proofs
CREATE POLICY "Users can view own identity proofs"
  ON public.user_identity_proofs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own proofs
CREATE POLICY "Users can insert own identity proofs"
  ON public.user_identity_proofs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
