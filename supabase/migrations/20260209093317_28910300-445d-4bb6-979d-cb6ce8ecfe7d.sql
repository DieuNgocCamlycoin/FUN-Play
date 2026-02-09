
-- 1. Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own likes" ON public.post_likes FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);

-- 2. Add emoji column to post_comment_likes
ALTER TABLE public.post_comment_likes ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '❤️';

-- 3. Create trigger to auto-update posts.like_count
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 4. Create trigger to auto-update post_comments.like_count
CREATE OR REPLACE FUNCTION public.update_post_comment_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_post_comment_likes
AFTER INSERT OR DELETE ON post_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_post_comment_like_count();
