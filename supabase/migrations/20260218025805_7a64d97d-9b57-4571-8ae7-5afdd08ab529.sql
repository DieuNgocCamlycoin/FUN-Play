
-- 1. Fix ip_tracking constraint to allow 'login'
ALTER TABLE ip_tracking DROP CONSTRAINT IF EXISTS ip_tracking_action_type_check;
ALTER TABLE ip_tracking ADD CONSTRAINT ip_tracking_action_type_check
  CHECK (action_type IN ('signup', 'wallet_connect', 'claim', 'login'));

-- 2. Create Materialized View for Top Ranking
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_ranking AS
SELECT id, username, display_name, avatar_url, total_camly_rewards
FROM profiles
WHERE COALESCE(banned, false) = false
  AND COALESCE(total_camly_rewards, 0) > 0
ORDER BY total_camly_rewards DESC NULLS LAST
LIMIT 100;

-- Index for fast queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_ranking_id ON mv_top_ranking (id);
CREATE INDEX IF NOT EXISTS idx_mv_top_ranking_rewards ON mv_top_ranking (total_camly_rewards DESC);

-- Function to refresh MV
CREATE OR REPLACE FUNCTION refresh_mv_top_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_ranking;
END;
$$;
