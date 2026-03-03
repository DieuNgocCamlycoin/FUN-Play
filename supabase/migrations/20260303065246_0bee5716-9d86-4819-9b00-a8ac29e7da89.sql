
-- Bảng livestreams
CREATE TABLE public.livestreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT DEFAULT 'general',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  total_donations NUMERIC NOT NULL DEFAULT 0,
  vod_video_id UUID REFERENCES public.videos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;

-- Ai cũng xem được livestream đang live hoặc đã kết thúc
CREATE POLICY "Anyone can view live/ended livestreams"
  ON public.livestreams FOR SELECT
  USING (status IN ('live', 'ended'));

-- Chủ sở hữu xem được tất cả livestream của mình (kể cả draft)
CREATE POLICY "Owners can view own livestreams"
  ON public.livestreams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Chủ sở hữu tạo livestream
CREATE POLICY "Owners can create livestreams"
  ON public.livestreams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Chủ sở hữu cập nhật livestream
CREATE POLICY "Owners can update own livestreams"
  ON public.livestreams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index cho truy vấn nhanh
CREATE INDEX idx_livestreams_status ON public.livestreams(status);
CREATE INDEX idx_livestreams_user_id ON public.livestreams(user_id);

-- Bảng livestream_chat
CREATE TABLE public.livestream_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livestream_id UUID NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.livestream_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read livestream chat"
  ON public.livestream_chat FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send chat"
  ON public.livestream_chat FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_livestream_chat_livestream ON public.livestream_chat(livestream_id, created_at);

-- Bảng livestream_reactions
CREATE TABLE public.livestream_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livestream_id UUID NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.livestream_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions"
  ON public.livestream_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can react"
  ON public.livestream_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_livestream_reactions_livestream ON public.livestream_reactions(livestream_id);

-- Bật Realtime cho chat và reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestreams;

-- Trigger thông báo khi livestream bắt đầu
CREATE OR REPLACE FUNCTION public.notify_livestream_start()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, thumbnail_url)
    SELECT 
      s.user_id,
      'livestream',
      '🔴 Đang phát sóng trực tiếp!',
      (SELECT COALESCE(display_name, username) FROM profiles WHERE id = NEW.user_id) || ' đang phát sóng: ' || NEW.title,
      '/live/' || NEW.id,
      NEW.thumbnail_url
    FROM subscriptions s
    JOIN channels c ON c.id = s.channel_id
    WHERE c.user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_livestream_status_change
  AFTER UPDATE OF status ON public.livestreams
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_livestream_start();
