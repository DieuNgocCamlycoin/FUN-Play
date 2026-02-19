
CREATE OR REPLACE FUNCTION public.calculate_user_light_score(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_truth_score INTEGER := 0;
  v_trust_score INTEGER := 0;
  v_service_score INTEGER := 0;
  v_healing_score INTEGER := 0;
  v_community_score INTEGER := 0;
  v_pplp_bonus INTEGER := 0;
  v_repentance_reduction NUMERIC := 0;
  v_effective_suspicious NUMERIC := 0;
  v_raw_score INTEGER := 0;
  v_final_score INTEGER := 0;
  v_video_count INTEGER := 0;
  v_approved_video_count INTEGER := 0;
  v_comment_count INTEGER := 0;
  v_likes_received INTEGER := 0;
  v_account_age_days INTEGER := 0;
  v_positive_keyword_count INTEGER := 0;
  v_details JSONB;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  v_account_age_days := EXTRACT(EPOCH FROM (now() - v_profile.created_at)) / 86400;

  -- TRUTH PILLAR (max 20)
  IF v_profile.avatar_url IS NOT NULL THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.display_name IS NOT NULL AND length(v_profile.display_name) >= 3 THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.bio IS NOT NULL AND length(v_profile.bio) >= 10 THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.avatar_verified = true THEN v_truth_score := v_truth_score + 5; END IF;
  v_truth_score := LEAST(v_truth_score, 20);

  -- TRUST PILLAR (max 20)
  IF v_account_age_days >= 365 THEN v_trust_score := 20;
  ELSIF v_account_age_days >= 180 THEN v_trust_score := 15;
  ELSIF v_account_age_days >= 90 THEN v_trust_score := 12;
  ELSIF v_account_age_days >= 30 THEN v_trust_score := 8;
  ELSIF v_account_age_days >= 7 THEN v_trust_score := 4;
  ELSE v_trust_score := 1;
  END IF;

  -- SERVICE PILLAR (max 20) - uses approval_status
  SELECT COUNT(*) INTO v_video_count FROM public.videos WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_approved_video_count FROM public.videos WHERE user_id = p_user_id AND approval_status = 'approved';
  
  v_service_score := LEAST(v_approved_video_count * 2, 15);
  IF v_video_count > 0 AND (v_approved_video_count::NUMERIC / v_video_count) >= 0.8 THEN
    v_service_score := v_service_score + 5;
  END IF;
  v_service_score := LEAST(v_service_score, 20);

  -- HEALING PILLAR (max 20)
  SELECT COUNT(*) INTO v_comment_count FROM public.comments WHERE user_id = p_user_id AND (is_deleted IS NULL OR is_deleted = false);
  SELECT COALESCE(SUM(COALESCE(like_count, 0)), 0) INTO v_likes_received FROM public.videos WHERE user_id = p_user_id;
  
  v_healing_score := LEAST(v_comment_count, 50) / 5 + LEAST(v_likes_received, 200) / 20;
  v_healing_score := LEAST(v_healing_score, 20);

  -- COMMUNITY/UNITY PILLAR (max 20)
  v_community_score := 0;
  SELECT COALESCE(SUM(COALESCE(subscriber_count, 0)), 0) INTO v_community_score 
  FROM public.channels WHERE user_id = p_user_id;
  v_community_score := LEAST(v_community_score, 10);
  IF v_profile.wallet_address IS NOT NULL THEN v_community_score := v_community_score + 5; END IF;
  IF v_profile.facebook_url IS NOT NULL OR v_profile.twitter_url IS NOT NULL OR v_profile.youtube_url IS NOT NULL THEN
    v_community_score := v_community_score + 5;
  END IF;
  v_community_score := LEAST(v_community_score, 20);

  -- PPLP POSITIVE KEYWORDS BONUS (max 10)
  SELECT COUNT(*) INTO v_positive_keyword_count
  FROM public.videos
  WHERE user_id = p_user_id
    AND (
      lower(title) ~ '(cau nguyen|biet on|chua lanh|binh an|yeu thuong|tu bi|tha thu|prayer|gratitude|healing|peace|love|compassion|forgiveness)'
      OR lower(COALESCE(description, '')) ~ '(cau nguyen|biet on|chua lanh|binh an|yeu thuong|tu bi|tha thu|prayer|gratitude|healing|peace|love|compassion|forgiveness)'
    );
  v_pplp_bonus := LEAST(v_positive_keyword_count * 2, 10);

  -- REPENTANCE MECHANISM
  v_effective_suspicious := COALESCE(v_profile.suspicious_score, 0);
  IF v_profile.avatar_url IS NOT NULL 
     AND v_profile.display_name IS NOT NULL AND length(v_profile.display_name) >= 3
     AND v_profile.bio IS NOT NULL AND length(v_profile.bio) >= 10 THEN
    v_repentance_reduction := LEAST(0.5, (v_comment_count + v_approved_video_count) * 0.05);
    v_effective_suspicious := v_effective_suspicious * (1.0 - v_repentance_reduction);
  END IF;

  -- FINAL CALCULATION
  v_raw_score := v_truth_score + v_trust_score + v_service_score + v_healing_score + v_community_score + v_pplp_bonus;
  v_final_score := GREATEST(0, v_raw_score - ROUND(v_effective_suspicious * 5)::INTEGER);
  v_final_score := LEAST(v_final_score, 100);

  v_details := jsonb_build_object(
    'truth', v_truth_score,
    'trust', v_trust_score,
    'service', v_service_score,
    'healing', v_healing_score,
    'community', v_community_score,
    'pplp_bonus', v_pplp_bonus,
    'raw_score', v_raw_score,
    'suspicious_score', COALESCE(v_profile.suspicious_score, 0),
    'effective_suspicious', ROUND(v_effective_suspicious, 2),
    'repentance_reduction', ROUND(v_repentance_reduction * 100)::INTEGER,
    'account_age_days', v_account_age_days,
    'video_count', v_video_count,
    'approved_videos', v_approved_video_count,
    'positive_content_count', v_positive_keyword_count
  );

  UPDATE public.profiles SET
    light_score = v_final_score,
    last_light_score_update = now(),
    light_score_details = v_details
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'light_score', v_final_score,
    'details', v_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
