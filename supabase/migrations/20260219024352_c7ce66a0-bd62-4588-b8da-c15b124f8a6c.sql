
CREATE OR REPLACE FUNCTION public.bulk_delete_videos_only(p_admin_id uuid, p_video_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_videos integer;
BEGIN
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can bulk delete videos';
  END IF;

  DELETE FROM likes WHERE video_id = ANY(p_video_ids);
  DELETE FROM comments WHERE video_id = ANY(p_video_ids);
  DELETE FROM watch_history WHERE video_id = ANY(p_video_ids);
  DELETE FROM reward_transactions WHERE video_id = ANY(p_video_ids);
  DELETE FROM comment_logs WHERE video_id = ANY(p_video_ids);
  DELETE FROM content_hashes WHERE video_id = ANY(p_video_ids);
  DELETE FROM playlist_videos WHERE video_id = ANY(p_video_ids);
  DELETE FROM meditation_playlist_videos WHERE video_id = ANY(p_video_ids);
  DELETE FROM video_reports WHERE video_id = ANY(p_video_ids);
  DELETE FROM video_watch_progress WHERE video_id = ANY(p_video_ids);

  DELETE FROM videos WHERE id = ANY(p_video_ids);
  GET DIAGNOSTICS v_deleted_videos = ROW_COUNT;

  RETURN jsonb_build_object('deleted_videos', v_deleted_videos);
END;
$function$;
