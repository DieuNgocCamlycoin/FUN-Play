-- Create table to track video migration progress
CREATE TABLE public.video_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  original_video_url TEXT NOT NULL,
  original_thumbnail_url TEXT,
  new_video_url TEXT,
  new_thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT unique_video_migration UNIQUE(video_id)
);

-- Enable RLS
ALTER TABLE public.video_migrations ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage migrations
CREATE POLICY "Admins can manage video migrations"
ON public.video_migrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_video_migrations_status ON public.video_migrations(status);
CREATE INDEX idx_video_migrations_video_id ON public.video_migrations(video_id);