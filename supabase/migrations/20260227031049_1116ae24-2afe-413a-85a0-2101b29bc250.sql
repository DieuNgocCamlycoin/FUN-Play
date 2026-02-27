
-- Add content_pillar_score to features_user_day
ALTER TABLE public.features_user_day
  ADD COLUMN IF NOT EXISTS content_pillar_score NUMERIC DEFAULT 0;

-- Replace calculate_user_light_score with LS-Math v1.0 formulas
CREATE OR REPLACE FUNCTION public.calculate_user_light_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_age_days INTEGER;
  v_reputation NUMERIC;
  v_reputation_weight NUMERIC;
  v_consistency_streak INTEGER;
  v_consistency_mul NUMERIC;
  v_sequence_count INTEGER;
  v_sequence_mul NUMERIC;
  v_anti_farm_risk NUMERIC;
  v_integrity_penalty NUMERIC;
  v_action_base NUMERIC;
  v_content_score NUMERIC;
  v_raw_score NUMERIC;
  v_final_score NUMERIC;
  v_level TEXT;
  v_trend TEXT;
  v_prev_score NUMERIC;
  v_rule_version TEXT := 'LS-Math-v1.0';
  v_pplp_accepted BOOLEAN;
  v_has_approved_content BOOLEAN;
  v_has_donations BOOLEAN;
  v_features RECORD;
BEGIN
  -- Get account age
  SELECT EXTRACT(DAY FROM (now() - p.created_at))::INTEGER
  INTO v_account_age_days
  FROM profiles p WHERE p.id = p_user_id;

  IF v_account_age_days IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  -- Section 3: Reputation Weight (logarithmic)
  -- R_u based on account age + contribution history
  v_reputation := COALESCE(v_account_age_days::NUMERIC / 30.0, 0);
  v_reputation_weight := LEAST(2.0, GREATEST(0.5, 1 + 0.25 * LN(1 + v_reputation)));

  -- Get latest features
  SELECT * INTO v_features
  FROM features_user_day
  WHERE user_id = p_user_id
  ORDER BY date DESC
  LIMIT 1;

  v_consistency_streak := COALESCE(v_features.consistency_streak, 0);
  v_sequence_count := COALESCE(v_features.sequence_count, 0);
  v_anti_farm_risk := COALESCE(v_features.anti_farm_risk, 0);

  -- Section 7: Consistency Multiplier: 1 + 0.6 * (1 - exp(-S/30))
  v_consistency_mul := 1 + 0.6 * (1 - EXP(-v_consistency_streak::NUMERIC / 30.0));

  -- Section 8: Sequence Multiplier: 1 + 0.5 * tanh(Q/5)
  v_sequence_mul := 1 + 0.5 * (
    (EXP(2.0 * v_sequence_count::NUMERIC / 5.0) - 1) /
    (EXP(2.0 * v_sequence_count::NUMERIC / 5.0) + 1)
  );

  -- Section 9: Integrity Penalty: 1 - min(0.5, 0.8 * r)
  v_integrity_penalty := 1 - LEAST(0.5, 0.8 * v_anti_farm_risk);

  -- Section 5: Action Base Score
  v_action_base := COALESCE(v_features.count_posts, 0) * 3
    + COALESCE(v_features.count_comments, 0) * 1.5
    + COALESCE(v_features.count_videos, 0) * 5
    + COALESCE(v_features.count_likes_given, 0) * 0.3
    + COALESCE(v_features.count_shares, 0) * 0.8
    + COALESCE(v_features.count_help, 0) * 6
    + COALESCE(v_features.count_donations, 0) * 4
    + COALESCE(v_features.count_reports_valid, 0) * 2
    + CASE WHEN COALESCE(v_features.checkin_done, false) THEN 1 ELSE 0 END;

  -- Section 6: Content Daily Score using content_pillar_score
  -- C_u(t) = Σ ρ(type) * (P_c/10)^1.3
  -- Simplified: use avg_rating_weighted as proxy for P_c
  v_content_score := COALESCE(v_features.content_pillar_score, 0);
  IF v_content_score = 0 AND COALESCE(v_features.avg_rating_weighted, 0) > 0 THEN
    v_content_score := POWER(LEAST(v_features.avg_rating_weighted / 10.0, 1.0), 1.3)
      * (COALESCE(v_features.count_posts, 0) * 1.0
       + COALESCE(v_features.count_videos, 0) * 1.5
       + COALESCE(v_features.count_comments, 0) * 0.4);
  END IF;

  -- Section 11: Daily Light Score
  -- L^raw = ω_B * B + ω_C * C
  v_raw_score := 0.4 * v_action_base + 0.6 * v_content_score;

  -- L = L^raw * M^cons * M^seq * Π
  v_final_score := v_raw_score * v_consistency_mul * v_sequence_mul * v_integrity_penalty;

  -- Apply reputation weight
  v_final_score := v_final_score * v_reputation_weight;

  -- Round
  v_final_score := ROUND(v_final_score);

  -- Section 15: Level mapping
  v_level := CASE
    WHEN v_final_score >= 1200 THEN 'architect'
    WHEN v_final_score >= 500 THEN 'guardian'
    WHEN v_final_score >= 200 THEN 'builder'
    WHEN v_final_score >= 50 THEN 'sprout'
    ELSE 'seed'
  END;

  -- Trend calculation
  SELECT final_light_score INTO v_prev_score
  FROM light_score_ledger
  WHERE user_id = p_user_id
  ORDER BY computed_at DESC
  LIMIT 1;

  IF v_prev_score IS NULL THEN
    v_trend := 'Stable';
  ELSIF v_final_score > v_prev_score * 1.1 THEN
    v_trend := 'Growing';
  ELSIF v_final_score < v_prev_score * 0.9 THEN
    v_trend := 'Reflecting';
  ELSIF v_final_score < v_prev_score THEN
    v_trend := 'Rebalancing';
  ELSE
    v_trend := 'Stable';
  END IF;

  -- Update profile
  UPDATE profiles SET
    light_score = v_final_score::INTEGER,
    light_level = v_level,
    last_light_score_update = now(),
    light_score_details = jsonb_build_object(
      'rule_version', v_rule_version,
      'reputation_weight', ROUND(v_reputation_weight::NUMERIC, 4),
      'action_base', ROUND(v_action_base::NUMERIC, 4),
      'content_score', ROUND(v_content_score::NUMERIC, 4),
      'raw_score', ROUND(v_raw_score::NUMERIC, 4),
      'consistency_multiplier', ROUND(v_consistency_mul::NUMERIC, 4),
      'sequence_multiplier', ROUND(v_sequence_mul::NUMERIC, 4),
      'integrity_penalty', ROUND(v_integrity_penalty::NUMERIC, 4),
      'final_score', v_final_score,
      'level', v_level,
      'trend', v_trend,
      'streak', v_consistency_streak,
      'computed_at', now()
    )
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'score', v_final_score,
    'level', v_level,
    'trend', v_trend,
    'rule_version', v_rule_version,
    'details', jsonb_build_object(
      'reputation_weight', ROUND(v_reputation_weight::NUMERIC, 4),
      'action_base', ROUND(v_action_base::NUMERIC, 4),
      'content_score', ROUND(v_content_score::NUMERIC, 4),
      'consistency_multiplier', ROUND(v_consistency_mul::NUMERIC, 4),
      'sequence_multiplier', ROUND(v_sequence_mul::NUMERIC, 4),
      'integrity_penalty', ROUND(v_integrity_penalty::NUMERIC, 4)
    )
  );
END;
$$;
