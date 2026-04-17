
-- 1) tier_from_tc
CREATE OR REPLACE FUNCTION public.tier_from_tc(_tc numeric)
RETURNS trust_tier LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _tc >= 1.25 THEN 'T4'::trust_tier
    WHEN _tc >= 1.10 THEN 'T3'::trust_tier
    WHEN _tc >= 0.95 THEN 'T2'::trust_tier
    WHEN _tc >= 0.70 THEN 'T1'::trust_tier
    ELSE 'T0'::trust_tier
  END
$$;

-- 2) recompute_trust_profile
CREATE OR REPLACE FUNCTION public.recompute_trust_profile(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _vs numeric := 0; _bs numeric := 0; _ss numeric := 0;
  _os numeric := 0; _hs numeric := 0; _rf numeric := 1.0;
  _tc numeric; _tier trust_tier;
  _attest_count int := 0; _sybil int := 0; _did_level did_level;
  _new_flags jsonb;
BEGIN
  SELECT level INTO _did_level FROM did_registry WHERE user_id = _user_id;
  _vs := LEAST(1.0, CASE _did_level
    WHEN 'L0' THEN 0.10 WHEN 'L1' THEN 0.40 WHEN 'L2' THEN 0.70
    WHEN 'L3' THEN 0.90 WHEN 'L4' THEN 1.00 ELSE 0.10 END);

  SELECT LEAST(1.0, ln(1 + COUNT(*)::numeric) / ln(51))
    INTO _bs FROM identity_events
    WHERE user_id = _user_id
      AND created_at > now() - interval '90 days'
      AND COALESCE(tc_delta, 0) >= 0;
  _bs := COALESCE(_bs, 0);

  SELECT COUNT(*) INTO _attest_count FROM attestation_log
    WHERE to_user_id = _user_id AND status = 'active';
  _ss := LEAST(1.0, ln(1 + _attest_count::numeric) / ln(11));

  SELECT COALESCE(SUM(trust_weight), 0) INTO _os FROM sbt_registry
    WHERE user_id = _user_id AND status = 'active';
  _os := LEAST(1.0, _os::numeric);

  SELECT LEAST(1.0,
    (EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 365.0
  ) INTO _hs FROM profiles WHERE id = _user_id;
  _hs := COALESCE(_hs, 0);

  SELECT sybil_risk INTO _sybil FROM trust_profile WHERE user_id = _user_id;
  _rf := GREATEST(0.3, 1.0 - (COALESCE(_sybil, 0)::numeric / 100.0) * 0.7);

  _tc := (0.30*_vs + 0.25*_bs + 0.15*_ss + 0.20*_os + 0.10*_hs) * _rf;
  _tc := GREATEST(0.30, LEAST(1.50, 0.30 + _tc * 1.20));
  _tier := tier_from_tc(_tc);

  _new_flags := jsonb_build_object(
    'can_vote',       _tier IN ('T2','T3','T4'),
    'can_propose',    _tier IN ('T3','T4'),
    'can_mint_full',  _tier IN ('T2','T3','T4'),
    'can_issue_sbt',  _tier = 'T4',
    'sandbox_only',   _tier IN ('T0','T1')
  );

  UPDATE trust_profile SET
    vs = ROUND(_vs::numeric, 4), bs = ROUND(_bs::numeric, 4),
    ss = ROUND(_ss::numeric, 4), os = ROUND(_os::numeric, 4),
    hs = ROUND(_hs::numeric, 4), rf = ROUND(_rf::numeric, 4),
    tc = ROUND(_tc::numeric, 4), tier = _tier,
    permission_flags = _new_flags,
    last_computed_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- 3) log_identity_event
CREATE OR REPLACE FUNCTION public.log_identity_event(
  _user_id uuid, _event_type text, _tc_delta numeric DEFAULT 0,
  _risk_delta int DEFAULT 0, _payload jsonb DEFAULT '{}'::jsonb,
  _event_ref text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _event_id uuid; _did_id uuid;
BEGIN
  SELECT did_id INTO _did_id FROM did_registry WHERE user_id = _user_id;
  INSERT INTO identity_events (user_id, did_id, event_type, tc_delta, risk_delta, payload, event_ref)
  VALUES (_user_id, _did_id, _event_type, _tc_delta, _risk_delta, _payload, _event_ref)
  RETURNING id INTO _event_id;

  IF _risk_delta <> 0 THEN
    UPDATE trust_profile
       SET sybil_risk = LEAST(100, GREATEST(0, sybil_risk + _risk_delta))
     WHERE user_id = _user_id;
  END IF;
  PERFORM recompute_trust_profile(_user_id);
  RETURN _event_id;
END;
$$;

-- 4) evaluate_sbt_rule
CREATE OR REPLACE FUNCTION public.evaluate_sbt_rule(_user_id uuid, _rule_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rule sbt_issuance_rules%ROWTYPE; _did did_registry%ROWTYPE;
  _trust trust_profile%ROWTYPE; _profile profiles%ROWTYPE;
  _cond jsonb; _v text; _streak int := 0; _mints int := 0;
  _events int := 0; _wallet text;
BEGIN
  SELECT * INTO _rule FROM sbt_issuance_rules WHERE id = _rule_id AND is_active = true;
  IF NOT FOUND OR _rule.issue_mode <> 'auto' THEN RETURN false; END IF;

  SELECT * INTO _did FROM did_registry WHERE user_id = _user_id;
  SELECT * INTO _trust FROM trust_profile WHERE user_id = _user_id;
  SELECT * INTO _profile FROM profiles WHERE id = _user_id;
  IF _did.user_id IS NULL THEN RETURN false; END IF;

  _cond := _rule.conditions;

  IF _cond ? 'min_did_level' THEN
    _v := _cond->>'min_did_level';
    IF substring(_did.level::text, 2)::int < substring(_v, 2)::int THEN RETURN false; END IF;
  END IF;

  IF (_cond->>'wallet_required')::boolean OR (_cond->>'requires_wallet')::boolean THEN
    SELECT wallet_address INTO _wallet FROM profiles WHERE id = _user_id;
    IF _wallet IS NULL OR _wallet = '' THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'min_account_age_days' THEN
    IF (now() - _profile.created_at) < ((_cond->>'min_account_age_days')::int || ' days')::interval THEN RETURN false; END IF;
  END IF;

  IF (_cond->>'requires_pplp_accepted')::boolean OR (_cond->>'requires_charter_acceptance')::boolean THEN
    IF _profile.pplp_accepted_at IS NULL THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'max_sybil_risk' THEN
    IF _trust.sybil_risk > (_cond->>'max_sybil_risk')::int THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'min_tc' THEN
    IF _trust.tc < (_cond->>'min_tc')::numeric THEN RETURN false; END IF;
  END IF;
  IF _cond ? 'min_tier' THEN
    IF substring(_trust.tier::text, 2)::int < substring(_cond->>'min_tier', 2)::int THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'min_validated_events' THEN
    SELECT COUNT(*) INTO _events FROM identity_events
      WHERE user_id = _user_id
        AND created_at > now() - ((COALESCE(_cond->>'window_days','30'))::int || ' days')::interval
        AND COALESCE(tc_delta,0) > 0;
    IF _events < (_cond->>'min_validated_events')::int THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'min_streak' THEN
    SELECT COALESCE(consistency_days, 0) INTO _streak FROM profiles WHERE id = _user_id;
    IF _streak < (_cond->>'min_streak')::int THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'min_successful_mints' THEN
    SELECT COUNT(*) INTO _mints FROM pplp_mint_requests
      WHERE user_id = _user_id AND status = 'confirmed';
    IF _mints < (_cond->>'min_successful_mints')::int THEN RETURN false; END IF;
  END IF;

  IF _cond ? 'days_clean' THEN
    IF EXISTS (SELECT 1 FROM identity_events
      WHERE user_id = _user_id
        AND created_at > now() - ((_cond->>'days_clean')::int || ' days')::interval
        AND tc_delta < 0) THEN RETURN false; END IF;
  END IF;

  RETURN true;
END;
$$;

-- 5) issue_sbt_if_eligible
CREATE OR REPLACE FUNCTION public.issue_sbt_if_eligible(_user_id uuid, _rule_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _rule sbt_issuance_rules%ROWTYPE; _did_id uuid; _token uuid;
BEGIN
  SELECT * INTO _rule FROM sbt_issuance_rules WHERE id = _rule_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM sbt_registry WHERE user_id = _user_id AND sbt_type = _rule.sbt_type AND status = 'active') THEN
    RETURN NULL;
  END IF;
  IF NOT evaluate_sbt_rule(_user_id, _rule_id) THEN RETURN NULL; END IF;

  SELECT did_id INTO _did_id FROM did_registry WHERE user_id = _user_id;
  IF _did_id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO sbt_registry (did_id, user_id, category, sbt_type, issuer, trust_weight, privacy_level, metadata)
  VALUES (_did_id, _user_id, _rule.category, _rule.sbt_type, 'system', _rule.trust_weight, 'public',
    jsonb_build_object('rule_id', _rule.id, 'auto_issued_at', now()))
  RETURNING token_id INTO _token;

  PERFORM log_identity_event(_user_id, 'sbt_issued', 0.05, 0,
    jsonb_build_object('sbt_type', _rule.sbt_type, 'token_id', _token), _token::text);
  RETURN _token;
END;
$$;

-- 6) auto_issue_all_sbts
CREATE OR REPLACE FUNCTION public.auto_issue_all_sbts(_user_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r record; _issued int := 0; _token uuid;
BEGIN
  FOR _r IN SELECT id FROM sbt_issuance_rules WHERE issue_mode = 'auto' AND is_active = true LOOP
    _token := issue_sbt_if_eligible(_user_id, _r.id);
    IF _token IS NOT NULL THEN _issued := _issued + 1; END IF;
  END LOOP;
  RETURN _issued;
END;
$$;

-- 7) Trigger: mint confirmed
CREATE OR REPLACE FUNCTION public.on_mint_confirmed_log_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    PERFORM log_identity_event(NEW.user_id, 'mint_confirmed', 0.02, 0,
      jsonb_build_object('amount', NEW.amount, 'platform', NEW.platform_id), NEW.id::text);
    PERFORM auto_issue_all_sbts(NEW.user_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_mint_confirmed_identity ON pplp_mint_requests;
CREATE TRIGGER trg_mint_confirmed_identity
AFTER UPDATE ON pplp_mint_requests FOR EACH ROW EXECUTE FUNCTION on_mint_confirmed_log_identity();

-- 8) Trigger: charter acceptance via profiles.pplp_accepted_at
CREATE OR REPLACE FUNCTION public.on_charter_accept_log_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pplp_accepted_at IS NOT NULL AND OLD.pplp_accepted_at IS NULL THEN
    PERFORM log_identity_event(NEW.id, 'charter_accepted', 0.05, 0,
      jsonb_build_object('version', NEW.pplp_version), NULL);
    PERFORM auto_issue_all_sbts(NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_charter_accept_identity ON profiles;
CREATE TRIGGER trg_charter_accept_identity
AFTER UPDATE OF pplp_accepted_at ON profiles
FOR EACH ROW EXECUTE FUNCTION on_charter_accept_log_identity();

-- 9) Trigger: wallet link
CREATE OR REPLACE FUNCTION public.on_wallet_link_log_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.wallet_address IS NOT NULL AND (OLD.wallet_address IS NULL OR OLD.wallet_address = '')
     AND NEW.wallet_address <> '' THEN
    PERFORM log_identity_event(NEW.id, 'wallet_linked', 0.03, 0,
      jsonb_build_object('wallet', NEW.wallet_address), NULL);
    UPDATE did_registry SET level = 'L1', updated_at = now()
      WHERE user_id = NEW.id AND level = 'L0';
    PERFORM auto_issue_all_sbts(NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_wallet_link_identity ON profiles;
CREATE TRIGGER trg_wallet_link_identity
AFTER UPDATE OF wallet_address ON profiles
FOR EACH ROW EXECUTE FUNCTION on_wallet_link_log_identity();
