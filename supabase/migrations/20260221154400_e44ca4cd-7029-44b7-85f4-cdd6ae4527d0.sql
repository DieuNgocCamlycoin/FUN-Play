
CREATE OR REPLACE FUNCTION public.get_suspended_wallet_history()
RETURNS TABLE(user_id uuid, wallet_address text, source text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH banned_users AS (
    SELECT id FROM profiles WHERE COALESCE(banned, false) = true
  ),
  all_wallets AS (
    SELECT it.user_id, it.wallet_address, 'tracking' as source
    FROM ip_tracking it
    JOIN banned_users bu ON bu.id = it.user_id
    WHERE it.wallet_address IS NOT NULL
    UNION
    SELECT cr.user_id, cr.wallet_address, 'claim' as source
    FROM claim_requests cr
    JOIN banned_users bu ON bu.id = cr.user_id
    WHERE cr.wallet_address IS NOT NULL
    UNION
    SELECT p.id, p.wallet_address, 'profile' as source
    FROM profiles p
    JOIN banned_users bu ON bu.id = p.id
    WHERE p.wallet_address IS NOT NULL
  )
  SELECT DISTINCT ON (aw.user_id, aw.wallet_address)
    aw.user_id, aw.wallet_address, aw.source
  FROM all_wallets aw
  WHERE NOT EXISTS (
    SELECT 1 FROM blacklisted_wallets bw
    WHERE LOWER(bw.wallet_address) = LOWER(aw.wallet_address)
  )
  ORDER BY aw.user_id, aw.wallet_address, aw.source;
$$;
