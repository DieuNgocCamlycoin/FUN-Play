
-- Add previous_username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS previous_username text;

-- Create trigger to auto-save old username when it changes
CREATE OR REPLACE FUNCTION public.save_previous_username()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    NEW.previous_username := OLD.username;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_save_previous_username
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.save_previous_username();
