

# Fix Admin Dashboard Statistics -- Data Accuracy and Performance

## Problem

The `useAdminStatistics` hook (used by the Overview tab) has **critical data truncation** and **performance issues**:

1. **Reward total is wrong**: Fetches `reward_transactions.amount` rows client-side, but there are **14,088 rows** -- Supabase only returns max 1,000. The displayed "Total CAMLY distributed" is massively underreported.
2. **Views total is wrong**: Fetches all video rows to sum `view_count` client-side -- with **976 videos** it's close to the 1,000 limit and will break soon.
3. **Daily stats truncated**: Fetches all `reward_transactions`, `view_logs`, and `comments` from last 30 days -- each can exceed 1,000 rows, causing inaccurate charts.
4. **Top Earners include banned users**: No `.eq("banned", false)` filter on the earners query.
5. **Top Creators include banned users**: Fetches all videos with joined profiles, no banned filter.
6. **10+ parallel network requests**: Wasteful when a single RPC can return everything.

## Solution

Create a new `get_admin_dashboard_stats()` RPC function that computes everything server-side in one call, then simplify `useAdminStatistics` to a single RPC call.

### 1. Database Migration: `get_admin_dashboard_stats()` RPC

A single SQL function that returns:
- Platform stats (totalUsers, totalVideos, totalViews, totalComments, totalRewards, activeUsersToday) -- all accurate, no row limits
- Top 10 creators (excluding banned users)
- Top 10 earners (excluding banned users)
- Daily stats for last 30 days (aggregated server-side)

```sql
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'platformStats', jsonb_build_object(
      'totalUsers', (SELECT COUNT(*) FROM profiles),
      'totalVideos', (SELECT COUNT(*) FROM videos),
      'totalViews', (SELECT COALESCE(SUM(view_count),0) FROM videos),
      'totalComments', (SELECT COUNT(*) FROM comments),
      'totalRewardsDistributed', (SELECT COALESCE(SUM(amount),0) FROM reward_transactions WHERE status='success'),
      'activeUsersToday', (SELECT COUNT(DISTINCT user_id) FROM daily_reward_limits WHERE date=CURRENT_DATE)
    ),
    'topEarners', (
      SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM (
        SELECT id as "userId", display_name as "displayName", avatar_url as "avatarUrl",
               COALESCE(total_camly_rewards,0) as "totalEarned"
        FROM profiles WHERE COALESCE(banned,false)=false
        ORDER BY total_camly_rewards DESC NULLS LAST LIMIT 10
      ) e
    ),
    'topCreators', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT v.user_id as "userId", p.display_name as "displayName", p.avatar_url as "avatarUrl",
               COUNT(*) as "videoCount", COALESCE(SUM(v.view_count),0) as "totalViews",
               COALESCE(p.total_camly_rewards,0) as "totalRewards"
        FROM videos v JOIN profiles p ON p.id=v.user_id
        WHERE COALESCE(p.banned,false)=false
        GROUP BY v.user_id, p.display_name, p.avatar_url, p.total_camly_rewards
        ORDER BY SUM(v.view_count) DESC NULLS LAST LIMIT 10
      ) c
    ),
    'dailyStats', (
      SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.date), '[]'::jsonb)
      FROM (
        SELECT
          gs::date as date,
          COALESCE(act.cnt, 0) as "activeUsers",
          COALESCE(rew.total, 0) as "rewardsDistributed"
        FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') gs
        LEFT JOIN (
          SELECT date, COUNT(DISTINCT user_id) as cnt FROM daily_reward_limits
          WHERE date >= CURRENT_DATE - 29 GROUP BY date
        ) act ON act.date = gs::date
        LEFT JOIN (
          SELECT created_at::date as dt, SUM(amount) as total FROM reward_transactions
          WHERE status='success' AND created_at >= CURRENT_DATE - 29 GROUP BY dt
        ) rew ON rew.dt = gs::date
      ) d
    )
  );
$$;
```

This replaces **10+ client queries** with **1 RPC call** and eliminates all 1,000-row truncation risks.

### 2. Refactor `src/hooks/useAdminStatistics.tsx`

Replace the entire 230-line hook with a clean ~40-line version:

```typescript
const { data } = await supabase.rpc("get_admin_dashboard_stats");
// data contains platformStats, topEarners, topCreators, dailyStats
```

- Remove all 10+ individual Supabase queries
- Remove all client-side aggregation (Map, reduce, Set)
- Remove unused interfaces if simplified

### 3. No changes needed to:
- `OverviewTab.tsx` -- it consumes `useAdminStatistics` output, interface stays compatible
- `useAdminManage.ts` -- admin user management is separate and correct
- `useAdminRealtime.ts` -- realtime badge counts are separate and correct
- `UnifiedAdminDashboard.tsx` -- layout orchestration is clean

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Network requests | 10+ parallel queries | 1 RPC call |
| Total CAMLY accuracy | Truncated at 1,000 rows (14,088 exist) | Exact server-side SUM |
| Total Views accuracy | Near-limit (976 videos) | Exact server-side SUM |
| Daily chart accuracy | Truncated per table | Exact server-side aggregation |
| Top Earners | Includes 359 banned users | Only active users |
| Top Creators | Includes banned users' videos | Only active users |
| Code lines | ~230 lines | ~40 lines |

