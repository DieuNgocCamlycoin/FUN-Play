DROP POLICY IF EXISTS "Attesters can view pending requests" ON public.pplp_mint_requests;

CREATE POLICY "Attesters can view pending requests"
ON public.pplp_mint_requests
FOR SELECT
TO authenticated
USING (
  status = ANY (ARRAY['pending_sig'::text, 'signing'::text, 'signed'::text])
);