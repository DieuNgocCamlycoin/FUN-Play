
-- Create atomic increment function for rewards (prevents race conditions)
CREATE OR REPLACE FUNCTION public.atomic_increment_reward(
  p_user_id uuid,
  p_amount numeric,
  p_auto_approve boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_auto_approve THEN
    UPDATE profiles
    SET
      total_camly_rewards = COALESCE(total_camly_rewards, 0) + p_amount,
      approved_reward = COALESCE(approved_reward, 0) + p_amount
    WHERE id = p_user_id
    RETURNING jsonb_build_object(
      'total_camly_rewards', total_camly_rewards,
      'pending_rewards', pending_rewards,
      'approved_reward', approved_reward
    ) INTO v_result;
  ELSE
    UPDATE profiles
    SET
      total_camly_rewards = COALESCE(total_camly_rewards, 0) + p_amount,
      pending_rewards = COALESCE(pending_rewards, 0) + p_amount
    WHERE id = p_user_id
    RETURNING jsonb_build_object(
      'total_camly_rewards', total_camly_rewards,
      'pending_rewards', pending_rewards,
      'approved_reward', approved_reward
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;
