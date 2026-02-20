
CREATE OR REPLACE FUNCTION public.trigger_sync_profile_rewards()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  UPDATE profiles SET
    total_camly_rewards = COALESCE(sub.calc_total, 0),
    pending_rewards = COALESCE(sub.calc_pending, 0),
    approved_reward = COALESCE(sub.calc_approved, 0)
  FROM (
    SELECT
      COALESCE(SUM(amount), 0) AS calc_total,
      COALESCE(SUM(amount) FILTER (
        WHERE (approved = false OR approved IS NULL) AND claimed = false
      ), 0) AS calc_pending,
      COALESCE(SUM(amount) FILTER (
        WHERE approved = true AND claimed = false
      ), 0) AS calc_approved
    FROM reward_transactions
    WHERE user_id = v_user_id AND status = 'success'
  ) sub
  WHERE profiles.id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_profile_reward_totals
  AFTER INSERT OR UPDATE OR DELETE ON reward_transactions
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_profile_rewards();
