CREATE OR REPLACE FUNCTION public.notify_livestream_start()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, thumbnail_url)
    SELECT 
      s.subscriber_id,
      'livestream',
      '🔴 Đang phát sóng trực tiếp!',
      (SELECT COALESCE(display_name, username) FROM profiles WHERE id = NEW.user_id) 
        || ' đang phát sóng: ' || NEW.title,
      '/live/' || NEW.id,
      NEW.thumbnail_url
    FROM subscriptions s
    JOIN channels c ON c.id = s.channel_id
    WHERE c.user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;