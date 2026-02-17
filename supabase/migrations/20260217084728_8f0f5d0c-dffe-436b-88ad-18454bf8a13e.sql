
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'platformStats', jsonb_build_object(
      'totalUsers', (SELECT COUNT(*) FROM profiles WHERE COALESCE(banned,false)=false),
      'totalVideos', (SELECT COUNT(*) FROM videos),
      'totalViews', (SELECT COALESCE(SUM(view_count),0) FROM videos),
      'totalComments', (SELECT COUNT(*) FROM comments WHERE user_id IN (SELECT id FROM profiles WHERE COALESCE(banned,false)=false)),
      'totalRewardsDistributed', (SELECT COALESCE(SUM(amount),0) FROM reward_transactions WHERE status='success'),
      'activeUsersToday', (SELECT COUNT(DISTINCT user_id) FROM daily_reward_limits WHERE date=CURRENT_DATE)
    ),
    'topEarners', (
      SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM (
        SELECT id as "userId", display_name as "displayName", avatar_url as "avatarUrl",
               COALESCE(total_camly_rewards,0) as "totalEarned"
        FROM profiles WHERE COALESCE(banned,false)=false
        ORDER BY total_camly_rewards DESC NULLS LAST LIMIT 10
      ) e
    ),
    'topCreators', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT v.user_id as "userId", p.display_name as "displayName", p.avatar_url as "avatarUrl",
               COUNT(*) as "videoCount", COALESCE(SUM(v.view_count),0) as "totalViews",
               COALESCE(p.total_camly_rewards,0) as "totalRewards"
        FROM videos v JOIN profiles p ON p.id=v.user_id
        WHERE COALESCE(p.banned,false)=false
        GROUP BY v.user_id, p.display_name, p.avatar_url, p.total_camly_rewards
        ORDER BY SUM(v.view_count) DESC NULLS LAST LIMIT 10
      ) c
    ),
    'dailyStats', (
      SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.date), '[]'::jsonb)
      FROM (
        SELECT
          gs::date as date,
          COALESCE(act.cnt, 0) as "activeUsers",
          COALESCE(rew.total, 0) as "rewardsDistributed"
        FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') gs
        LEFT JOIN (
          SELECT date, COUNT(DISTINCT user_id) as cnt FROM daily_reward_limits
          WHERE date >= CURRENT_DATE - 29 GROUP BY date
        ) act ON act.date = gs::date
        LEFT JOIN (
          SELECT created_at::date as dt, SUM(amount) as total FROM reward_transactions
          WHERE status='success' AND created_at >= CURRENT_DATE - 29 GROUP BY dt
        ) rew ON rew.dt = gs::date
      ) d
    )
  );
$function$;
