
-- Function to sync channel name when profile display_name changes
CREATE OR REPLACE FUNCTION public.sync_channel_name_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name AND NEW.display_name IS NOT NULL THEN
    UPDATE public.channels
    SET name = NEW.display_name
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Trigger on profiles table
CREATE TRIGGER trigger_sync_channel_name
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_channel_name_on_profile_update();
