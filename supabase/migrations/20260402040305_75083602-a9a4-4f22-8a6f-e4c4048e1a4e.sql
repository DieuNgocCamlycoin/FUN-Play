CREATE POLICY "Attesters can view pending requests"
ON public.pplp_mint_requests
FOR SELECT
TO authenticated
USING (status IN ('pending_sig', 'signing'));