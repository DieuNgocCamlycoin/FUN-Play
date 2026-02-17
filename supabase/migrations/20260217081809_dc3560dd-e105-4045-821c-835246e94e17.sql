
CREATE OR REPLACE FUNCTION public.get_honobar_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles WHERE COALESCE(banned,false)=false),
    'totalVideos', (SELECT COUNT(*) FROM videos WHERE approval_status='approved'),
    'totalViews', (SELECT COALESCE(SUM(view_count),0) FROM videos WHERE approval_status='approved'),
    'totalComments', (SELECT COUNT(*) FROM comments),
    'totalRewards', (SELECT COALESCE(SUM(total_camly_rewards),0) FROM profiles WHERE COALESCE(banned,false)=false),
    'totalSubscriptions', (SELECT COUNT(*) FROM subscriptions),
    'camlyPool', (SELECT COALESCE(SUM(approved_reward),0) FROM profiles WHERE COALESCE(banned,false)=false),
    'totalPosts', (SELECT COUNT(*) FROM posts),
    'totalPhotos', (SELECT COUNT(*) FROM videos WHERE category='photo')
  );
$$;
