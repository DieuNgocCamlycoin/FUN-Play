
CREATE OR REPLACE FUNCTION get_transaction_stats(p_wallet_address TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'totalCount', 
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR from_address = p_wallet_address OR to_address = p_wallet_address))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address) OR receiver_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address)))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR wallet_address = p_wallet_address)),
    'totalValue',
      COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR from_address = p_wallet_address OR to_address = p_wallet_address)), 0)
      + COALESCE((SELECT SUM(amount) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address) OR receiver_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address))), 0)
      + COALESCE((SELECT SUM(amount) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR wallet_address = p_wallet_address)), 0),
    'todayCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL AND block_timestamp::date = CURRENT_DATE
        AND (p_wallet_address IS NULL OR from_address = p_wallet_address OR to_address = p_wallet_address))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL AND created_at::date = CURRENT_DATE
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address) OR receiver_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address)))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL AND processed_at::date = CURRENT_DATE
        AND (p_wallet_address IS NULL OR wallet_address = p_wallet_address))
  );
$$;
