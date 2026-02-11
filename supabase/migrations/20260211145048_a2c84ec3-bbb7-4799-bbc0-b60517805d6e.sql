
DROP FUNCTION IF EXISTS public.get_public_users_directory();

CREATE OR REPLACE FUNCTION public.get_public_users_directory()
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, avatar_verified boolean, created_at timestamp with time zone, total_camly_rewards numeric, claimed_camly numeric, unclaimed_camly numeric, posts_count bigint, videos_count bigint, comments_count bigint, views_count bigint, likes_count bigint, shares_count bigint, donations_sent_count bigint, donations_sent_total numeric, donations_received_count bigint, donations_received_total numeric, mint_requests_count bigint, minted_fun_total numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(p.avatar_verified, false) AS avatar_verified,
    p.created_at,
    COALESCE(rt.total_camly, 0) AS total_camly_rewards,
    COALESCE(rt.claimed_camly, 0) AS claimed_camly,
    (COALESCE(rt.total_camly, 0) - COALESCE(rt.claimed_camly, 0)) AS unclaimed_camly,
    COALESCE(pt.posts_count, 0) AS posts_count,
    COALESCE(vd.videos_count, 0) AS videos_count,
    COALESCE(cm.comments_count, 0) AS comments_count,
    COALESCE(vd.total_views, 0) AS views_count,
    COALESCE(lk.likes_count, 0) AS likes_count,
    COALESCE(rt.shares_count, 0) AS shares_count,
    COALESCE(ds.sent_count, 0) AS donations_sent_count,
    COALESCE(ds.sent_total, 0) AS donations_sent_total,
    COALESCE(dr.recv_count, 0) AS donations_received_count,
    COALESCE(dr.recv_total, 0) AS donations_received_total,
    COALESCE(mr.mint_count, 0) AS mint_requests_count,
    COALESCE(mr.minted_total, 0) AS minted_fun_total
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS videos_count,
      COALESCE(SUM(view_count), 0) AS total_views
    FROM videos v WHERE v.user_id = p.id
  ) vd ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS comments_count
    FROM comments c WHERE c.user_id = p.id AND COALESCE(c.is_deleted, false) = false
  ) cm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS likes_count
    FROM likes l WHERE l.user_id = p.id AND COALESCE(l.is_dislike, false) = false
  ) lk ON true
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(amount), 0) AS total_camly,
      COALESCE(SUM(amount) FILTER (WHERE claimed = true), 0) AS claimed_camly,
      COUNT(*) FILTER (WHERE reward_type = 'SHARE') AS shares_count
    FROM reward_transactions r WHERE r.user_id = p.id
  ) rt ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS posts_count
    FROM posts ps WHERE ps.user_id = p.id
  ) pt ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS sent_count,
      COALESCE(SUM(amount), 0) AS sent_total
    FROM donation_transactions d WHERE d.sender_id = p.id AND d.status = 'success'
  ) ds ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS recv_count,
      COALESCE(SUM(amount), 0) AS recv_total
    FROM donation_transactions d WHERE d.receiver_id = p.id AND d.status = 'success'
  ) dr ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS mint_count,
      COALESCE(SUM(CAST(calculated_amount_formatted AS numeric)), 0) AS minted_total
    FROM mint_requests m WHERE m.user_id = p.id AND m.status = 'minted'
  ) mr ON true
  WHERE COALESCE(p.banned, false) = false
  ORDER BY rt.total_camly DESC NULLS LAST;
$function$;
