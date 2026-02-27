
-- Add light_level and consistency_days columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS light_level TEXT DEFAULT 'presence';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consistency_days INTEGER DEFAULT 0;

-- Rewrite calculate_user_light_score with Reputation Weight, Consistency Multiplier, Sequence Bonus, and Light Level
CREATE OR REPLACE FUNCTION public.calculate_user_light_score(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_truth_score INTEGER := 0;
  v_trust_score INTEGER := 0;
  v_service_score INTEGER := 0;
  v_healing_score INTEGER := 0;
  v_community_score INTEGER := 0;
  v_pplp_bonus INTEGER := 0;
  v_sequence_bonus INTEGER := 0;
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
  v_active_days INTEGER := 0;
  v_reputation_weight NUMERIC := 0.6;
  v_consistency_multiplier NUMERIC := 1.0;
  v_has_donations BOOLEAN := false;
  v_has_reply_comments BOOLEAN := false;
  v_light_level TEXT := 'presence';
  v_details JSONB;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  v_account_age_days := EXTRACT(EPOCH FROM (now() - v_profile.created_at)) / 86400;

  -- TRUTH PILLAR (max 20)
  IF v_profile.avatar_url IS NOT NULL THEN v_truth_score := v_truth_score + 3; END IF;
  IF v_profile.display_name IS NOT NULL AND length(v_profile.display_name) >= 3 THEN v_truth_score := v_truth_score + 3; END IF;
  IF v_profile.bio IS NOT NULL AND length(v_profile.bio) >= 10 THEN v_truth_score := v_truth_score + 3; END IF;
  IF v_profile.avatar_verified = true THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.wallet_address IS NOT NULL THEN v_truth_score := v_truth_score + 3; END IF;
  -- Login streak from daily_reward_limits
  SELECT COUNT(DISTINCT date) INTO v_active_days FROM public.daily_reward_limits WHERE user_id = p_user_id;
  IF v_active_days >= 30 THEN v_truth_score := v_truth_score + 3;
  ELSIF v_active_days >= 7 THEN v_truth_score := v_truth_score + 2;
  ELSIF v_active_days >= 1 THEN v_truth_score := v_truth_score + 1;
  END IF;
  v_truth_score := LEAST(v_truth_score, 20);

  -- TRUST PILLAR (max 15)
  IF v_account_age_days >= 365 THEN v_trust_score := 15;
  ELSIF v_account_age_days >= 180 THEN v_trust_score := 12;
  ELSIF v_account_age_days >= 90 THEN v_trust_score := 9;
  ELSIF v_account_age_days >= 30 THEN v_trust_score := 6;
  ELSIF v_account_age_days >= 7 THEN v_trust_score := 3;
  ELSE v_trust_score := 1;
  END IF;

  -- SERVICE PILLAR (max 20)
  SELECT COUNT(*) INTO v_video_count FROM public.videos WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_approved_video_count FROM public.videos WHERE user_id = p_user_id AND approval_status = 'approved';
  v_service_score := LEAST(v_approved_video_count * 2, 10);
  IF v_video_count > 0 AND (v_approved_video_count::NUMERIC / v_video_count) >= 0.8 THEN
    v_service_score := v_service_score + 3;
  END IF;
  -- Posts count
  v_service_score := v_service_score + LEAST((SELECT COUNT(*) FROM public.posts WHERE user_id = p_user_id), 4)::INTEGER;
  -- Bounty approved
  v_service_score := v_service_score + LEAST((SELECT COUNT(*) FROM public.bounty_submissions WHERE user_id = p_user_id AND status = 'approved'), 3)::INTEGER;
  v_service_score := LEAST(v_service_score, 20);

  -- HEALING PILLAR (max 20)
  SELECT COUNT(*) INTO v_comment_count FROM public.comments WHERE user_id = p_user_id AND (is_deleted IS NULL OR is_deleted = false);
  SELECT COALESCE(SUM(COALESCE(like_count, 0)), 0) INTO v_likes_received FROM public.videos WHERE user_id = p_user_id;
  v_healing_score := LEAST(v_comment_count, 50) / 5;  -- comments written (max 10 -> cap 5)
  v_healing_score := v_healing_score + LEAST((SELECT COUNT(*) FROM public.likes WHERE user_id = p_user_id AND is_dislike = false), 100)::INTEGER / 20; -- likes given (max 5 -> cap 3)
  v_healing_score := v_healing_score + LEAST(v_likes_received, 200)::INTEGER / 40; -- likes received (max 5 -> cap 3)
  -- Shares from daily_reward_limits
  v_healing_score := v_healing_score + LEAST(COALESCE((SELECT SUM(COALESCE(share_count, 0)) FROM public.daily_reward_limits WHERE user_id = p_user_id), 0), 30)::INTEGER / 10; -- shares (max 3)
  -- Donations sent
  SELECT EXISTS(SELECT 1 FROM public.donation_transactions WHERE sender_id = p_user_id AND status = 'success') INTO v_has_donations;
  IF v_has_donations THEN v_healing_score := v_healing_score + 3; END IF;
  v_healing_score := LEAST(v_healing_score, 20);

  -- COMMUNITY PILLAR (max 15)
  v_community_score := 0;
  v_community_score := LEAST(COALESCE((SELECT SUM(COALESCE(subscriber_count, 0)) FROM public.channels WHERE user_id = p_user_id), 0), 50)::INTEGER / 10; -- subscribers (max 5)
  IF v_profile.facebook_url IS NOT NULL OR v_profile.twitter_url IS NOT NULL OR v_profile.youtube_url IS NOT NULL OR v_profile.telegram_url IS NOT NULL THEN
    v_community_score := v_community_score + 3;
  END IF;
  -- Mint requests approved
  v_community_score := v_community_score + LEAST((SELECT COUNT(*) FROM public.mint_requests WHERE user_id = p_user_id AND status = 'approved'), 4)::INTEGER;
  -- On-chain claims
  v_community_score := v_community_score + LEAST((SELECT COUNT(*) FROM public.claim_requests WHERE user_id = p_user_id AND status = 'success'), 3)::INTEGER;
  v_community_score := LEAST(v_community_score, 15);

  -- PPLP POSITIVE KEYWORDS BONUS (max 10)
  SELECT COUNT(*) INTO v_positive_keyword_count
  FROM public.videos
  WHERE user_id = p_user_id
    AND (
      lower(title) ~ '(cau nguyen|biet on|chua lanh|binh an|yeu thuong|tu bi|tha thu|prayer|gratitude|healing|peace|love|compassion|forgiveness)'
      OR lower(COALESCE(description, '')) ~ '(cau nguyen|biet on|chua lanh|binh an|yeu thuong|tu bi|tha thu|prayer|gratitude|healing|peace|love|compassion|forgiveness)'
    );
  v_pplp_bonus := LEAST(v_positive_keyword_count * 2, 10);

  -- SEQUENCE BONUS (max 10)
  -- Light Growth Chain: has video + received likes + replied to comments (5 pts)
  SELECT EXISTS(
    SELECT 1 FROM public.comments c
    JOIN public.videos v ON v.id = c.video_id
    WHERE c.user_id = p_user_id AND v.user_id = p_user_id AND c.parent_comment_id IS NOT NULL
  ) INTO v_has_reply_comments;
  
  IF v_approved_video_count >= 1 AND v_likes_received >= 5 AND v_has_reply_comments THEN
    v_sequence_bonus := v_sequence_bonus + 5;
  END IF;
  -- Economic Integrity: earned CAMLY + donated back (5 pts)
  IF v_profile.total_camly_rewards > 0 AND v_has_donations THEN
    v_sequence_bonus := v_sequence_bonus + 5;
  END IF;
  v_sequence_bonus := LEAST(v_sequence_bonus, 10);

  -- REPENTANCE MECHANISM
  v_effective_suspicious := COALESCE(v_profile.suspicious_score, 0);
  IF v_profile.avatar_url IS NOT NULL 
     AND v_profile.display_name IS NOT NULL AND length(v_profile.display_name) >= 3
     AND v_profile.bio IS NOT NULL AND length(v_profile.bio) >= 10 THEN
    v_repentance_reduction := LEAST(0.5, (v_comment_count + v_approved_video_count) * 0.05);
    v_effective_suspicious := v_effective_suspicious * (1.0 - v_repentance_reduction);
  END IF;

  -- RAW SCORE (max ~90 from pillars: 20+15+20+20+15+10+10 = 110, but capped later)
  v_raw_score := v_truth_score + v_trust_score + v_service_score + v_healing_score + v_community_score + v_pplp_bonus + v_sequence_bonus;

  -- REPUTATION WEIGHT (0.6 -> 1.3)
  IF v_account_age_days >= 365 THEN v_reputation_weight := 1.0;
  ELSIF v_account_age_days >= 180 THEN v_reputation_weight := 0.9;
  ELSIF v_account_age_days >= 90 THEN v_reputation_weight := 0.8;
  ELSIF v_account_age_days >= 30 THEN v_reputation_weight := 0.7;
  ELSE v_reputation_weight := 0.6;
  END IF;
  -- Bonuses
  IF COALESCE(v_profile.suspicious_score, 0) = 0 THEN v_reputation_weight := v_reputation_weight + 0.1; END IF;
  IF v_approved_video_count > 0 THEN v_reputation_weight := v_reputation_weight + 0.1; END IF;
  IF v_has_donations THEN v_reputation_weight := v_reputation_weight + 0.1; END IF;
  v_reputation_weight := LEAST(v_reputation_weight, 1.3);

  -- CONSISTENCY MULTIPLIER (1.0 -> 1.6)
  IF v_active_days >= 90 THEN v_consistency_multiplier := 1.6;
  ELSIF v_active_days >= 30 THEN v_consistency_multiplier := 1.3;
  ELSIF v_active_days >= 7 THEN v_consistency_multiplier := 1.1;
  ELSE v_consistency_multiplier := 1.0;
  END IF;

  -- FINAL CALCULATION with multipliers
  v_final_score := GREATEST(0, ROUND(v_raw_score * v_reputation_weight * v_consistency_multiplier) - ROUND(v_effective_suspicious * 5)::INTEGER);
  v_final_score := LEAST(v_final_score, 100);

  -- LIGHT LEVEL
  IF v_final_score >= 86 THEN v_light_level := 'architect';
  ELSIF v_final_score >= 71 THEN v_light_level := 'guardian';
  ELSIF v_final_score >= 51 THEN v_light_level := 'builder';
  ELSIF v_final_score >= 26 THEN v_light_level := 'contributor';
  ELSE v_light_level := 'presence';
  END IF;

  v_details := jsonb_build_object(
    'truth', v_truth_score,
    'trust', v_trust_score,
    'service', v_service_score,
    'healing', v_healing_score,
    'community', v_community_score,
    'pplp_bonus', v_pplp_bonus,
    'sequence_bonus', v_sequence_bonus,
    'raw_score', v_raw_score,
    'reputation_weight', ROUND(v_reputation_weight, 2),
    'consistency_multiplier', ROUND(v_consistency_multiplier, 1),
    'consistency_days', v_active_days,
    'suspicious_score', COALESCE(v_profile.suspicious_score, 0),
    'effective_suspicious', ROUND(v_effective_suspicious, 2),
    'repentance_reduction', ROUND(v_repentance_reduction * 100)::INTEGER,
    'account_age_days', v_account_age_days,
    'video_count', v_video_count,
    'approved_videos', v_approved_video_count,
    'positive_content_count', v_positive_keyword_count,
    'light_level', v_light_level
  );

  UPDATE public.profiles SET
    light_score = v_final_score,
    light_level = v_light_level,
    consistency_days = v_active_days,
    last_light_score_update = now(),
    light_score_details = v_details
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'light_score', v_final_score,
    'light_level', v_light_level,
    'details', v_details
  );
END;
$function$;
