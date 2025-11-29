-- Add music_url field to profiles table for Suno music links
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS music_url TEXT;