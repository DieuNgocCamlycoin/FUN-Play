-- Add columns to profiles for tracking FUN minting
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_fun_mint_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_fun_minted NUMERIC DEFAULT 0;

-- Create index for faster activity queries on reward_transactions
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_type 
ON reward_transactions(user_id, reward_type);