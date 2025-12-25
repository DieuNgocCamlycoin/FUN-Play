-- Add user_sessions table for anti-fraud session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Add spam detection columns to comment_logs
ALTER TABLE public.comment_logs 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.user_sessions(id);

-- Add index for duplicate comment detection
CREATE INDEX IF NOT EXISTS idx_comment_logs_content_hash ON public.comment_logs(content_hash);
CREATE INDEX IF NOT EXISTS idx_comment_logs_user_created ON public.comment_logs(user_id, created_at);

-- Add session_id to view_logs for better tracking
ALTER TABLE public.view_logs 
ADD COLUMN IF NOT EXISTS session_ref UUID REFERENCES public.user_sessions(id);

-- Add index for view deduplication
CREATE INDEX IF NOT EXISTS idx_view_logs_user_video_created ON public.view_logs(user_id, video_id, created_at);

-- Add pending_rewards column to profiles for unclaimed rewards tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pending_rewards NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_claim_at TIMESTAMP WITH TIME ZONE;

-- Add claim_requests enhancements
ALTER TABLE public.claim_requests 
ADD COLUMN IF NOT EXISTS claim_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS gas_fee NUMERIC DEFAULT 0;

-- Create index for faster claim history queries
CREATE INDEX IF NOT EXISTS idx_claim_requests_user_created ON public.claim_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_created ON public.reward_transactions(user_id, created_at DESC);