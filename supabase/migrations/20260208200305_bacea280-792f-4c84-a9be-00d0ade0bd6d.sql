
-- Tạo function tính tổng activity summary cho user
-- Tránh giới hạn 1000 rows khi fetch reward_transactions
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'views', COUNT(*) FILTER (WHERE reward_type = 'VIEW'),
    'likes', COUNT(*) FILTER (WHERE reward_type = 'LIKE'),
    'comments', COUNT(*) FILTER (WHERE reward_type = 'COMMENT'),
    'shares', COUNT(*) FILTER (WHERE reward_type = 'SHARE'),
    'uploads', COUNT(*) FILTER (WHERE reward_type = 'UPLOAD'),
    'total_camly', COALESCE(SUM(amount), 0),
    'approved_camly', COALESCE(SUM(amount) FILTER (WHERE approved = true), 0),
    'pending_camly', COALESCE(SUM(amount) FILTER (WHERE approved = false OR approved IS NULL), 0)
  )
  FROM public.reward_transactions
  WHERE user_id = p_user_id;
$$;
