CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'views', COUNT(*) FILTER (WHERE rt.reward_type = 'VIEW'),
    'likes', COUNT(*) FILTER (WHERE rt.reward_type = 'LIKE'),
    'comments', COUNT(*) FILTER (WHERE rt.reward_type = 'COMMENT'),
    'shares', COUNT(*) FILTER (WHERE rt.reward_type = 'SHARE'),
    'uploads', COUNT(*) FILTER (WHERE rt.reward_type IN ('UPLOAD','SHORT_VIDEO_UPLOAD','LONG_VIDEO_UPLOAD','FIRST_UPLOAD')),
    'total_camly', COALESCE(SUM(rt.amount), 0),
    'approved_camly', COALESCE(SUM(rt.amount) FILTER (WHERE rt.approved = true), 0),
    'pending_camly', COALESCE(SUM(rt.amount) FILTER (WHERE rt.approved = false OR rt.approved IS NULL), 0),
    'claimable_balance', COALESCE((SELECT approved_reward FROM profiles WHERE id = p_user_id), 0),
    'total_claimed', COALESCE((SELECT SUM(amount) FROM claim_requests WHERE user_id = p_user_id AND status = 'success'), 0),
    'type_amounts', jsonb_build_object(
      'VIEW', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'VIEW'), 0),
      'LIKE', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'LIKE'), 0),
      'COMMENT', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'COMMENT'), 0),
      'SHARE', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'SHARE'), 0),
      'UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'UPLOAD'), 0),
      'SHORT_VIDEO_UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'SHORT_VIDEO_UPLOAD'), 0),
      'LONG_VIDEO_UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'LONG_VIDEO_UPLOAD'), 0),
      'FIRST_UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'FIRST_UPLOAD'), 0),
      'SIGNUP', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'SIGNUP'), 0),
      'WALLET_CONNECT', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'WALLET_CONNECT'), 0),
      'BOUNTY', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'BOUNTY'), 0)
    )
  )
  FROM public.reward_transactions rt
  WHERE rt.user_id = p_user_id AND rt.status = 'success';
$$;