
CREATE OR REPLACE FUNCTION public.get_users_directory_stats()
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  wallet_address text,
  created_at timestamptz,
  banned boolean,
  avatar_verified boolean,
  pending_rewards numeric,
  approved_reward numeric,
  total_camly_rewards numeric,
  posts_count bigint,
  videos_count bigint,
  comments_count bigint,
  views_count bigint,
  likes_count bigint,
  shares_count bigint,
  donations_sent_count bigint,
  donations_sent_total numeric,
  donations_received_count bigint,
  donations_received_total numeric,
  mint_requests_count bigint,
  minted_fun_total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.wallet_address,
    p.created_at,
    COALESCE(p.banned, false) AS banned,
    COALESCE(p.avatar_verified, false) AS avatar_verified,
    COALESCE(p.pending_rewards, 0) AS pending_rewards,
    COALESCE(p.approved_reward, 0) AS approved_reward,
    COALESCE(rt.total_camly, 0) AS total_camly_rewards,
    COALESCE(pt.posts_count, 0) AS posts_count,
    COALESCE(rt.videos_count, 0) AS videos_count,
    COALESCE(rt.comments_count, 0) AS comments_count,
    COALESCE(rt.views_count, 0) AS views_count,
    COALESCE(rt.likes_count, 0) AS likes_count,
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
      COUNT(*) FILTER (WHERE reward_type IN ('UPLOAD','SHORT_VIDEO_UPLOAD','LONG_VIDEO_UPLOAD','FIRST_UPLOAD')) AS videos_count,
      COUNT(*) FILTER (WHERE reward_type = 'COMMENT') AS comments_count,
      COUNT(*) FILTER (WHERE reward_type = 'VIEW') AS views_count,
      COUNT(*) FILTER (WHERE reward_type = 'LIKE') AS likes_count,
      COUNT(*) FILTER (WHERE reward_type = 'SHARE') AS shares_count,
      COALESCE(SUM(amount), 0) AS total_camly
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
  WHERE has_role(auth.uid(), 'admin')
  ORDER BY rt.total_camly DESC NULLS LAST;
$$;
