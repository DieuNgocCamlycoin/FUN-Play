CREATE OR REPLACE FUNCTION public.recompute_sybil_risk(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _score int := 0;
  _ip_cluster int := 0;
  _device_cluster int := 0;
  _velocity_1h int := 0;
  _account_age_days numeric := 0;
  _has_phone boolean := false;
  _has_wallet boolean := false;
  _user_ip text;
  _user_device text;
BEGIN
  -- Most recent IP/device fingerprint of this user
  SELECT ip_hash, device_fingerprint
    INTO _user_ip, _user_device
    FROM ip_tracking
    WHERE user_id = _user_id
    ORDER BY created_at DESC
    LIMIT 1;

  -- Signal 1: distinct accounts sharing same IP in 30d
  IF _user_ip IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO _ip_cluster
      FROM ip_tracking
      WHERE ip_hash = _user_ip
        AND user_id IS NOT NULL
        AND user_id <> _user_id
        AND created_at > now() - interval '30 days';
    IF _ip_cluster >= 2 THEN
      _score := _score + LEAST(30, _ip_cluster * 6);
    END IF;
  END IF;

  -- Signal 2: distinct accounts sharing same device fingerprint
  IF _user_device IS NOT NULL AND length(_user_device) > 8 THEN
    SELECT COUNT(DISTINCT user_id) INTO _device_cluster
      FROM ip_tracking
      WHERE device_fingerprint = _user_device
        AND user_id IS NOT NULL
        AND user_id <> _user_id;
    IF _device_cluster >= 1 THEN
      _score := _score + LEAST(25, _device_cluster * 10);
    END IF;
  END IF;

  -- Signal 3: bot-like velocity — too many events in 1h
  SELECT COUNT(*) INTO _velocity_1h
    FROM pplp_events
    WHERE actor_user_id = _user_id
      AND occurred_at > now() - interval '1 hour';
  IF _velocity_1h > 60 THEN
    _score := _score + LEAST(25, (_velocity_1h - 60) / 4);
  END IF;

  -- Signal 4: account age + verification
  SELECT
    EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0,
    (au.phone_confirmed_at IS NOT NULL),
    (p.wallet_address IS NOT NULL AND p.wallet_address <> '')
  INTO _account_age_days, _has_phone, _has_wallet
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE p.id = _user_id;

  IF _account_age_days < 7 AND NOT _has_phone AND NOT _has_wallet THEN
    _score := _score + 15;
  ELSIF _account_age_days < 1 THEN
    _score := _score + 8;
  END IF;

  IF NOT _has_phone AND NOT _has_wallet THEN
    _score := _score + 5;
  END IF;

  -- Clamp 0..100
  _score := GREATEST(0, LEAST(100, _score));

  -- Persist
  UPDATE trust_profile
    SET sybil_risk = _score
    WHERE user_id = _user_id;

  -- Cascade trust recompute
  PERFORM recompute_trust_profile(_user_id);

  -- Log if high
  IF _score >= 60 THEN
    INSERT INTO identity_events (user_id, event_type, risk_delta, payload, ai_origin)
    SELECT _user_id, 'sybil_risk_high', 0,
      jsonb_build_object(
        'score', _score,
        'ip_cluster', _ip_cluster,
        'device_cluster', _device_cluster,
        'velocity_1h', _velocity_1h,
        'account_age_days', _account_age_days
      ),
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM identity_events
       WHERE user_id = _user_id
         AND event_type = 'sybil_risk_high'
         AND created_at > now() - interval '6 hours'
    );
  END IF;

  RETURN _score;
END;
$$;