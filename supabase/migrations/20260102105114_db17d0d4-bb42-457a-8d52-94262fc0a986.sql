-- Add approval_status and sub_category columns to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sub_category TEXT DEFAULT NULL;

-- Update existing videos to approved status (keep them as-is)
UPDATE public.videos SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_videos_approval_status ON public.videos(approval_status);
CREATE INDEX IF NOT EXISTS idx_videos_sub_category ON public.videos(sub_category);

-- Add check constraint for valid sub_category values
ALTER TABLE public.videos 
ADD CONSTRAINT valid_sub_category 
CHECK (sub_category IS NULL OR sub_category IN ('music', 'light_meditation', 'sound_therapy', 'mantra'));