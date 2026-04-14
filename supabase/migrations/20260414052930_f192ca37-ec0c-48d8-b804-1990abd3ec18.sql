
CREATE OR REPLACE FUNCTION public.get_founder_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  pillar_avgs jsonb;
  trust_dist jsonb;
  event_stats jsonb;
  flagged_count integer;
  top_light jsonb;
  streak_leaders jsonb;
BEGIN
  -- Check admin role
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT public.is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. System-wide pillar averages from pplp_validations
  SELECT jsonb_build_object(
    'transparent_truth', COALESCE(round(avg(transparent_truth)::numeric, 2), 0),
    'unity_over_separation', COALESCE(round(avg(unity_over_separation)::numeric, 2), 0),
    'long_term_value', COALESCE(round(avg(long_term_value)::numeric, 2), 0),
    'serving_life', COALESCE(round(avg(serving_life)::numeric, 2), 0),
    'healing_love', COALESCE(round(avg(healing_love)::numeric, 2), 0)
  ) INTO pillar_avgs
  FROM pplp_validations
  WHERE validation_status = 'validated';

  -- 2. Trust level distribution
  SELECT COALESCE(jsonb_agg(jsonb_build_object('trust_level', tl, 'count', cnt)), '[]'::jsonb)
  INTO trust_dist
  FROM (
    SELECT trust_level as tl, count(*) as cnt
    FROM profiles
    WHERE banned IS NOT TRUE
    GROUP BY trust_level
    ORDER BY trust_level
  ) sub;

  -- 3. Event & attendance stats
  SELECT jsonb_build_object(
    'total_events', (SELECT count(*) FROM events),
    'total_attendance', (SELECT count(*) FROM attendance),
    'confirmed_attendance', (SELECT count(*) FROM attendance WHERE confirmation_status = 'confirmed'),
    'avg_participation_factor', COALESCE((SELECT round(avg(participation_factor)::numeric, 2) FROM attendance WHERE participation_factor IS NOT NULL), 0)
  ) INTO event_stats;

  -- 4. Flagged users count
  SELECT count(*) INTO flagged_count
  FROM profiles
  WHERE suspicious_score IS NOT NULL AND suspicious_score > 50;

  -- 5. Top Light Score users (top 10)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', id,
    'display_name', display_name,
    'avatar_url', avatar_url,
    'total_light_score', total_light_score,
    'light_level', light_level,
    'trust_level', trust_level
  )), '[]'::jsonb) INTO top_light
  FROM (
    SELECT id, display_name, avatar_url, total_light_score, light_level, trust_level
    FROM profiles
    WHERE banned IS NOT TRUE
    ORDER BY total_light_score DESC
    LIMIT 10
  ) sub;

  -- 6. Streak leaders (top 10)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', id,
    'display_name', display_name,
    'avatar_url', avatar_url,
    'consistency_days', consistency_days,
    'light_level', light_level
  )), '[]'::jsonb) INTO streak_leaders
  FROM (
    SELECT id, display_name, avatar_url, consistency_days, light_level
    FROM profiles
    WHERE banned IS NOT TRUE AND consistency_days IS NOT NULL AND consistency_days > 0
    ORDER BY consistency_days DESC
    LIMIT 10
  ) sub;

  -- Build final result
  result := jsonb_build_object(
    'pillar_averages', pillar_avgs,
    'trust_distribution', trust_dist,
    'event_stats', event_stats,
    'flagged_user_count', flagged_count,
    'top_light_users', top_light,
    'streak_leaders', streak_leaders
  );

  RETURN result;
END;
$$;
