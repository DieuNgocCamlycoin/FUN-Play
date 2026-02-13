
CREATE OR REPLACE FUNCTION public.bulk_approve_all_rewards(p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affected_users integer;
  v_total_amount numeric;
BEGIN
  -- Verify admin role
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can bulk approve';
  END IF;

  -- Count what will be affected BEFORE updating
  SELECT COUNT(*), COALESCE(SUM(pending_rewards), 0)
  INTO v_affected_users, v_total_amount
  FROM profiles WHERE COALESCE(pending_rewards, 0) > 0;

  IF v_affected_users = 0 THEN
    RETURN jsonb_build_object('affected_users', 0, 'total_amount', 0);
  END IF;

  -- Log bulk approval for each user BEFORE zeroing pending_rewards
  INSERT INTO reward_approvals (user_id, amount, status, admin_id, admin_note, reviewed_at)
  SELECT id, COALESCE(pending_rewards, 0), 'approved', p_admin_id, 'Bulk approval all users', now()
  FROM profiles
  WHERE COALESCE(pending_rewards, 0) > 0;

  -- Move pending to approved for all users
  UPDATE profiles SET
    approved_reward = COALESCE(approved_reward, 0) + COALESCE(pending_rewards, 0),
    pending_rewards = 0
  WHERE COALESCE(pending_rewards, 0) > 0;

  -- Mark all unapproved transactions as approved
  UPDATE reward_transactions SET
    approved = true,
    approved_at = now(),
    approved_by = p_admin_id
  WHERE (approved = false OR approved IS NULL) 
    AND claimed = false 
    AND status = 'success';

  RETURN jsonb_build_object(
    'affected_users', v_affected_users,
    'total_amount', v_total_amount
  );
END;
$$;
