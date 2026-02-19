
-- =============================================
-- Part 1: Smart Routing - Video Slugs
-- =============================================

-- Add slug column to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index per user (not globally unique - different users can have same slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_user_slug ON public.videos(user_id, slug) WHERE slug IS NOT NULL;

-- Vietnamese diacritics removal + slug generation function
CREATE OR REPLACE FUNCTION public.generate_video_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  vid_user_id UUID;
BEGIN
  vid_user_id := NEW.user_id;
  
  -- If user_id is null, try to get it from channel
  IF vid_user_id IS NULL AND NEW.channel_id IS NOT NULL THEN
    SELECT user_id INTO vid_user_id FROM public.channels WHERE id = NEW.channel_id LIMIT 1;
  END IF;
  
  -- Convert title to slug: remove Vietnamese diacritics, lowercase, replace special chars
  base_slug := NEW.title;
  
  -- Vietnamese diacritics removal
  base_slug := translate(base_slug, 
    'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
  );
  
  -- Lowercase
  base_slug := lower(base_slug);
  
  -- Replace non-alphanumeric with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Limit length
  base_slug := left(base_slug, 80);
  
  -- If empty, use a fallback
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'video';
  END IF;
  
  -- Check for duplicates within same user
  final_slug := base_slug;
  LOOP
    -- Check if this slug already exists for this user (exclude current video on UPDATE)
    IF NOT EXISTS (
      SELECT 1 FROM public.videos 
      WHERE user_id = vid_user_id 
        AND slug = final_slug 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating slug on insert
DROP TRIGGER IF EXISTS trg_generate_video_slug ON public.videos;
CREATE TRIGGER trg_generate_video_slug
  BEFORE INSERT ON public.videos
  FOR EACH ROW
  WHEN (NEW.slug IS NULL)
  EXECUTE FUNCTION public.generate_video_slug();

-- Backfill existing videos with slugs
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN SELECT id, title, user_id FROM public.videos WHERE slug IS NULL ORDER BY created_at ASC
  LOOP
    base_slug := rec.title;
    base_slug := translate(base_slug, 
      'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ',
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
    );
    base_slug := lower(base_slug);
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    base_slug := left(base_slug, 80);
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'video';
    END IF;
    
    final_slug := base_slug;
    counter := 0;
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.videos 
        WHERE user_id = rec.user_id AND slug = final_slug AND id != rec.id
      ) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    UPDATE public.videos SET slug = final_slug WHERE id = rec.id;
  END LOOP;
END $$;

-- =============================================
-- Part 2: PPLP Light Score System
-- =============================================

-- Add light_score columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS light_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_light_score_update TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS light_score_details JSONB;

-- Create the calculate_user_light_score RPC function
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
  -- Fetch profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Account age in days
  v_account_age_days := EXTRACT(EPOCH FROM (now() - v_profile.created_at)) / 86400;

  -- === TRUTH PILLAR (max 20) ===
  -- Profile completeness
  IF v_profile.avatar_url IS NOT NULL THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.display_name IS NOT NULL AND length(v_profile.display_name) >= 3 THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.bio IS NOT NULL AND length(v_profile.bio) >= 10 THEN v_truth_score := v_truth_score + 5; END IF;
  IF v_profile.avatar_verified = true THEN v_truth_score := v_truth_score + 5; END IF;
  v_truth_score := LEAST(v_truth_score, 20);

  -- === TRUST PILLAR (max 20) ===
  -- Account age and consistency
  IF v_account_age_days >= 365 THEN v_trust_score := 20;
  ELSIF v_account_age_days >= 180 THEN v_trust_score := 15;
  ELSIF v_account_age_days >= 90 THEN v_trust_score := 12;
  ELSIF v_account_age_days >= 30 THEN v_trust_score := 8;
  ELSIF v_account_age_days >= 7 THEN v_trust_score := 4;
  ELSE v_trust_score := 1;
  END IF;

  -- === SERVICE PILLAR (max 20) ===
  -- Content contribution
  SELECT COUNT(*) INTO v_video_count FROM public.videos WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_approved_video_count FROM public.videos WHERE user_id = p_user_id AND status = 'approved';
  
  v_service_score := LEAST(v_approved_video_count * 2, 15);
  -- Bonus for high approval rate
  IF v_video_count > 0 AND (v_approved_video_count::NUMERIC / v_video_count) >= 0.8 THEN
    v_service_score := v_service_score + 5;
  END IF;
  v_service_score := LEAST(v_service_score, 20);

  -- === HEALING PILLAR (max 20) ===
  -- Community engagement
  SELECT COUNT(*) INTO v_comment_count FROM public.comments WHERE user_id = p_user_id AND is_deleted = false;
  SELECT COALESCE(SUM(like_count), 0) INTO v_likes_received FROM public.videos WHERE user_id = p_user_id;
  
  v_healing_score := LEAST(v_comment_count, 50) / 5 + LEAST(v_likes_received, 200) / 20;
  v_healing_score := LEAST(v_healing_score, 20);

  -- === COMMUNITY/UNITY PILLAR (max 20) ===
  -- Shares, subscriptions, engagement diversity
  v_community_score := 0;
  -- Check if user has subscribers
  SELECT COALESCE(SUM(subscriber_count), 0) INTO v_community_score 
  FROM public.channels WHERE user_id = p_user_id;
  v_community_score := LEAST(v_community_score, 10);
  -- Wallet connected = commitment to ecosystem
  IF v_profile.wallet_address IS NOT NULL THEN v_community_score := v_community_score + 5; END IF;
  -- Social links filled = transparency
  IF v_profile.facebook_url IS NOT NULL OR v_profile.twitter_url IS NOT NULL OR v_profile.youtube_url IS NOT NULL THEN
    v_community_score := v_community_score + 5;
  END IF;
  v_community_score := LEAST(v_community_score, 20);

  -- === PPLP POSITIVE KEYWORDS BONUS (max 10) ===
  SELECT COUNT(*) INTO v_positive_keyword_count
  FROM public.videos
  WHERE user_id = p_user_id
    AND (
      lower(title) ~ '(cầu nguyện|biết ơn|chữa lành|bình an|yêu thương|từ bi|tha thứ|prayer|gratitude|healing|peace|love|compassion|forgiveness)'
      OR lower(COALESCE(description, '')) ~ '(cầu nguyện|biết ơn|chữa lành|bình an|yêu thương|từ bi|tha thứ|prayer|gratitude|healing|peace|love|compassion|forgiveness)'
    );
  v_pplp_bonus := LEAST(v_positive_keyword_count * 2, 10);

  -- === REPENTANCE MECHANISM ===
  -- If user has completed profile AND has positive engagement, reduce suspicious_score effect by up to 50%
  v_effective_suspicious := COALESCE(v_profile.suspicious_score, 0);
  IF v_profile.avatar_url IS NOT NULL 
     AND v_profile.display_name IS NOT NULL AND length(v_profile.display_name) >= 3
     AND v_profile.bio IS NOT NULL AND length(v_profile.bio) >= 10 THEN
    -- Repentance: reduce by engagement level (up to 50%)
    v_repentance_reduction := LEAST(0.5, (v_comment_count + v_approved_video_count) * 0.05);
    v_effective_suspicious := v_effective_suspicious * (1.0 - v_repentance_reduction);
  END IF;

  -- === FINAL CALCULATION ===
  v_raw_score := v_truth_score + v_trust_score + v_service_score + v_healing_score + v_community_score + v_pplp_bonus;
  -- Penalty: each point of effective suspicious_score reduces by 5 points
  v_final_score := GREATEST(0, v_raw_score - ROUND(v_effective_suspicious * 5)::INTEGER);
  v_final_score := LEAST(v_final_score, 100);

  -- Build details
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

  -- Update profile
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
