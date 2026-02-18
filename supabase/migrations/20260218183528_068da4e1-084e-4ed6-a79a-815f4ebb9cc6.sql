
CREATE OR REPLACE FUNCTION public.bulk_delete_videos_and_ban_users(p_admin_id uuid, p_video_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_ids uuid[];
  v_uid uuid;
  v_wallet text;
  v_deleted_videos integer;
  v_banned_users integer := 0;
BEGIN
  -- Admin check
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can bulk delete and ban';
  END IF;

  -- Get distinct user_ids from videos
  SELECT ARRAY(SELECT DISTINCT user_id FROM videos WHERE id = ANY(p_video_ids))
  INTO v_user_ids;

  -- Delete related records for these videos
  DELETE FROM likes WHERE video_id = ANY(p_video_ids);
  DELETE FROM comments WHERE video_id = ANY(p_video_ids);
  DELETE FROM watch_history WHERE video_id = ANY(p_video_ids);
  DELETE FROM reward_transactions WHERE video_id = ANY(p_video_ids);
  DELETE FROM comment_logs WHERE video_id = ANY(p_video_ids);
  DELETE FROM content_hashes WHERE video_id = ANY(p_video_ids);
  DELETE FROM playlist_videos WHERE video_id = ANY(p_video_ids);
  DELETE FROM meditation_playlist_videos WHERE video_id = ANY(p_video_ids);
  DELETE FROM video_reports WHERE video_id = ANY(p_video_ids);

  -- Delete the videos
  DELETE FROM videos WHERE id = ANY(p_video_ids);
  GET DIAGNOSTICS v_deleted_videos = ROW_COUNT;

  -- Ban each user
  FOREACH v_uid IN ARRAY v_user_ids LOOP
    SELECT wallet_address INTO v_wallet FROM profiles WHERE id = v_uid;

    UPDATE profiles SET
      banned = true,
      banned_at = now(),
      ban_reason = 'Spam videos - bulk ban by admin',
      violation_level = 3,
      pending_rewards = 0,
      approved_reward = 0
    WHERE id = v_uid;

    IF v_wallet IS NOT NULL THEN
      INSERT INTO blacklisted_wallets (wallet_address, reason, is_permanent, user_id, created_by)
      VALUES (v_wallet, 'Spam videos - bulk ban', true, v_uid, p_admin_id)
      ON CONFLICT (wallet_address) DO NOTHING;
    END IF;

    INSERT INTO reward_bans (user_id, reason, expires_at, created_by)
    VALUES (v_uid, 'Spam videos - bulk ban', now() + interval '100 years', p_admin_id);

    v_banned_users := v_banned_users + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'deleted_videos', v_deleted_videos,
    'banned_users', v_banned_users,
    'user_ids', to_jsonb(v_user_ids)
  );
END;
$function$;
