
DROP POLICY "Authenticated can update signing fields" ON public.pplp_mint_requests;

CREATE POLICY "Authenticated can update signing fields"
ON public.pplp_mint_requests
FOR UPDATE
TO authenticated
USING (status = ANY (ARRAY['pending_sig'::text, 'signing'::text]))
WITH CHECK (status = ANY (ARRAY['pending_sig'::text, 'signing'::text, 'signed'::text]));
