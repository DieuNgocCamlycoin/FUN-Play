-- Create post_comments table for post commenting system
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at);

-- Enable Row Level Security
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read non-deleted comments OR owners can see their own deleted comments
CREATE POLICY "Post comments are viewable by everyone"
ON public.post_comments
FOR SELECT
USING (is_deleted = false OR auth.uid() = user_id);

-- Policy: Authenticated users can create comments
CREATE POLICY "Authenticated users can create post comments"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Only comment owner can update (for soft delete and content edit)
CREATE POLICY "Users can update their own post comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for post_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;