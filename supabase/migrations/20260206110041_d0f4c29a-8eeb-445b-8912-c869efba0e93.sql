
-- ============================================
-- TABLE: ai_generated_music
-- ============================================
CREATE TABLE public.ai_generated_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT,
  lyrics TEXT,
  style TEXT DEFAULT 'pop',
  voice_type TEXT DEFAULT 'female',
  instrumental BOOLEAN DEFAULT false,
  audio_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  suno_task_id TEXT,
  suno_song_id TEXT,
  is_public BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generated_music ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public AI music"
  ON public.ai_generated_music FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own AI music"
  ON public.ai_generated_music FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI music"
  ON public.ai_generated_music FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI music"
  ON public.ai_generated_music FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI music"
  ON public.ai_generated_music FOR DELETE
  USING (auth.uid() = user_id);

-- Service role policy for edge functions (callback)
CREATE POLICY "Service role can update any AI music"
  ON public.ai_generated_music FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_ai_generated_music_updated_at
  BEFORE UPDATE ON public.ai_generated_music
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_ai_music_user_id ON public.ai_generated_music (user_id);
CREATE INDEX idx_ai_music_status ON public.ai_generated_music (status);
CREATE INDEX idx_ai_music_is_public ON public.ai_generated_music (is_public);
CREATE INDEX idx_ai_music_suno_task_id ON public.ai_generated_music (suno_task_id);

-- ============================================
-- TABLE: ai_music_likes
-- ============================================
CREATE TABLE public.ai_music_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  music_id UUID NOT NULL REFERENCES public.ai_generated_music(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, music_id)
);

-- Enable RLS
ALTER TABLE public.ai_music_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view likes"
  ON public.ai_music_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.ai_music_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.ai_music_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update like_count
CREATE OR REPLACE FUNCTION public.update_ai_music_like_count()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_generated_music
    SET like_count = like_count + 1
    WHERE id = NEW.music_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_generated_music
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.music_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_ai_music_like_count
  AFTER INSERT OR DELETE ON public.ai_music_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_music_like_count();

-- Enable Realtime for completion notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_generated_music;
