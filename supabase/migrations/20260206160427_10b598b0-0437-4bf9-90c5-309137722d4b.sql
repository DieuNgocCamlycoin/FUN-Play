
-- Add new columns to comments table
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_hearted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS hearted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS hearted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_dislike BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own likes" ON public.comment_likes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Trigger function to auto-update like_count and dislike_count
CREATE OR REPLACE FUNCTION public.update_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_dislike THEN
      UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_dislike THEN
      UPDATE comments SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_dislike AND NOT NEW.is_dislike THEN
      UPDATE comments SET dislike_count = GREATEST(0, dislike_count - 1), like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF NOT OLD.is_dislike AND NEW.is_dislike THEN
      UPDATE comments SET like_count = GREATEST(0, like_count - 1), dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER trigger_update_comment_likes
  AFTER INSERT OR DELETE OR UPDATE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_like_counts();
