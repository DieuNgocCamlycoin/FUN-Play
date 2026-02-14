-- Enable RLS on the backup table that's missing it
ALTER TABLE public.reward_amount_fix_backup_20260214 ENABLE ROW LEVEL SECURITY;

-- Only admins should access backup tables
CREATE POLICY "Only admins can view backup data"
ON public.reward_amount_fix_backup_20260214
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));