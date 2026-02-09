-- =====================================================
-- MORALIS MIGRATION PHASE 1: Thêm cột mới
-- =====================================================

-- Thêm các cột mới để lưu đầy đủ thông tin onchain
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS chain_id INTEGER DEFAULT 56,
ADD COLUMN IF NOT EXISTS token_contract TEXT DEFAULT '0x0910320181889fefde0bb1ca63962b0a8882e413',
ADD COLUMN IF NOT EXISTS log_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS block_number BIGINT,
ADD COLUMN IF NOT EXISTS block_timestamp TIMESTAMPTZ;

-- Cập nhật dữ liệu cũ có log_index = NULL thành 0
UPDATE wallet_transactions SET log_index = 0 WHERE log_index IS NULL;