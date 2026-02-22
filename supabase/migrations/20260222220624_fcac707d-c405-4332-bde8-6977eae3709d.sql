
-- Fix search_path for handle_channel_report
CREATE OR REPLACE FUNCTION public.handle_channel_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.channels SET report_count = report_count + 1 WHERE id = NEW.channel_id;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, 'warning', 'Báo cáo kênh mới',
    'Có báo cáo mới với lý do: ' || NEW.reason,
    '/admin?section=reports'
  FROM public.user_roles ur WHERE ur.role IN ('admin', 'owner');
  RETURN NEW;
END;
$$;

-- Fix search_path for handle_video_report_notify
CREATE OR REPLACE FUNCTION public.handle_video_report_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, 'warning', 'Báo cáo video mới',
    'Có báo cáo video mới với lý do: ' || NEW.reason,
    '/admin?section=reports'
  FROM public.user_roles ur WHERE ur.role IN ('admin', 'owner');
  RETURN NEW;
END;
$$;
