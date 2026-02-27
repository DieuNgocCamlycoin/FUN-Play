
-- Update calculate_user_light_score RPC to use new level names + trend
CREATE OR REPLACE FUNCTION public.calculate_user_light_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_score NUMERIC := 0;
  v_reputation_weight NUMERIC := 1.0;
  v_consistency_multiplier NUMERIC := 1.0;
  v_sequence_multiplier NUMERIC := 1.0;
  v_integrity_penalty NUMERIC := 0;
  v_final_score INTEGER := 0;
  v_level TEXT := 'seed';
  v_trend TEXT := 'Stable';
  v_account_age_days INTEGER;
  v_consistency_days INTEGER;
  v_has_approved_content BOOLEAN;
  v_has_donations BOOLEAN;
  v_suspicious_score NUMERIC;
  v_anti_farm_risk NUMERIC;
  v_sequence_count INTEGER;
  v_prev_score INTEGER;
  v_rule_version TEXT := 'V1.0';
BEGIN
  -- Get active rule version
  SELECT sr.rule_version INTO v_rule_version
  FROM scoring_rules sr
  WHERE sr.status = 'active'
  ORDER BY sr.effective_from DESC NULLS LAST
  LIMIT 1;

  -- Get account age
  SELECT EXTRACT(DAY FROM now() - p.created_at)::INTEGER INTO v_account_age_days
  FROM profiles p WHERE p.id = p_user_id;

  IF v_account_age_days IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Calculate base score from recent features
  SELECT COALESCE(
    (f.count_videos * 8 + f.count_posts * 5 + f.count_comments * 3 +
     f.count_likes_given * 1 + f.count_shares * 4 + f.count_donations * 10 +
     f.count_help * 12 + f.count_reports_valid * 6 +
     CASE WHEN f.checkin_done THEN 5 ELSE 0 END +
     f.avg_rating_weighted * 10), 0)
  INTO v_base_score
  FROM features_user_day f
  WHERE f.user_id = p_user_id AND f.date = CURRENT_DATE;

  -- Reputation weight (0.6 - 1.3)
  v_reputation_weight := CASE
    WHEN v_account_age_days >= 365 THEN 1.0
    WHEN v_account_age_days >= 180 THEN 0.9
    WHEN v_account_age_days >= 90 THEN 0.8
    WHEN v_account_age_days >= 30 THEN 0.7
    ELSE 0.6
  END;

  SELECT p.avatar_verified INTO v_has_approved_content FROM profiles p WHERE p.id = p_user_id;
  IF v_has_approved_content THEN v_reputation_weight := LEAST(v_reputation_weight + 0.1, 1.3); END IF;

  SELECT EXISTS(SELECT 1 FROM donation_transactions dt WHERE dt.sender_id = p_user_id AND dt.status = 'success' LIMIT 1) INTO v_has_donations;
  IF v_has_donations THEN v_reputation_weight := LEAST(v_reputation_weight + 0.1, 1.3); END IF;

  -- Consistency multiplier (1.0 - 1.6)
  SELECT COALESCE(p.consistency_days, 0) INTO v_consistency_days FROM profiles p WHERE p.id = p_user_id;
  v_consistency_multiplier := CASE
    WHEN v_consistency_days >= 90 THEN 1.6
    WHEN v_consistency_days >= 30 THEN 1.3
    WHEN v_consistency_days >= 7 THEN 1.1
    ELSE 1.0
  END;

  -- Sequence multiplier
  SELECT COALESCE(f.sequence_count, 0) INTO v_sequence_count
  FROM features_user_day f WHERE f.user_id = p_user_id AND f.date = CURRENT_DATE;
  v_sequence_multiplier := CASE
    WHEN v_sequence_count >= 3 THEN 1.3
    WHEN v_sequence_count >= 1 THEN 1.15
    ELSE 1.0
  END;

  -- Integrity penalty
  SELECT COALESCE(f.anti_farm_risk, 0) INTO v_anti_farm_risk
  FROM features_user_day f WHERE f.user_id = p_user_id AND f.date = CURRENT_DATE;
  v_integrity_penalty := v_anti_farm_risk * 0.5;

  -- Final score
  v_final_score := GREATEST(0, LEAST(100,
    ROUND((v_base_score * v_reputation_weight * v_consistency_multiplier * v_sequence_multiplier) - v_integrity_penalty)
  ))::INTEGER;

  -- Level mapping (new names)
  v_level := CASE
    WHEN v_final_score >= 86 THEN 'architect'
    WHEN v_final_score >= 71 THEN 'guardian'
    WHEN v_final_score >= 51 THEN 'builder'
    WHEN v_final_score >= 26 THEN 'sprout'
    ELSE 'seed'
  END;

  -- Trend calculation
  SELECT lsl.final_light_score INTO v_prev_score
  FROM light_score_ledger lsl
  WHERE lsl.user_id = p_user_id
  ORDER BY lsl.computed_at DESC
  LIMIT 1;

  IF v_prev_score IS NOT NULL THEN
    v_trend := CASE
      WHEN v_final_score - v_prev_score > 5 THEN 'Growing'
      WHEN v_final_score - v_prev_score < -5 THEN 'Reflecting'
      WHEN v_final_score - v_prev_score < -2 THEN 'Rebalancing'
      ELSE 'Stable'
    END;
  END IF;

  -- Update profile
  UPDATE profiles SET
    light_score = v_final_score,
    light_level = v_level
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'final_light_score', v_final_score,
    'base_score', v_base_score,
    'reputation_weight', v_reputation_weight,
    'consistency_multiplier', v_consistency_multiplier,
    'sequence_multiplier', v_sequence_multiplier,
    'integrity_penalty', v_integrity_penalty,
    'level', v_level,
    'trend', v_trend,
    'rule_version', v_rule_version
  );
END;
$$;
