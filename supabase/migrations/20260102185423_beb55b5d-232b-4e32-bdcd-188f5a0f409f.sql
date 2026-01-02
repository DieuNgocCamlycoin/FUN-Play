-- Cho phép Admin xem TẤT CẢ reward_transactions
CREATE POLICY "Admins can view all reward transactions" 
ON public.reward_transactions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
);