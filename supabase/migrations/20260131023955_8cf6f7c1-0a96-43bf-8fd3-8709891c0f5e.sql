-- Create table for post comment likes
CREATE TABLE public.post_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate likes
CREATE UNIQUE INDEX idx_post_comment_likes_unique ON public.post_comment_likes (comment_id, user_id);

-- Create indexes for performance
CREATE INDEX idx_post_comment_likes_comment_id ON public.post_comment_likes (comment_id);
CREATE INDEX idx_post_comment_likes_user_id ON public.post_comment_likes (user_id);

-- Enable Row Level Security
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view likes
CREATE POLICY "Post comment likes are viewable by everyone"
  ON public.post_comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Authenticated users can like post comments"
  ON public.post_comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can unlike their own post comment likes"
  ON public.post_comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);