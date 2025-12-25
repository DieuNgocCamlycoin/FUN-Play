-- Table: reward_config (admin can configure reward rates and limits)
CREATE TABLE public.reward_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config
CREATE POLICY "Reward config is viewable by everyone" 
ON public.reward_config 
FOR SELECT 
USING (true);

-- Only admins can update config
CREATE POLICY "Only admins can update reward config" 
ON public.reward_config 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert config
CREATE POLICY "Only admins can insert reward config" 
ON public.reward_config 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default reward configuration
INSERT INTO public.reward_config (config_key, config_value, description) VALUES
  ('VIEW_REWARD', 10000, 'CAMLY earned per valid view'),
  ('COMMENT_REWARD', 5000, 'CAMLY earned per valid comment'),
  ('UPLOAD_REWARD', 100000, 'CAMLY earned per video/audio upload'),
  ('LIKE_REWARD', 2000, 'CAMLY earned per like given'),
  ('CREATOR_VIEW_REWARD', 5000, 'CAMLY earned by creator per view on their content'),
  ('DAILY_VIEW_LIMIT', 100000, 'Max CAMLY from views per day'),
  ('DAILY_COMMENT_LIMIT', 50000, 'Max CAMLY from comments per day'),
  ('DAILY_UPLOAD_LIMIT', 10, 'Max rewarded uploads per day'),
  ('MIN_WATCH_PERCENTAGE', 30, 'Minimum watch percentage for valid view'),
  ('MIN_COMMENT_LENGTH', 5, 'Minimum characters for valid comment'),
  ('MAX_COMMENTS_PER_VIDEO', 5, 'Max rewarded comments per video per day');

-- Table: content_hashes (for content uniqueness validation)
CREATE TABLE public.content_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  content_hash TEXT UNIQUE NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_hashes ENABLE ROW LEVEL SECURITY;

-- Everyone can read content hashes
CREATE POLICY "Content hashes are viewable by everyone" 
ON public.content_hashes 
FOR SELECT 
USING (true);

-- Users can insert their own content hashes
CREATE POLICY "Users can insert content hashes for their videos" 
ON public.content_hashes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.videos 
    WHERE id = video_id AND user_id = auth.uid()
  )
);

-- Table: reward_config_history (track changes)
CREATE TABLE public.reward_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.reward_config(id),
  config_key TEXT NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_config_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view history
CREATE POLICY "Only admins can view config history" 
ON public.reward_config_history 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert history
CREATE POLICY "Only admins can insert config history" 
ON public.reward_config_history 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));