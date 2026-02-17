
-- Add social media URL columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_url text;
