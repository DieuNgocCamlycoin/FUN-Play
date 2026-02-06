
-- 1. Add missing columns to bounty_submissions
ALTER TABLE public.bounty_submissions 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS contribution_type text NOT NULL DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;

-- 2. Create bounty_upvotes table
CREATE TABLE IF NOT EXISTS public.bounty_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.bounty_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

ALTER TABLE public.bounty_upvotes ENABLE ROW LEVEL SECURITY;

-- 3. Update RLS policies on bounty_submissions (make public)
DROP POLICY IF EXISTS "Users can view own bounty submissions" ON public.bounty_submissions;
DROP POLICY IF EXISTS "Admins can view all bounty submissions" ON public.bounty_submissions;
DROP POLICY IF EXISTS "Users can create bounty submissions" ON public.bounty_submissions;

CREATE POLICY "Bounty submissions are viewable by everyone"
  ON public.bounty_submissions FOR SELECT USING (true);

CREATE POLICY "Anyone can create bounty submissions"
  ON public.bounty_submissions FOR INSERT WITH CHECK (true);

-- 4. RLS for bounty_upvotes
CREATE POLICY "Bounty upvotes are viewable by everyone"
  ON public.bounty_upvotes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote"
  ON public.bounty_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes"
  ON public.bounty_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Trigger for auto-updating upvote_count
CREATE OR REPLACE FUNCTION public.update_bounty_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bounty_submissions 
    SET upvote_count = upvote_count + 1 
    WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.bounty_submissions 
    SET upvote_count = upvote_count - 1 
    WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_bounty_upvote_count
AFTER INSERT OR DELETE ON public.bounty_upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_bounty_upvote_count();
