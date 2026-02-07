-- =====================================================
-- FUN Money SDK v1.0 - Database Migration
-- Creates mint_requests table with proper RLS
-- =====================================================

-- =====================================================
-- 1. CREATE MINT_REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mint_requests (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ===== USER INFO =====
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_wallet_address TEXT NOT NULL,
  
  -- ===== ACTION INFO =====
  platform_id TEXT NOT NULL,           -- 'FUN_PROFILE', 'ANGEL_AI', 'FUN_CHARITY', etc.
  action_type TEXT NOT NULL,           -- 'CONTENT_CREATE', 'DONATE', 'VOLUNTEER', etc.
  action_evidence JSONB NOT NULL,      -- Evidence data (urls, hashes, descriptions)
  
  -- ===== PILLAR SCORES (0-100 each) =====
  pillar_scores JSONB NOT NULL,        -- {"S": 80, "T": 75, "H": 70, "C": 85, "U": 90}
  
  -- ===== CALCULATED SCORES =====
  light_score INTEGER NOT NULL,        -- 0-100, weighted average of pillars
  unity_score INTEGER NOT NULL,        -- 0-100, from unity signals
  unity_signals JSONB,                 -- {"collaboration": true, "beneficiaryConfirmed": true, ...}
  
  -- ===== MULTIPLIERS =====
  multiplier_q DECIMAL(5,2) NOT NULL,  -- Quality: 0.5 - 3.0
  multiplier_i DECIMAL(5,2) NOT NULL,  -- Impact: 0.5 - 5.0
  multiplier_k DECIMAL(5,4) NOT NULL,  -- Integrity: 0.0 - 1.0
  multiplier_ux DECIMAL(5,2) NOT NULL, -- Unity: 0.5 - 2.5
  
  -- ===== AMOUNT =====
  base_reward_atomic TEXT NOT NULL,    -- Base reward in atomic units
  calculated_amount_atomic TEXT NOT NULL, -- Final amount after multipliers
  calculated_amount_formatted TEXT,    -- Human readable: "125.50 FUN"
  
  -- ===== HASHES (for contract call) =====
  action_hash TEXT,                    -- keccak256(actionType) - bytes32
  evidence_hash TEXT,                  -- keccak256(evidence JSON) - bytes32
  
  -- ===== STATUS WORKFLOW =====
  status TEXT DEFAULT 'pending',
  decision_reason TEXT,                -- Reason for approval/rejection
  
  -- ===== ADMIN/ATTESTER INFO =====
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  attester_address TEXT,               -- Wallet address of attester who signed
  
  -- ===== TRANSACTION INFO (after mint) =====
  tx_hash TEXT,                        -- On-chain transaction hash
  block_number BIGINT,                 -- Block number when minted
  minted_at TIMESTAMPTZ,               -- Timestamp of successful mint
  
  -- ===== METADATA =====
  chain_id INTEGER DEFAULT 97,         -- BSC Testnet = 97, Mainnet = 56
  contract_address TEXT,               -- FUN Money contract address used
  nonce_used BIGINT,                   -- Nonce used in signature
  
  -- ===== TIMESTAMPS =====
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_mint_requests_user_id ON public.mint_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mint_requests_status ON public.mint_requests(status);
CREATE INDEX IF NOT EXISTS idx_mint_requests_platform ON public.mint_requests(platform_id);
CREATE INDEX IF NOT EXISTS idx_mint_requests_action ON public.mint_requests(action_type);
CREATE INDEX IF NOT EXISTS idx_mint_requests_created ON public.mint_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mint_requests_tx_hash ON public.mint_requests(tx_hash) WHERE tx_hash IS NOT NULL;

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.mint_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. USER POLICIES
-- =====================================================

-- Users can view their own requests
CREATE POLICY "Users can view own mint requests" ON public.mint_requests
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert new requests
CREATE POLICY "Users can insert own mint requests" ON public.mint_requests
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. ADMIN POLICIES (using existing has_role function)
-- =====================================================

-- Admins can view all requests
CREATE POLICY "Admins can view all mint requests" ON public.mint_requests
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update mint requests" ON public.mint_requests
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 6. TRIGGER FOR updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_mint_requests_updated_at ON public.mint_requests;
CREATE TRIGGER update_mint_requests_updated_at
  BEFORE UPDATE ON public.mint_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();