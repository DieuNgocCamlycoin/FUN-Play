
CREATE OR REPLACE FUNCTION public.get_fun_money_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_minted numeric;
  total_potential numeric;
  user_count integer;
  request_count integer;
  action_breakdown jsonb;
  status_breakdown jsonb;
  top_holders jsonb;
  daily_mints jsonb;
BEGIN
  -- Admin check
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Total FUN minted (from mint_requests, excluding rejected)
  SELECT COALESCE(SUM(CAST(calculated_amount_formatted AS numeric)), 0)
  INTO total_minted
  FROM mint_requests
  WHERE status != 'rejected';

  -- Total potential FUN (from reward_transactions)
  SELECT COALESCE(SUM(
    CASE 
      WHEN reward_type IN ('VIEW', 'WATCH_VIDEO') THEN 10
      WHEN reward_type IN ('LIKE', 'LIKE_VIDEO') THEN 5
      WHEN reward_type = 'COMMENT' THEN 15
      WHEN reward_type = 'SHARE' THEN 20
      WHEN reward_type IN ('UPLOAD', 'UPLOAD_VIDEO', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD') THEN 100
      ELSE 0
    END
  ), 0)
  INTO total_potential
  FROM reward_transactions;

  -- Distinct users who minted
  SELECT COUNT(DISTINCT user_id) INTO user_count FROM mint_requests WHERE status != 'rejected';

  -- Total mint requests
  SELECT COUNT(*) INTO request_count FROM mint_requests;

  -- Breakdown by action type (potential)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO action_breakdown
  FROM (
    SELECT 
      CASE 
        WHEN reward_type IN ('VIEW', 'WATCH_VIDEO') THEN 'VIEW'
        WHEN reward_type IN ('LIKE', 'LIKE_VIDEO') THEN 'LIKE'
        WHEN reward_type = 'COMMENT' THEN 'COMMENT'
        WHEN reward_type = 'SHARE' THEN 'SHARE'
        WHEN reward_type IN ('UPLOAD', 'UPLOAD_VIDEO', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD') THEN 'UPLOAD'
        ELSE 'OTHER'
      END AS action,
      COUNT(*) AS action_count,
      SUM(
        CASE 
          WHEN reward_type IN ('VIEW', 'WATCH_VIDEO') THEN 10
          WHEN reward_type IN ('LIKE', 'LIKE_VIDEO') THEN 5
          WHEN reward_type = 'COMMENT' THEN 15
          WHEN reward_type = 'SHARE' THEN 20
          WHEN reward_type IN ('UPLOAD', 'UPLOAD_VIDEO', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD') THEN 100
          ELSE 0
        END
      ) AS total_fun
    FROM reward_transactions
    GROUP BY 1
    ORDER BY total_fun DESC
  ) t;

  -- Breakdown by status
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO status_breakdown
  FROM (
    SELECT status, COUNT(*) AS count,
           COALESCE(SUM(CAST(calculated_amount_formatted AS numeric)), 0) AS total_fun
    FROM mint_requests
    GROUP BY status
    ORDER BY count DESC
  ) t;

  -- Top 10 FUN holders
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO top_holders
  FROM (
    SELECT 
      mr.user_id,
      p.display_name,
      p.avatar_url,
      SUM(CAST(mr.calculated_amount_formatted AS numeric)) AS total_fun,
      COUNT(*) AS request_count,
      array_agg(DISTINCT mr.action_type) AS action_types
    FROM mint_requests mr
    LEFT JOIN profiles p ON p.id = mr.user_id
    WHERE mr.status != 'rejected'
    GROUP BY mr.user_id, p.display_name, p.avatar_url
    ORDER BY total_fun DESC
    LIMIT 10
  ) t;

  -- Daily mints (last 30 days)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  INTO daily_mints
  FROM (
    SELECT 
      d.date::text AS date,
      COALESCE(COUNT(mr.id), 0) AS request_count,
      COALESCE(SUM(CAST(mr.calculated_amount_formatted AS numeric)), 0) AS total_fun
    FROM generate_series(
      CURRENT_DATE - INTERVAL '29 days',
      CURRENT_DATE,
      '1 day'
    ) AS d(date)
    LEFT JOIN mint_requests mr ON DATE(mr.created_at) = d.date AND mr.status != 'rejected'
    GROUP BY d.date
    ORDER BY d.date
  ) t;

  result := jsonb_build_object(
    'totalMinted', total_minted,
    'totalPotential', total_potential,
    'userCount', user_count,
    'requestCount', request_count,
    'actionBreakdown', action_breakdown,
    'statusBreakdown', status_breakdown,
    'topHolders', top_holders,
    'dailyMints', daily_mints
  );

  RETURN result;
END;
$$;
