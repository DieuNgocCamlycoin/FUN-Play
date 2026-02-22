
-- Tao bang channel_reports
CREATE TABLE public.channel_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, reporter_id)
);
ALTER TABLE public.channel_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own channel reports" ON public.channel_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own channel reports" ON public.channel_reports
  FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage channel reports" ON public.channel_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Them cot detail vao video_reports
ALTER TABLE public.video_reports ADD COLUMN IF NOT EXISTS detail TEXT;

-- Them report_count vao channels
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Trigger tang report_count cho channels + thong bao admin
CREATE OR REPLACE FUNCTION public.handle_channel_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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

CREATE TRIGGER on_channel_report_insert
  AFTER INSERT ON public.channel_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_channel_report();

-- Trigger thong bao admin khi co video report moi
CREATE OR REPLACE FUNCTION public.handle_video_report_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, 'warning', 'Báo cáo video mới',
    'Có báo cáo video mới với lý do: ' || NEW.reason,
    '/admin?section=reports'
  FROM public.user_roles ur WHERE ur.role IN ('admin', 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_video_report_insert
  AFTER INSERT ON public.video_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_video_report_notify();
