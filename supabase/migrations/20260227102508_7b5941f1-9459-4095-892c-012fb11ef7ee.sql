
-- Function to aggregate user daily activity from real tables into features_user_day
CREATE OR REPLACE FUNCTION public.aggregate_features_user_day(p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO features_user_day (
    user_id, date,
    count_posts, count_comments, count_videos,
    count_likes_given, count_shares, count_donations,
    count_help, count_reports_valid,
    checkin_done, consistency_streak, sequence_count,
    anti_farm_risk, avg_rating_weighted, content_pillar_score
  )
  SELECT
    p.id AS user_id,
    p_date AS date,
    -- Posts created on this date
    COALESCE((SELECT COUNT(*) FROM posts WHERE user_id = p.id AND created_at::date = p_date), 0),
    -- Comments (from both comments and post_comments tables)
    COALESCE((SELECT COUNT(*) FROM comments WHERE user_id = p.id AND created_at::date = p_date), 0)
    + COALESCE((SELECT COUNT(*) FROM post_comments WHERE user_id = p.id AND created_at::date = p_date), 0),
    -- Videos
    COALESCE((SELECT COUNT(*) FROM videos WHERE user_id = p.id AND created_at::date = p_date), 0),
    -- Likes given
    COALESCE((SELECT COUNT(*) FROM likes WHERE user_id = p.id AND created_at::date = p_date), 0)
    + COALESCE((SELECT COUNT(*) FROM post_likes WHERE user_id = p.id AND created_at::date = p_date), 0),
    -- Shares (from reward_transactions as proxy)
    COALESCE((SELECT COUNT(*) FROM reward_transactions WHERE user_id = p.id AND reward_type = 'SHARE' AND created_at::date = p_date AND status = 'success'), 0),
    -- Donations
    COALESCE((SELECT COUNT(*) FROM donation_transactions WHERE sender_id = p.id AND created_at::date = p_date AND status = 'success'), 0),
    -- Help (mentor sessions, answering questions - use bounty submissions as proxy)
    COALESCE((SELECT COUNT(*) FROM bounty_submissions WHERE user_id = p.id AND created_at::date = p_date AND status = 'approved'), 0),
    -- Valid reports
    0,
    -- Checkin
    EXISTS(SELECT 1 FROM daily_checkins WHERE user_id = p.id AND checkin_date = p_date),
    -- Consistency streak (from daily_checkins or profile)
    COALESCE(p.consistency_days, 0),
    -- Sequence count (number of different action types done today)
    (
      SELECT COUNT(DISTINCT action_type) FROM (
        SELECT 'post' AS action_type FROM posts WHERE user_id = p.id AND created_at::date = p_date HAVING COUNT(*) > 0
        UNION ALL
        SELECT 'comment' FROM comments WHERE user_id = p.id AND created_at::date = p_date HAVING COUNT(*) > 0
        UNION ALL
        SELECT 'video' FROM videos WHERE user_id = p.id AND created_at::date = p_date HAVING COUNT(*) > 0
        UNION ALL
        SELECT 'like' FROM likes WHERE user_id = p.id AND created_at::date = p_date HAVING COUNT(*) > 0
        UNION ALL
        SELECT 'donation' FROM donation_transactions WHERE sender_id = p.id AND created_at::date = p_date AND status = 'success' HAVING COUNT(*) > 0
      ) actions
    ),
    -- Anti-farm risk (use suspicious_score from profile as proxy, normalized to 0-1)
    LEAST(1.0, COALESCE(p.suspicious_score, 0)::NUMERIC / 100.0),
    -- Avg rating weighted (placeholder - no rating data yet)
    0,
    -- Content pillar score (placeholder)
    0
  FROM profiles p
  WHERE COALESCE(p.banned, false) = false
    -- Only include users who had some activity on this date
    AND (
      EXISTS(SELECT 1 FROM posts WHERE user_id = p.id AND created_at::date = p_date)
      OR EXISTS(SELECT 1 FROM comments WHERE user_id = p.id AND created_at::date = p_date)
      OR EXISTS(SELECT 1 FROM post_comments WHERE user_id = p.id AND created_at::date = p_date)
      OR EXISTS(SELECT 1 FROM videos WHERE user_id = p.id AND created_at::date = p_date)
      OR EXISTS(SELECT 1 FROM likes WHERE user_id = p.id AND created_at::date = p_date)
      OR EXISTS(SELECT 1 FROM post_likes WHERE user_id = p.id AND created_at::date = p_date)
      OR EXISTS(SELECT 1 FROM donation_transactions WHERE sender_id = p.id AND created_at::date = p_date AND status = 'success')
      OR EXISTS(SELECT 1 FROM daily_checkins WHERE user_id = p.id AND checkin_date = p_date)
    )
  ON CONFLICT (user_id, date) DO UPDATE SET
    count_posts = EXCLUDED.count_posts,
    count_comments = EXCLUDED.count_comments,
    count_videos = EXCLUDED.count_videos,
    count_likes_given = EXCLUDED.count_likes_given,
    count_shares = EXCLUDED.count_shares,
    count_donations = EXCLUDED.count_donations,
    count_help = EXCLUDED.count_help,
    checkin_done = EXCLUDED.checkin_done,
    consistency_streak = EXCLUDED.consistency_streak,
    sequence_count = EXCLUDED.sequence_count,
    anti_farm_risk = EXCLUDED.anti_farm_risk,
    updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to backfill historical data 
CREATE OR REPLACE FUNCTION public.backfill_features_user_day(p_days_back INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date DATE;
  v_total INTEGER := 0;
  v_count INTEGER;
BEGIN
  FOR v_date IN SELECT generate_series(CURRENT_DATE - p_days_back, CURRENT_DATE, '1 day'::interval)::date
  LOOP
    SELECT public.aggregate_features_user_day(v_date) INTO v_count;
    v_total := v_total + v_count;
  END LOOP;
  RETURN v_total;
END;
$$;

-- Also update calculate_user_light_score to aggregate across ALL days (epoch), not just latest day
CREATE OR REPLACE FUNCTION public.calculate_user_light_score(p_user_id uuid)
RETURNS jsonb
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
  v_epoch_start DATE;
BEGIN
  -- Get account age
  SELECT EXTRACT(DAY FROM (now() - p.created_at))::INTEGER
  INTO v_account_age_days
  FROM profiles p WHERE p.id = p_user_id;

  IF v_account_age_days IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  -- Epoch = current month
  v_epoch_start := date_trunc('month', CURRENT_DATE)::date;

  -- Section 3: Reputation Weight
  v_reputation := COALESCE(v_account_age_days::NUMERIC / 30.0, 0);
  v_reputation_weight := LEAST(2.0, GREATEST(0.5, 1 + 0.25 * LN(1 + v_reputation)));

  -- Aggregate ALL features in current epoch (not just latest day)
  SELECT
    COALESCE(MAX(consistency_streak), 0),
    COALESCE(SUM(sequence_count), 0),
    COALESCE(AVG(anti_farm_risk), 0),
    -- Action base: sum across all days in epoch
    COALESCE(SUM(count_posts), 0) * 3
      + COALESCE(SUM(count_comments), 0) * 1.5
      + COALESCE(SUM(count_videos), 0) * 5
      + COALESCE(SUM(count_likes_given), 0) * 0.3
      + COALESCE(SUM(count_shares), 0) * 0.8
      + COALESCE(SUM(count_help), 0) * 6
      + COALESCE(SUM(count_donations), 0) * 4
      + COALESCE(SUM(count_reports_valid), 0) * 2
      + COUNT(*) FILTER (WHERE checkin_done = true) * 1,
    COALESCE(SUM(content_pillar_score), 0)
  INTO v_consistency_streak, v_sequence_count, v_anti_farm_risk, v_action_base, v_content_score
  FROM features_user_day
  WHERE user_id = p_user_id AND date >= v_epoch_start;

  -- If no features data, try to compute from raw tables for current epoch
  IF v_action_base = 0 THEN
    SELECT
      COALESCE((SELECT COUNT(*) FROM posts WHERE user_id = p_user_id AND created_at >= v_epoch_start), 0) * 3
      + COALESCE((SELECT COUNT(*) FROM comments WHERE user_id = p_user_id AND created_at >= v_epoch_start), 0) * 1.5
      + COALESCE((SELECT COUNT(*) FROM post_comments WHERE user_id = p_user_id AND created_at >= v_epoch_start), 0) * 1.5
      + COALESCE((SELECT COUNT(*) FROM videos WHERE user_id = p_user_id AND created_at >= v_epoch_start), 0) * 5
      + COALESCE((SELECT COUNT(*) FROM likes WHERE user_id = p_user_id AND created_at >= v_epoch_start), 0) * 0.3
      + COALESCE((SELECT COUNT(*) FROM post_likes WHERE user_id = p_user_id AND created_at >= v_epoch_start), 0) * 0.3
      + COALESCE((SELECT COUNT(*) FROM donation_transactions WHERE sender_id = p_user_id AND created_at >= v_epoch_start AND status = 'success'), 0) * 4
    INTO v_action_base;
    
    -- Get consistency from profile
    SELECT COALESCE(consistency_days, 0) INTO v_consistency_streak FROM profiles WHERE id = p_user_id;
  END IF;

  -- Section 7: Consistency Multiplier
  v_consistency_mul := 1 + 0.6 * (1 - EXP(-v_consistency_streak::NUMERIC / 30.0));

  -- Section 8: Sequence Multiplier
  v_sequence_mul := 1 + 0.5 * (
    (EXP(2.0 * v_sequence_count::NUMERIC / 5.0) - 1) /
    (EXP(2.0 * v_sequence_count::NUMERIC / 5.0) + 1)
  );

  -- Section 9: Integrity Penalty
  v_integrity_penalty := 1 - LEAST(0.5, 0.8 * v_anti_farm_risk);

  -- Section 11: Daily Light Score
  v_raw_score := 0.4 * v_action_base + 0.6 * v_content_score;

  -- L = L^raw * M^cons * M^seq * Π * w_u
  v_final_score := v_raw_score * v_consistency_mul * v_sequence_mul * v_integrity_penalty * v_reputation_weight;
  v_final_score := ROUND(v_final_score);

  -- Section 15: Level mapping
  v_level := CASE
    WHEN v_final_score >= 1200 THEN 'architect'
    WHEN v_final_score >= 500 THEN 'guardian'
    WHEN v_final_score >= 200 THEN 'builder'
    WHEN v_final_score >= 50 THEN 'sprout'
    ELSE 'seed'
  END;

  -- Trend
  SELECT final_light_score INTO v_prev_score
  FROM light_score_ledger WHERE user_id = p_user_id ORDER BY computed_at DESC LIMIT 1;

  IF v_prev_score IS NULL THEN v_trend := 'Stable';
  ELSIF v_final_score > v_prev_score * 1.1 THEN v_trend := 'Growing';
  ELSIF v_final_score < v_prev_score * 0.9 THEN v_trend := 'Reflecting';
  ELSIF v_final_score < v_prev_score THEN v_trend := 'Rebalancing';
  ELSE v_trend := 'Stable';
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
      'epoch_start', v_epoch_start,
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
