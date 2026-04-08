
-- Expand attester SELECT policy to include all statuses
DROP POLICY IF EXISTS "Attesters can view pending requests" ON public.pplp_mint_requests;

CREATE POLICY "Attesters can view all requests"
ON public.pplp_mint_requests
FOR SELECT
TO authenticated
USING (
  status IN ('pending_sig', 'signing', 'signed', 'submitted', 'confirmed', 'failed')
);
