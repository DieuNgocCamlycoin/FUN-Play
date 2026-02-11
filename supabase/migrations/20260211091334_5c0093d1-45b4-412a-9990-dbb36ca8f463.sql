CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'views', COUNT(*) FILTER (WHERE reward_type = 'VIEW'),
    'likes', COUNT(*) FILTER (WHERE reward_type = 'LIKE'),
    'comments', COUNT(*) FILTER (WHERE reward_type = 'COMMENT'),
    'shares', COUNT(*) FILTER (WHERE reward_type = 'SHARE'),
    'uploads', COUNT(*) FILTER (WHERE reward_type IN ('UPLOAD', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD', 'FIRST_UPLOAD')),
    'total_camly', COALESCE(SUM(amount), 0),
    'approved_camly', COALESCE(SUM(amount) FILTER (WHERE approved = true), 0),
    'pending_camly', COALESCE(SUM(amount) FILTER (WHERE approved = false OR approved IS NULL), 0)
  )
  FROM public.reward_transactions
  WHERE user_id = p_user_id;
$function$;