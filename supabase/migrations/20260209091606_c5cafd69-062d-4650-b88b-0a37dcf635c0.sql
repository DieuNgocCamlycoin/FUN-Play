-- Fix RLS Policy for wallet_transactions: change 'success' to 'completed'
-- Current data has status='completed' but policy filters for status='success'

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Public can view onchain wallet transfers" ON public.wallet_transactions;

-- Create new policy with correct status value
CREATE POLICY "Public can view onchain wallet transfers"
  ON public.wallet_transactions
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'completed');