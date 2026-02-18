
-- 1. Add columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS report_count integer DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_scanned boolean DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_scan_result text;

-- 2. Add escrow column to reward_transactions
ALTER TABLE public.reward_transactions ADD COLUMN IF NOT EXISTS escrow_release_at timestamptz;

-- 3. Create video_reports table
CREATE TABLE public.video_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason text NOT NULL DEFAULT 'spam',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(video_id, reporter_id)
);

ALTER TABLE public.video_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert one report per video
CREATE POLICY "Users can report videos once" ON public.video_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can see own reports" ON public.video_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can read all reports
CREATE POLICY "Admins can read all reports" ON public.video_reports
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports" ON public.video_reports
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 4. Trigger: on report insert, increment report_count and auto-hide at 5
CREATE OR REPLACE FUNCTION public.handle_video_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE videos 
  SET report_count = COALESCE(report_count, 0) + 1
  WHERE id = NEW.video_id
  RETURNING report_count INTO v_new_count;

  -- Auto-hide at 5 reports
  IF v_new_count >= 5 THEN
    UPDATE videos SET is_hidden = true WHERE id = NEW.video_id;
    
    -- Revoke escrow reward if applicable
    PERFORM revoke_escrow_reward(NEW.video_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_video_report_insert
  AFTER INSERT ON public.video_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_video_report();

-- 5. release_escrow_rewards() - releases FIRST_UPLOAD rewards after 48h if video not hidden
CREATE OR REPLACE FUNCTION public.release_escrow_rewards()
RETURNS TABLE(user_id uuid, amount numeric, video_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH eligible AS (
    SELECT rt.id AS rt_id, rt.user_id, rt.amount, rt.video_id
    FROM reward_transactions rt
    LEFT JOIN videos v ON v.id = rt.video_id
    WHERE rt.reward_type = 'FIRST_UPLOAD'
      AND rt.approved = false
      AND rt.claimed = false
      AND rt.escrow_release_at IS NOT NULL
      AND rt.escrow_release_at <= now()
      AND (v.is_hidden IS NULL OR v.is_hidden = false)
      AND rt.status = 'success'
  ),
  updated_tx AS (
    UPDATE reward_transactions rt
    SET approved = true, approved_at = now()
    FROM eligible e
    WHERE rt.id = e.rt_id
    RETURNING rt.user_id, rt.amount
  )
  UPDATE profiles p
  SET 
    pending_rewards = GREATEST(COALESCE(pending_rewards, 0) - ut.amount, 0),
    approved_reward = COALESCE(approved_reward, 0) + ut.amount
  FROM updated_tx ut
  WHERE p.id = ut.user_id
  RETURNING p.id AS user_id, ut.amount, NULL::uuid AS video_id;
END;
$$;

-- 6. revoke_escrow_reward(video_id) - revokes pending FIRST_UPLOAD if video is hidden
CREATE OR REPLACE FUNCTION public.revoke_escrow_reward(p_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_amount numeric;
BEGIN
  -- Find pending FIRST_UPLOAD escrow for this video
  SELECT rt.user_id, rt.amount INTO v_user_id, v_amount
  FROM reward_transactions rt
  WHERE rt.video_id = p_video_id
    AND rt.reward_type = 'FIRST_UPLOAD'
    AND rt.approved = false
    AND rt.claimed = false
    AND rt.escrow_release_at IS NOT NULL
    AND rt.status = 'success'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Mark transaction as revoked
    UPDATE reward_transactions
    SET status = 'revoked'
    WHERE video_id = p_video_id
      AND reward_type = 'FIRST_UPLOAD'
      AND approved = false
      AND claimed = false;

    -- Deduct from pending
    UPDATE profiles
    SET 
      pending_rewards = GREATEST(COALESCE(pending_rewards, 0) - v_amount, 0),
      total_camly_rewards = GREATEST(COALESCE(total_camly_rewards, 0) - v_amount, 0)
    WHERE id = v_user_id;
  END IF;
END;
$$;
