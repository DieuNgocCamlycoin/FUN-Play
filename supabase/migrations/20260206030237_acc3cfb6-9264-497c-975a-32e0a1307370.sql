
-- Create bounty_submissions table
CREATE TABLE public.bounty_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  contact_info text,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  admin_note text,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own bounty submissions"
  ON public.bounty_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all bounty submissions"
  ON public.bounty_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can submit
CREATE POLICY "Users can create bounty submissions"
  ON public.bounty_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any submission
CREATE POLICY "Admins can update bounty submissions"
  ON public.bounty_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update timestamp trigger
CREATE TRIGGER update_bounty_submissions_updated_at
  BEFORE UPDATE ON public.bounty_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Admins can insert bounty reward transactions
CREATE POLICY "Admins can insert bounty reward transactions"
  ON public.reward_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update profiles for bounty rewards
CREATE POLICY "Admins can update profiles for rewards"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
