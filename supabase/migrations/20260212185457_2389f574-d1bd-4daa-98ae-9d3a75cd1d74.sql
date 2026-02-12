CREATE OR REPLACE FUNCTION public.get_transaction_stats(p_wallet_address text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'totalCount', 
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))),
    'totalValue',
      COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address))), 0)
      + COALESCE((SELECT SUM(amount) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)))), 0)
      + COALESCE((SELECT SUM(amount) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))), 0),
    'todayCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL AND block_timestamp::date=CURRENT_DATE
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL AND created_at::date=CURRENT_DATE
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL AND processed_at::date=CURRENT_DATE
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))),
    'successCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))),
    'pendingCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='pending'
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='pending'
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='pending'
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address)))
  );
$$;