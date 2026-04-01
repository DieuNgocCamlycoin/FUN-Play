CREATE POLICY "Admins can insert pplp requests"
ON public.pplp_mint_requests
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));