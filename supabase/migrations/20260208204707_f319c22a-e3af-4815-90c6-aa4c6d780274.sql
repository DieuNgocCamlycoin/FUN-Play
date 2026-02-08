
-- Add like_rewards_earned and share_rewards_earned columns to daily_reward_limits
ALTER TABLE public.daily_reward_limits 
ADD COLUMN IF NOT EXISTS like_rewards_earned integer NOT NULL DEFAULT 0;

ALTER TABLE public.daily_reward_limits 
ADD COLUMN IF NOT EXISTS share_rewards_earned integer NOT NULL DEFAULT 0;
