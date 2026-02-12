
DROP FUNCTION IF EXISTS public.get_public_users_directory();
DROP FUNCTION IF EXISTS public.get_users_directory_stats();

CREATE FUNCTION public.get_public_users_directory()
 RETURNS TABLE(
   user_id uuid, username text, display_name text, avatar_url text, avatar_verified boolean,
   created_at timestamp with time zone,
   total_camly_rewards numeric, claimed_camly numeric, unclaimed_camly numeric,
   view_rewards numeric, like_rewards numeric, comment_rewards numeric, share_rewards numeric,
   upload_rewards numeric, signup_rewards numeric, bounty_rewards numeric,
   posts_count bigint, videos_count bigint, comments_count bigint, views_count bigint,
   likes_count bigint, shares_count bigint,
   donations_sent_count bigint, donations_sent_total numeric,
   donations_received_count bigint, donations_received_total numeric,
   mint_requests_count bigint, minted_fun_total numeric
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.username, p.display_name, p.avatar_url,
    COALESCE(p.avatar_verified, false), p.created_at,
    COALESCE(rt.total_camly, 0), COALESCE(rt.claimed_camly, 0),
    (COALESCE(rt.total_camly, 0) - COALESCE(rt.claimed_camly, 0)),
    COALESCE(rb.view_rewards, 0), COALESCE(rb.like_rewards, 0),
    COALESCE(rb.comment_rewards, 0), COALESCE(rb.share_rewards, 0),
    COALESCE(rb.upload_rewards, 0), COALESCE(rb.signup_rewards, 0),
    COALESCE(rb.bounty_rewards, 0),
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
  WHERE COALESCE(p.banned,false)=false
  ORDER BY rt.total_camly DESC NULLS LAST;
$function$;

CREATE FUNCTION public.get_users_directory_stats()
 RETURNS TABLE(
   user_id uuid, username text, display_name text, avatar_url text, wallet_address text,
   created_at timestamp with time zone, banned boolean, avatar_verified boolean,
   pending_rewards numeric, approved_reward numeric, total_camly_rewards numeric,
   view_rewards numeric, like_rewards numeric, comment_rewards numeric, share_rewards numeric,
   upload_rewards numeric, signup_rewards numeric, bounty_rewards numeric,
   posts_count bigint, videos_count bigint, comments_count bigint, views_count bigint,
   likes_count bigint, shares_count bigint,
   donations_sent_count bigint, donations_sent_total numeric,
   donations_received_count bigint, donations_received_total numeric,
   mint_requests_count bigint, minted_fun_total numeric
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.username, p.display_name, p.avatar_url, p.wallet_address, p.created_at,
    COALESCE(p.banned,false), COALESCE(p.avatar_verified,false),
    COALESCE(p.pending_rewards,0), COALESCE(p.approved_reward,0),
    COALESCE(rt.total_camly,0),
    COALESCE(rb.view_rewards,0), COALESCE(rb.like_rewards,0),
    COALESCE(rb.comment_rewards,0), COALESCE(rb.share_rewards,0),
    COALESCE(rb.upload_rewards,0), COALESCE(rb.signup_rewards,0),
    COALESCE(rb.bounty_rewards,0),
    COALESCE(pt.posts_count,0), COALESCE(vd.videos_count,0),
    COALESCE(cm.comments_count,0), COALESCE(vd.total_views,0),
    COALESCE(lk.likes_count,0), COALESCE(rt.shares_count,0),
    COALESCE(ds.sent_count,0), COALESCE(ds.sent_total,0),
    COALESCE(dr.recv_count,0), COALESCE(dr.recv_total,0),
    COALESCE(mr.mint_count,0), COALESCE(mr.minted_total,0)
  FROM profiles p
  LEFT JOIN LATERAL (SELECT COUNT(*) AS videos_count, COALESCE(SUM(view_count),0) AS total_views FROM videos v WHERE v.user_id=p.id) vd ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS comments_count FROM comments c WHERE c.user_id=p.id AND COALESCE(c.is_deleted,false)=false) cm ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS likes_count FROM likes l WHERE l.user_id=p.id AND COALESCE(l.is_dislike,false)=false) lk ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(amount),0) AS total_camly, COUNT(*) FILTER(WHERE reward_type='SHARE') AS shares_count FROM reward_transactions r WHERE r.user_id=p.id) rt ON true
  LEFT JOIN LATERAL (SELECT COALESCE(SUM(amount) FILTER(WHERE reward_type='VIEW'),0) AS view_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='LIKE'),0) AS like_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='COMMENT'),0) AS comment_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='SHARE'),0) AS share_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type IN('UPLOAD','SHORT_VIDEO_UPLOAD','LONG_VIDEO_UPLOAD','FIRST_UPLOAD')),0) AS upload_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type IN('SIGNUP','WALLET_CONNECT')),0) AS signup_rewards, COALESCE(SUM(amount) FILTER(WHERE reward_type='BOUNTY'),0) AS bounty_rewards FROM reward_transactions r2 WHERE r2.user_id=p.id) rb ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS posts_count FROM posts ps WHERE ps.user_id=p.id) pt ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS sent_count, COALESCE(SUM(amount),0) AS sent_total FROM donation_transactions d WHERE d.sender_id=p.id AND d.status='success') ds ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS recv_count, COALESCE(SUM(amount),0) AS recv_total FROM donation_transactions d WHERE d.receiver_id=p.id AND d.status='success') dr ON true
  LEFT JOIN LATERAL (SELECT COUNT(*) AS mint_count, COALESCE(SUM(CAST(calculated_amount_formatted AS numeric)),0) AS minted_total FROM mint_requests m WHERE m.user_id=p.id AND m.status='minted') mr ON true
  WHERE has_role(auth.uid(), 'admin')
  ORDER BY rt.total_camly DESC NULLS LAST;
$function$;
