
-- 1. Generic trigger function: auto-ingest pplp_events
CREATE OR REPLACE FUNCTION public.auto_ingest_pplp_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_event_type TEXT;
  v_target_type TEXT;
  v_user_id UUID;
  v_target_id TEXT;
  v_minute_bucket BIGINT;
  v_hash TEXT;
BEGIN
  v_event_type := TG_ARGV[0];
  v_target_type := TG_ARGV[1];

  -- Determine user_id based on table
  IF TG_TABLE_NAME = 'donation_transactions' THEN
    v_user_id := NEW.sender_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Determine target_id
  v_target_id := NEW.id::TEXT;

  -- Minute-bucket dedup (same as edge function)
  v_minute_bucket := EXTRACT(EPOCH FROM now())::BIGINT / 60;
  v_hash := md5(v_user_id::TEXT || ':' || v_event_type || ':' || v_target_id || ':' || v_minute_bucket);

  INSERT INTO pplp_events (
    actor_user_id, event_type, target_type, target_id,
    source, ingest_hash, occurred_at
  ) VALUES (
    v_user_id, v_event_type::pplp_event_type, v_target_type, v_target_id,
    'db_trigger', v_hash, now()
  )
  ON CONFLICT (ingest_hash) DO NOTHING;

  RETURN NEW;
END;
$fn$;

-- 2. Triggers

-- posts → POST_CREATED
CREATE TRIGGER trg_pplp_post_created
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_ingest_pplp_event('POST_CREATED', 'post');

-- comments → COMMENT_CREATED
CREATE TRIGGER trg_pplp_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION auto_ingest_pplp_event('COMMENT_CREATED', 'comment');

-- post_comments → COMMENT_CREATED
CREATE TRIGGER trg_pplp_post_comment_created
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION auto_ingest_pplp_event('COMMENT_CREATED', 'post_comment');

-- videos → VIDEO_UPLOADED
CREATE TRIGGER trg_pplp_video_uploaded
  AFTER INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_ingest_pplp_event('VIDEO_UPLOADED', 'video');

-- likes (only actual likes, not dislikes) → LIKE_GIVEN
CREATE TRIGGER trg_pplp_like_given
  AFTER INSERT ON likes
  FOR EACH ROW
  WHEN (NEW.is_dislike IS NOT TRUE)
  EXECUTE FUNCTION auto_ingest_pplp_event('LIKE_GIVEN', 'video');

-- post_likes → LIKE_GIVEN
CREATE TRIGGER trg_pplp_post_like_given
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION auto_ingest_pplp_event('LIKE_GIVEN', 'post');

-- daily_checkins → LIGHT_CHECKIN
CREATE TRIGGER trg_pplp_checkin
  AFTER INSERT ON daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION auto_ingest_pplp_event('LIGHT_CHECKIN', 'checkin');

-- donation_transactions (only successful) → DONATION_MADE
CREATE TRIGGER trg_pplp_donation_made
  AFTER INSERT ON donation_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION auto_ingest_pplp_event('DONATION_MADE', 'donation');
