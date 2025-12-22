-- Add file_size column to videos table for tracking video file sizes
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.videos.file_size IS 'Video file size in bytes';