-- Add indexes for transaction history queries optimization
-- These indexes will significantly improve query performance for:
-- 1. User reward history lookups
-- 2. Donation transaction history (sent/received)
-- 3. Top sponsors aggregation

-- Index for reward_transactions: user lookups sorted by date
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_created 
ON public.reward_transactions(user_id, created_at DESC);

-- Index for reward_transactions: claimed status filtering
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_claimed
ON public.reward_transactions(user_id, claimed, status);

-- Index for donation_transactions: sender lookups sorted by date
CREATE INDEX IF NOT EXISTS idx_donation_transactions_sender_created 
ON public.donation_transactions(sender_id, created_at DESC);

-- Index for donation_transactions: receiver lookups sorted by date
CREATE INDEX IF NOT EXISTS idx_donation_transactions_receiver_created 
ON public.donation_transactions(receiver_id, created_at DESC);

-- Index for claim_requests: user status lookups
CREATE INDEX IF NOT EXISTS idx_claim_requests_user_status
ON public.claim_requests(user_id, status, created_at DESC);

-- Index for profiles: reward ranking queries
CREATE INDEX IF NOT EXISTS idx_profiles_rewards_ranking
ON public.profiles(total_camly_rewards DESC) 
WHERE total_camly_rewards > 0;