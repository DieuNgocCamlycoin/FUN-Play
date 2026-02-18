-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS public.get_public_users_directory();

-- Recreate with shadow ban filters
CREATE OR REPLACE FUNCTION public.get_public_users_directory()
RETURNS TABLE(
  id uuid, username text, display_name text, avatar_url text,
  avatar_verified boolean, created_at timestamptz,
  total_camly numeric, claimed_camly numeric, available_camly numeric,
  view_rewards numeric, like_rewards numeric, comment_rewards numeric,
  share_rewards numeric, upload_rewards numeric, signup_rewards numeric,
  bounty_rewards numeric, manual_rewards numeric,
  posts_count bigint, videos_count bigint, comments_count bigint,
  total_views bigint, likes_count bigint, shares_count bigint,
  sent_count bigint, sent_total numeric,
  recv_count bigint, recv_total numeric,
  mint_count bigint, minted_total numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.username, p.display_name, p.avatar_url,
    COALESCE(p.avatar_verified, false), p.created_at,
    COALESCE(rt.total_camly, 0), COALESCE(rt.claimed_camly, 0),
    (COALESCE(rt.total_camly, 0) - COALESCE(rt.claimed_camly, 0)),
    COALESCE(rb.view_rewards, 0), COALESCE(rb.like_rewards, 0),
    COALESCE(rb.comment_rewards, 0), COALESCE(rb.share_rewards, 0),
    COALESCE(rb.upload_rewards, 0), COALESCE(rb.signup_rewards, 0),
    COALESCE(rb.bounty_rewards, 0),
    COALESCE(mr_manual.manual_rewards, 0),
    COALESCE(pt.posts_count, 0), COALESCE(vd.videos_count, 0),
    COALESCE(cm.comments_count, 0), COALESCE(vd.total_views, 0),
    COALESCE(lk.likes_count, 0), COALESCE(rt.shares_count, 0),
    COALESCE(ds.sent_count, 0), COALESCE(ds.sent_total, 0),
    COALESCE(dr.recv_count, 0), COALESCE(dr.recv_total, 0),
    COALESCE(mr.mint_count, 0), COALESCE(mr.minted_total, 0)
  FROM profiles p
  LEFT JOIN LATERAL (SELECT COUNT(*) AS videos_count, COALESCE(SUM(view_count),0) AS total_views FROM videos v WHERE v.user_id=p.id) vd ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS comments_count FROM comments c WHERE c.user_id=p.id AND COALESCE(c.is_deleted,false)=false) cm ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS likes_count FROM likes l WHERE l.user_id=p.id AND COALESCE(l.is_dislike,false)=false) lk ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(amount),0) AS total_camly, COALESCE(SUM(amount) FILTER(WHERE claimed=true),0) AS claimed_camly, COUNT(*) FILTER(WHERE reward_type='SHARE') AS shares_count FROM reward_transactions r WHERE r.user_id=p.id) rt ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(amount) FILTER(WHERE reward_type='VIEW'),0) AS view_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='LIKE'),0) AS like_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='COMMENT'),0) AS comment_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='SHARE'),0) AS share_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type IN('UPLOAD','SHORT_VIDEO_UPLOAD','LONG_VIDEO_UPLOAD','FIRST_UPLOAD')),0) AS upload_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type IN('SIGNUP','WALLET_CONNECT')),0) AS signup_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='BOUNTY'),0) AS bounty_rewards FROM reward_transactions r2 WHERE r2.user_id=p.id) rb ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS posts_count FROM posts ps WHERE ps.user_id=p.id) pt ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS sent_count, COALESCE(SUM(amount),0) AS sent_total FROM donation_transactions d WHERE d.sender_id=p.id AND d.status='success') ds ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS recv_count, COALESCE(SUM(amount),0) AS recv_total FROM donation_transactions d WHERE d.receiver_id=p.id AND d.status='success') dr ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS mint_count, COALESCE(SUM(CAST(calculated_amount_formatted AS numeric)),0) AS minted_total FROM mint_requests m WHERE m.user_id=p.id AND m.status='minted') mr ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(wt.amount),0) AS manual_rewards FROM wallet_transactions wt WHERE wt.status='completed' AND LOWER(wt.token_contract)='0x0910320181889fefde0bb1ca63962b0a8882e413' AND LOWER(wt.from_address) IN ('0x1dc24bfd99c256b12a4a4cc7732c7e3b9aa75998','0x7b32e82c64ff4f02da024b47a8653e1707003339') AND LOWER(wt.to_address)=LOWER(p.wallet_address)) mr_manual ON true
  WHERE COALESCE(p.banned,false)=false
    AND p.avatar_url IS NOT NULL
    AND p.username NOT LIKE 'user_%'
    AND p.display_name IS NOT NULL
    AND LENGTH(TRIM(p.display_name)) >= 2
  ORDER BY rt.total_camly DESC NULLS LAST;
END;
$$;

-- Shadow ban: Recreate mv_top_ranking to exclude incomplete profiles
DROP MATERIALIZED VIEW IF EXISTS mv_top_ranking;
CREATE MATERIALIZED VIEW mv_top_ranking AS
SELECT id, username, display_name, avatar_url, total_camly_rewards
FROM profiles
WHERE COALESCE(banned, false) = false
  AND COALESCE(total_camly_rewards, 0) > 0
  AND avatar_url IS NOT NULL
  AND username NOT LIKE 'user_%'
  AND display_name IS NOT NULL
  AND LENGTH(TRIM(display_name)) >= 2
ORDER BY total_camly_rewards DESC NULLS LAST
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_ranking_id ON mv_top_ranking(id);