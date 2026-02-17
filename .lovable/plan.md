
# Fake Account Detection and System Optimization

## Abuse Analysis Results

The investigation revealed **massive multi-account farming**:

- **Top offending IP**: 118 accounts created from a single IP address, 109 of which have exactly 550,000 pending CAMLY each
- **Total suspicious IPs** (5+ accounts): accounts hold **168.4M pending CAMLY** out of 187.5M total platform pending (90% of all pending rewards are from abusers)
- **47 users** share an empty wallet address with 11.4M pending CAMLY
- All fake accounts follow the same pattern: auto-generated `user_XXXXXXXX` usernames, 550,000 pending rewards, created in rapid succession

## Plan

### 1. Performance Fix -- useAdminManage.ts (Critical)

The hook fetches ALL rows from `videos` and `comments` tables just to count per-user totals. With growing data, this hits the Supabase 1,000-row limit and wastes bandwidth.

**Fix**: Replace the three separate queries (profiles, all videos, all comments) with a single call to the existing `get_users_directory_stats()` database function, which already computes all counts efficiently server-side.

```text
Before: 3 queries (profiles + all videos + all comments) with client-side counting
After:  1 query via RPC get_users_directory_stats() with server-side aggregation
```

### 2. Unused Import Cleanup -- IPAbuseDetectionTab.tsx

The `RefreshCw` icon import is used, but `Loader2` is imported from lucide-react even though it is used in the loading state -- this is fine. No unused imports found here. Skip.

### 3. Unused Import Cleanup -- AllUsersTab.tsx

- `Download` is imported from lucide-react but never used in JSX (only `FileSpreadsheet` is used for the export button)

### 4. Unused Import Cleanup -- QuickDeleteTab.tsx

- `Shield` icon is used in the empty state -- all imports are valid. No changes needed.

## Technical Details

### File: `src/hooks/useAdminManage.ts`

**Replace `fetchUsers` function** (lines 40-90) to use the existing `get_users_directory_stats` RPC instead of 3 separate queries:

```typescript
const fetchUsers = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.rpc("get_users_directory_stats" as any);
    if (error) throw error;

    const enrichedUsers = ((data as any[]) || []).map((p: any) => ({
      id: p.user_id,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      wallet_address: p.wallet_address,
      total_camly_rewards: p.total_camly_rewards || 0,
      pending_rewards: p.pending_rewards || 0,
      approved_reward: p.approved_reward || 0,
      banned: p.banned || false,
      banned_at: null,
      ban_reason: null,
      violation_level: 0,
      avatar_verified: p.avatar_verified || false,
      created_at: p.created_at,
      videos_count: p.videos_count || 0,
      comments_count: p.comments_count || 0,
    })) as AdminUser[];

    setUsers(enrichedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    setLoading(false);
  }
};
```

This eliminates 2 unnecessary queries and removes the 1,000-row limit issue on videos/comments counting.

### File: `src/components/Admin/tabs/AllUsersTab.tsx`

**Line 7** -- Remove unused `Download` import:
```typescript
// Change from:
import { Users, Search, Download, FileSpreadsheet } from "lucide-react";
// To:
import { Users, Search, FileSpreadsheet } from "lucide-react";
```

### No database changes needed
### No edge function changes needed
### No new dependencies needed
