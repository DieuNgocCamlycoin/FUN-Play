
-- 1. Wallet change audit log table
CREATE TABLE IF NOT EXISTS wallet_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  old_wallet text,
  new_wallet text,
  reason text DEFAULT 'user',
  ip_hash text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON wallet_change_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin read all logs" ON wallet_change_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert logs" ON wallet_change_log FOR INSERT WITH CHECK (true);

-- 2. Wallet history table
CREATE TABLE IF NOT EXISTS wallet_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  wallet_address text NOT NULL,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_by text DEFAULT 'system'
);

ALTER TABLE wallet_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own history" ON wallet_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin read all history" ON wallet_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert history" ON wallet_history FOR INSERT WITH CHECK (true);

-- 3. Security columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_change_count_30d integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_wallet_change_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS claim_freeze_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_risk_status text DEFAULT 'NORMAL';

-- 4. Migrate existing wallet data to wallet_history
INSERT INTO wallet_history (user_id, wallet_address, is_active, started_at)
SELECT id, wallet_address, true, COALESCE(created_at, now())
FROM profiles
WHERE wallet_address IS NOT NULL;

-- 5. RPC: request_wallet_change
CREATE OR REPLACE FUNCTION public.request_wallet_change(
  p_user_id uuid,
  p_new_wallet text,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_reason text DEFAULT 'user'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_disabled_val numeric;
  v_disabled boolean;
  v_cooldown_days integer;
  v_freeze_hours integer;
  v_max_changes integer;
  v_changes_30d integer;
  v_risk text;
  v_freeze interval;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN '{"error":"User not found"}'::jsonb; END IF;

  -- Feature flag check
  SELECT config_value INTO v_disabled_val FROM reward_config WHERE config_key = 'WALLET_CHANGE_DISABLED';
  v_disabled := COALESCE(v_disabled_val, 0) > 0;
  IF v_disabled AND p_reason != 'admin' THEN
    RETURN '{"error":"WALLET_CHANGE_DISABLED","message":"Tạm khóa đổi ví để nâng cấp bảo mật. Vui lòng thử lại sau."}'::jsonb;
  END IF;

  -- Load config
  SELECT COALESCE((SELECT config_value::int FROM reward_config WHERE config_key = 'WALLET_CHANGE_COOLDOWN_DAYS'), 30) INTO v_cooldown_days;
  SELECT COALESCE((SELECT config_value::int FROM reward_config WHERE config_key = 'WALLET_CHANGE_FREEZE_HOURS'), 72) INTO v_freeze_hours;
  SELECT COALESCE((SELECT config_value::int FROM reward_config WHERE config_key = 'WALLET_CHANGE_MAX_30D'), 1) INTO v_max_changes;

  -- Cooldown check
  IF v_profile.last_wallet_change_at IS NOT NULL
     AND v_profile.last_wallet_change_at > now() - (v_cooldown_days || ' days')::interval
     AND p_reason != 'admin' THEN
    RETURN jsonb_build_object(
      'error', 'COOLDOWN',
      'message', 'Bạn chỉ được đổi ví mỗi ' || v_cooldown_days || ' ngày.',
      'next_change_at', v_profile.last_wallet_change_at + (v_cooldown_days || ' days')::interval
    );
  END IF;

  -- 30-day change count
  SELECT COUNT(*) INTO v_changes_30d
    FROM wallet_change_log
    WHERE user_id = p_user_id AND created_at > now() - interval '30 days';

  IF v_changes_30d >= v_max_changes AND p_reason != 'admin' THEN
    RETURN jsonb_build_object('error', 'MAX_CHANGES', 'message', 'Đã đạt giới hạn đổi ví trong 30 ngày.');
  END IF;

  -- Audit log
  INSERT INTO wallet_change_log (user_id, old_wallet, new_wallet, reason, ip_hash, user_agent)
  VALUES (p_user_id, v_profile.wallet_address, p_new_wallet, p_reason, p_ip_hash, p_user_agent);

  -- Deactivate old wallet in history
  UPDATE wallet_history SET is_active = false, ended_at = now()
    WHERE user_id = p_user_id AND is_active = true;

  -- Insert new wallet history
  INSERT INTO wallet_history (user_id, wallet_address, is_active, created_by)
  VALUES (p_user_id, p_new_wallet, true, p_reason);

  -- Risk scoring
  v_changes_30d := v_changes_30d + 1;
  v_risk := 'NORMAL';
  v_freeze := (v_freeze_hours || ' hours')::interval;

  IF v_changes_30d >= 3 THEN v_risk := 'BLOCKED'; v_freeze := interval '999 days';
  ELSIF v_changes_30d >= 2 THEN v_risk := 'REVIEW'; v_freeze := interval '7 days';
  ELSIF v_changes_30d >= 1 THEN v_risk := 'WATCH';
  END IF;

  UPDATE profiles SET
    wallet_address = p_new_wallet,
    last_wallet_change_at = now(),
    wallet_change_count_30d = v_changes_30d,
    claim_freeze_until = now() + v_freeze,
    wallet_risk_status = v_risk
  WHERE id = p_user_id;

  -- Freeze pending claims
  UPDATE claim_requests SET status = 'pending_review'
    WHERE user_id = p_user_id AND status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'risk_status', v_risk,
    'freeze_until', now() + v_freeze,
    'changes_30d', v_changes_30d
  );
END;
$$;
