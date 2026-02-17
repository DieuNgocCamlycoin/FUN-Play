

# Fix Honor Board, Top Ranking & Top Sponsors -- Exclude Banned Users

## Problem

345 out of 687 total users are banned, but all three systems currently include them:

- **Top Ranking**: Banned users with high rewards (e.g. 2.3M CAMLY) appear in the leaderboard
- **Top Sponsors**: Banned users can appear as top donors
- **Honobar Stats**: Shows 687 total users instead of 342 active users; totalRewards and camlyPool include banned users' balances
- **1000-row limit risk**: `useHonobarStats` fetches all profile rows and all video rows for client-side aggregation -- with 687+ profiles and growing, this will silently truncate data

## Changes

### 1. `src/hooks/useTopRanking.ts`

Add `.eq("banned", false)` filter to the query:

```
.from("profiles")
.select(...)
.eq("banned", false)        // <-- ADD THIS
.order("total_camly_rewards", { ascending: false })
.limit(limit)
```

One-line fix. No other changes needed -- the hook is clean and efficient.

### 2. `src/hooks/useTopSponsors.ts`

Add `.eq("banned", false)` when fetching profiles for top donors, and filter out any donors whose profile comes back as banned:

```
.from("profiles")
.select("id, username, display_name, avatar_url, banned")
.eq("banned", false)         // <-- ADD THIS
.in("id", userIds)
```

Then filter out any userId not found in profileMap (meaning they're banned). This is a small change -- the hook fetches at most 5 profiles so no 1000-row issue.

### 3. `src/hooks/useHonobarStats.tsx`

This has the biggest issues -- client-side aggregation that hits the 1000-row limit. Replace with server-side aggregation:

- **totalUsers**: Add `.eq("banned", false)` to the count query
- **totalRewards & camlyPool**: Replace the row-fetching approach (`select("total_camly_rewards, approved_reward")` then `.reduce()`) with two `head: true` count queries that use Supabase's built-in aggregation, OR use a simple RPC. Since we need SUM not COUNT, the cleanest approach is a small RPC function.
- **totalViews**: Same issue -- fetching all video rows to sum `view_count`. Replace with an RPC or use a single aggregate query.

**New database function** `get_honobar_stats`:
```sql
CREATE OR REPLACE FUNCTION get_honobar_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles WHERE COALESCE(banned,false)=false),
    'totalVideos', (SELECT COUNT(*) FROM videos WHERE approval_status='approved'),
    'totalViews', (SELECT COALESCE(SUM(view_count),0) FROM videos WHERE approval_status='approved'),
    'totalComments', (SELECT COUNT(*) FROM comments),
    'totalRewards', (SELECT COALESCE(SUM(total_camly_rewards),0) FROM profiles WHERE COALESCE(banned,false)=false),
    'totalSubscriptions', (SELECT COUNT(*) FROM subscriptions),
    'camlyPool', (SELECT COALESCE(SUM(approved_reward),0) FROM profiles WHERE COALESCE(banned,false)=false),
    'totalPosts', (SELECT COUNT(*) FROM posts),
    'totalPhotos', (SELECT COUNT(*) FROM videos WHERE category='photo')
  );
$$;
```

Then simplify `useHonobarStats` to a single RPC call instead of 8 parallel queries:

```typescript
const { data } = await supabase.rpc("get_honobar_stats");
if (data) setStats(data as HonobarStats);
```

This eliminates the 1000-row limit problem entirely and reduces 8 network requests to 1.

### 4. No changes needed

- `ProfileHonorBoard.tsx` -- per-user component, correct as-is
- `usePublicUsersDirectory.ts` -- already filters `WHERE COALESCE(p.banned,false)=false`
- `useUsersDirectoryStats.ts` -- admin-only, should show all users including banned

## Impact Summary

| System | Before | After |
|--------|--------|-------|
| Top Ranking | Shows banned users | Only active users |
| Top Sponsors | Shows banned donors | Only active donors |
| Honobar totalUsers | 687 (includes 345 banned) | ~342 active only |
| Honobar totalRewards | Inflated by banned users | Accurate for active users |
| Honobar network requests | 8 parallel queries | 1 single RPC call |
| 1000-row limit risk | Yes (profiles + videos) | Eliminated |

## Technical Details

### Database Migration

One new function: `get_honobar_stats()` -- a read-only SQL function that returns all 9 stats as a single JSON object with banned users excluded.

### File Changes

1. **New migration**: Create `get_honobar_stats` RPC function
2. **`src/hooks/useHonobarStats.tsx`**: Replace 8 parallel queries with single `supabase.rpc("get_honobar_stats")` call
3. **`src/hooks/useTopRanking.ts`**: Add `.eq("banned", false)` (1 line)
4. **`src/hooks/useTopSponsors.ts`**: Add `.eq("banned", false)` to profile fetch + filter out missing profiles (2-3 lines)

