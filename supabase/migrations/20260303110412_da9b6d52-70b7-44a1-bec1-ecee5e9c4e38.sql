
CREATE OR REPLACE FUNCTION public.finalize_livestream_vod(
  p_livestream_id uuid,
  p_video_url text,
  p_title text DEFAULT '[VOD] Livestream'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_channel_id uuid;
  v_video_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM livestreams
  WHERE id = p_livestream_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Livestream not found';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO v_channel_id
  FROM channels
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    RAISE EXCEPTION 'Channel not found for user';
  END IF;

  INSERT INTO videos (title, user_id, channel_id, video_url, approval_status)
  VALUES (p_title, v_user_id, v_channel_id, p_video_url, 'approved')
  RETURNING id INTO v_video_id;

  UPDATE livestreams
  SET vod_video_id = v_video_id
  WHERE id = p_livestream_id;

  RETURN v_video_id;
END;
$$;
