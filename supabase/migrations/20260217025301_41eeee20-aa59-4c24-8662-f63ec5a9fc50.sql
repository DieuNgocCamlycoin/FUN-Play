
CREATE OR REPLACE FUNCTION public.get_ip_abuse_clusters(min_accounts INTEGER DEFAULT 2)
RETURNS TABLE(ip_hash TEXT, account_count BIGINT, total_pending NUMERIC, distinct_wallets BIGINT, users JSONB)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH all_ip_users AS (
    -- Source 1: ip_tracking table
    SELECT DISTINCT it.ip_hash, it.user_id
    FROM ip_tracking it
    WHERE it.user_id IS NOT NULL
    
    UNION
    
    -- Source 2: profiles.signup_ip_hash
    SELECT DISTINCT p.signup_ip_hash AS ip_hash, p.id AS user_id
    FROM profiles p
    WHERE p.signup_ip_hash IS NOT NULL
  ),
  ip_groups AS (
    SELECT
      aiu.ip_hash,
      COUNT(DISTINCT aiu.user_id) AS account_count,
      array_agg(DISTINCT aiu.user_id) AS user_ids
    FROM all_ip_users aiu
    GROUP BY aiu.ip_hash
    HAVING COUNT(DISTINCT aiu.user_id) >= min_accounts
  )
  SELECT
    ig.ip_hash,
    ig.account_count,
    COALESCE(SUM(p.pending_rewards), 0) AS total_pending,
    COUNT(DISTINCT p.wallet_address) FILTER (WHERE p.wallet_address IS NOT NULL) AS distinct_wallets,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url,
        'wallet_address', p.wallet_address,
        'pending_rewards', COALESCE(p.pending_rewards, 0),
        'banned', COALESCE(p.banned, false)
      )
      ORDER BY COALESCE(p.pending_rewards, 0) DESC
    ) AS users
  FROM ip_groups ig
  CROSS JOIN LATERAL unnest(ig.user_ids) AS uid(id)
  JOIN profiles p ON p.id = uid.id
  GROUP BY ig.ip_hash, ig.account_count
  ORDER BY ig.account_count DESC;
$$;
