
-- =====================================================
-- PPLP Multisig 3-of-3 Mint Requests Table
-- =====================================================

CREATE TABLE public.pplp_mint_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_address TEXT NOT NULL,
  action_ids UUID[] DEFAULT '{}',
  action_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  amount_wei TEXT NOT NULL,
  action_hash TEXT,
  evidence_hash TEXT,
  nonce TEXT,
  multisig_signatures JSONB DEFAULT '{}'::jsonb,
  multisig_completed_groups TEXT[] DEFAULT '{}',
  multisig_required_groups TEXT[] DEFAULT ARRAY['will', 'wisdom', 'love'],
  status TEXT NOT NULL DEFAULT 'pending_sig',
  tx_hash TEXT,
  block_number BIGINT,
  platform_id TEXT NOT NULL DEFAULT 'fun_play',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pplp_mint_requests_user_id ON public.pplp_mint_requests(user_id);
CREATE INDEX idx_pplp_mint_requests_status ON public.pplp_mint_requests(status);
CREATE INDEX idx_pplp_mint_requests_created_at ON public.pplp_mint_requests(created_at);

-- Enable RLS
ALTER TABLE public.pplp_mint_requests ENABLE ROW LEVEL SECURITY;

-- RLS: User can view own requests
CREATE POLICY "Users can view own pplp requests"
  ON public.pplp_mint_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: User can insert own requests
CREATE POLICY "Users can insert own pplp requests"
  ON public.pplp_mint_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: Admins can view all requests
CREATE POLICY "Admins can view all pplp requests"
  ON public.pplp_mint_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can update all requests (for submit/confirm)
CREATE POLICY "Admins can update pplp requests"
  ON public.pplp_mint_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Authenticated users can update signing fields (for attester signing)
-- Attesters update multisig_signatures and multisig_completed_groups
CREATE POLICY "Authenticated can update signing fields"
  ON public.pplp_mint_requests
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND status IN ('pending_sig', 'signing')
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pplp_mint_requests;
