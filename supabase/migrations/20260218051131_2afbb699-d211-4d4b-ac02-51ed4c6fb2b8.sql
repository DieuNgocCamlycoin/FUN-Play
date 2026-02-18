
CREATE OR REPLACE FUNCTION public.trace_wallet_detective(p_wallet_address text, p_admin_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_verified boolean,
  wallet_address text,
  total_amount numeric,
  tx_count bigint,
  created_at timestamptz,
  banned boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admin check
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can use wallet detective';
  END IF;

  RETURN QUERY
  WITH sending_wallets AS (
    -- Source 1: wallet_transactions where to_address matches
    SELECT 
      LOWER(wt.from_address) AS from_addr,
      SUM(wt.amount) AS total_amt,
      COUNT(*) AS cnt
    FROM wallet_transactions wt
    WHERE LOWER(wt.to_address) = LOWER(p_wallet_address)
      AND wt.status = 'completed'
    GROUP BY LOWER(wt.from_address)

    UNION ALL

    -- Source 2: claim_requests from that wallet
    SELECT
      LOWER(cr.wallet_address) AS from_addr,
      SUM(cr.amount) AS total_amt,
      COUNT(*) AS cnt
    FROM claim_requests cr
    WHERE LOWER(cr.wallet_address) = LOWER(p_wallet_address)
      AND cr.status = 'success'
    GROUP BY LOWER(cr.wallet_address)
  ),
  aggregated AS (
    SELECT
      sw.from_addr,
      SUM(sw.total_amt) AS total_amount,
      SUM(sw.cnt) AS tx_count
    FROM sending_wallets sw
    GROUP BY sw.from_addr
  )
  SELECT
    p.id AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(p.avatar_verified, false) AS avatar_verified,
    p.wallet_address,
    a.total_amount,
    a.tx_count,
    p.created_at,
    COALESCE(p.banned, false) AS banned
  FROM aggregated a
  JOIN profiles p ON LOWER(p.wallet_address) = a.from_addr
  ORDER BY a.total_amount DESC;
END;
$$;
