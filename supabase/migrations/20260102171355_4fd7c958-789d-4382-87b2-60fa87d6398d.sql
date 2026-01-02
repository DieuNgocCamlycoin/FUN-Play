-- Cho phép Admin xem TẤT CẢ claim requests
CREATE POLICY "Admins can view all claim requests" 
ON public.claim_requests 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
);