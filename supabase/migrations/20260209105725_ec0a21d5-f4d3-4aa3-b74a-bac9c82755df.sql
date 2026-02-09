-- =====================================================
-- MORALIS MIGRATION PHASE 2: Indexes + sync_cursors table
-- =====================================================

-- Drop constraint cũ trên tx_hash (để cho phép multi-log per tx)
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_tx_hash_key;

-- UNIQUE constraint mới: 1 tx có thể có nhiều Transfer events (log_index khác nhau)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_unique_event 
ON wallet_transactions(chain_id, token_contract, tx_hash, COALESCE(log_index, 0));

-- Index cho query performance
CREATE INDEX IF NOT EXISTS idx_wallet_tx_from ON wallet_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_to ON wallet_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_block ON wallet_transactions(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_timestamp ON wallet_transactions(block_timestamp DESC);

-- =====================================================
-- Tạo bảng sync_cursors cho incremental sync
-- =====================================================
CREATE TABLE IF NOT EXISTS sync_cursors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER DEFAULT 56,
  token_contract TEXT NOT NULL,
  last_cursor TEXT,
  last_block_number BIGINT DEFAULT 0,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  total_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, chain_id, token_contract)
);

-- RLS: Chỉ admin được xem/sửa
ALTER TABLE sync_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage sync_cursors" ON sync_cursors
  FOR ALL USING (has_role(auth.uid(), 'admin'));