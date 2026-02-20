
-- 1. Internal function to check completed profile (single source of truth)
CREATE OR REPLACE FUNCTION public.is_completed_profile(p profiles)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(p.banned, false) = false
    AND p.avatar_url IS NOT NULL
    AND p.username NOT LIKE 'user_%'
    AND p.display_name IS NOT NULL
    AND LENGTH(TRIM(p.display_name)) >= 2;
$$;

-- 2. Update get_honobar_stats to use is_completed_profile
CREATE OR REPLACE FUNCTION public.get_honobar_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'totalUsers', (
      SELECT COUNT(*) FROM profiles p WHERE is_completed_profile(p)
    ),
    'totalVideos', (SELECT COUNT(*) FROM videos WHERE approval_status='approved'),
    'totalViews', (SELECT COALESCE(SUM(view_count),0) FROM videos WHERE approval_status='approved'),
    'totalComments', (SELECT COUNT(*) FROM comments),
    'totalRewards', (
      SELECT COALESCE(SUM(total_camly_rewards),0) FROM profiles p WHERE is_completed_profile(p)
    ),
    'totalSubscriptions', (SELECT COUNT(*) FROM subscriptions),
    'camlyPool', (
      SELECT COALESCE(SUM(approved_reward),0) FROM profiles p WHERE is_completed_profile(p)
    ),
    'totalPosts', (SELECT COUNT(*) FROM posts),
    'totalPhotos', (SELECT COUNT(*) FROM videos WHERE category='photo')
  );
$$;

-- 3. Video title validation trigger
CREATE OR REPLACE FUNCTION public.validate_video_title()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF LENGTH(TRIM(NEW.title)) < 5 THEN
    RAISE EXCEPTION 'Title must be at least 5 characters';
  END IF;
  IF NEW.title ~ '^\d+$' THEN
    RAISE EXCEPTION 'Title cannot be only numbers';
  END IF;
  IF NEW.title !~ '[a-zA-ZÀ-ỹ]' THEN
    RAISE EXCEPTION 'Title must contain at least one letter';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_video_title
  BEFORE INSERT OR UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.validate_video_title();
