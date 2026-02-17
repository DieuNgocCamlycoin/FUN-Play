
CREATE OR REPLACE FUNCTION public.restore_user_rewards(p_user_id uuid, p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_calc_pending numeric;
  v_calc_approved numeric;
BEGIN
  -- Admin check
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can restore rewards';
  END IF;

  -- Recalculate from reward_transactions (same logic as sync_reward_totals but for one user)
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE (approved = false OR approved IS NULL) AND claimed = false), 0),
    COALESCE(SUM(amount) FILTER (WHERE approved = true AND claimed = false), 0)
  INTO v_calc_pending, v_calc_approved
  FROM reward_transactions
  WHERE user_id = p_user_id AND status = 'success';

  -- Update profile
  UPDATE profiles SET
    pending_rewards = v_calc_pending,
    approved_reward = v_calc_approved,
    total_camly_rewards = COALESCE((SELECT SUM(amount) FROM reward_transactions WHERE user_id = p_user_id AND status = 'success'), 0)
  WHERE id = p_user_id;

  -- Log restoration
  INSERT INTO reward_approvals (user_id, amount, status, admin_id, admin_note, reviewed_at)
  VALUES (p_user_id, v_calc_pending + v_calc_approved, 'restored', p_admin_id, 'Rewards restored after unban', now());

  RETURN jsonb_build_object(
    'pending_restored', v_calc_pending,
    'approved_restored', v_calc_approved,
    'total', v_calc_pending + v_calc_approved
  );
END;
$$;
