
-- Create sync_reward_totals function to recalculate all user balances
CREATE OR REPLACE FUNCTION public.sync_reward_totals()
RETURNS TABLE(user_id uuid, old_total numeric, new_total numeric, old_pending numeric, new_pending numeric, old_approved numeric, new_approved numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH calculated AS (
    SELECT
      rt.user_id,
      COALESCE(SUM(rt.amount), 0) AS calc_total,
      COALESCE(SUM(rt.amount) FILTER (WHERE (rt.approved = false OR rt.approved IS NULL) AND rt.claimed = false), 0) AS calc_pending,
      COALESCE(SUM(rt.amount) FILTER (WHERE rt.approved = true AND rt.claimed = false), 0) AS calc_approved
    FROM reward_transactions rt
    WHERE rt.status = 'success'
    GROUP BY rt.user_id
  )
  UPDATE profiles p
  SET
    total_camly_rewards = c.calc_total,
    pending_rewards = c.calc_pending,
    approved_reward = c.calc_approved
  FROM calculated c
  WHERE p.id = c.user_id
  RETURNING p.id AS user_id,
    p.total_camly_rewards AS old_total, c.calc_total AS new_total,
    p.pending_rewards AS old_pending, c.calc_pending AS new_pending,
    p.approved_reward AS old_approved, c.calc_approved AS new_approved;
END;
$$;
