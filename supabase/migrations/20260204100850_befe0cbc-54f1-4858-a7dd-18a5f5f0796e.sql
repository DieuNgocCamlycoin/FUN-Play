-- =============================================
-- FUN PLAY AUTOMATIC REWARD SYSTEM UPGRADE
-- =============================================

-- 1. Create reward_actions table (prevent duplicate rewards for LIKE/SHARE)
CREATE TABLE IF NOT EXISTS public.reward_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('VIEW', 'LIKE', 'SHARE')),
  rewarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, video_id, action_type)
);

-- Enable RLS on reward_actions
ALTER TABLE public.reward_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reward_actions
CREATE POLICY "Users can view own reward actions" ON public.reward_actions
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Create ip_tracking table (anti-multi-account fraud)
CREATE TABLE IF NOT EXISTS public.ip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('signup', 'wallet_connect', 'claim')),
  wallet_address TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for ip_tracking
CREATE INDEX IF NOT EXISTS idx_ip_tracking_hash ON public.ip_tracking(ip_hash);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_user ON public.ip_tracking(user_id);

-- Enable RLS on ip_tracking
ALTER TABLE public.ip_tracking ENABLE ROW LEVEL SECURITY;

-- Admins can manage ip_tracking
CREATE POLICY "Admins can manage ip_tracking" ON public.ip_tracking
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create daily_claim_records table (daily claim limits)
CREATE TABLE IF NOT EXISTS public.daily_claim_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_claimed NUMERIC DEFAULT 0,
  claim_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS on daily_claim_records
ALTER TABLE public.daily_claim_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_claim_records
CREATE POLICY "Users can view own daily claims" ON public.daily_claim_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily claims" ON public.daily_claim_records
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add new columns to daily_reward_limits for count-based tracking
ALTER TABLE public.daily_reward_limits
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS short_video_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS long_video_count INTEGER DEFAULT 0;

-- 5. Add new columns to profiles for suspicious score tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspicious_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signup_ip_hash TEXT;

-- 6. Add column to videos for tracking if upload reward was given
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS upload_rewarded BOOLEAN DEFAULT false;

-- 7. Insert new reward config values
INSERT INTO public.reward_config (config_key, config_value, description) VALUES
('SHORT_VIDEO_REWARD', 20000, 'CAMLY for short video upload (<3min)'),
('LONG_VIDEO_REWARD', 70000, 'CAMLY for long video upload (>=3min)'),
('DAILY_VIEW_COUNT_LIMIT', 10, 'Max view rewards per day'),
('DAILY_LIKE_COUNT_LIMIT', 20, 'Max like rewards per day'),
('DAILY_SHARE_COUNT_LIMIT', 10, 'Max share rewards per day'),
('DAILY_COMMENT_COUNT_LIMIT', 10, 'Max comment rewards per day'),
('DAILY_SHORT_VIDEO_LIMIT', 5, 'Max short video rewards per day'),
('DAILY_LONG_VIDEO_LIMIT', 3, 'Max long video rewards per day'),
('SHORT_VIDEO_MAX_DURATION', 180, 'Max seconds for short video (3 min)'),
('MIN_VIEWS_FOR_UPLOAD_REWARD', 3, 'Views needed for creator upload reward'),
('DAILY_CLAIM_LIMIT', 500000, 'Max CAMLY claim per day'),
('MIN_CLAIM_AMOUNT', 200000, 'Min CAMLY required to claim'),
('AUTO_APPROVE_THRESHOLD', 3, 'Suspicious score threshold for auto-approve'),
('MIN_COMMENT_LENGTH', 20, 'Minimum comment length for reward')
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description;