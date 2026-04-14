
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS total_light_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_level numeric NOT NULL DEFAULT 1.0;
