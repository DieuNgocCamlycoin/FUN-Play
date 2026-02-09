-- =====================================================
-- MIGRATION: Public Read Access for Onchain Transactions
-- Purpose: Cho phép tất cả user xem giao dịch ONCHAIN đã verified
-- Principle: ONCHAIN-FIRST, MINH BẠCH, CÔNG KHAI
-- =====================================================

-- Policy 1: Donation Transactions - Public can view onchain donations
-- Chỉ cho phép xem giao dịch đã có tx_hash và status = 'success'
CREATE POLICY "Public can view onchain donations"
  ON public.donation_transactions
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'success');

-- Policy 2: Claim Requests - Public can view onchain claims
-- Cho phép xem các claim đã rút thưởng thành công
CREATE POLICY "Public can view onchain claims"
  ON public.claim_requests
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'success');

-- Policy 3: Wallet Transactions - Public can view onchain wallet transfers
-- Cho phép xem các chuyển khoản onchain đã thành công
CREATE POLICY "Public can view onchain wallet transfers"
  ON public.wallet_transactions
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'success');