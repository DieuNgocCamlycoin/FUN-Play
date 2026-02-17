
# Fix Admin Dashboard: Exclude Banned Users from Statistics

## Problem
The `get_admin_dashboard_stats()` RPC function counts ALL users (692) including 359 banned accounts, and counts ALL comments (6,992) including 3,378 comments from banned users. The admin dashboard should only reflect active platform data.

## Changes

### 1. Database Migration: Update `get_admin_dashboard_stats()` RPC
Add banned user filters to two stats:

- `totalUsers`: Change `COUNT(*)` to `COUNT(*) ... WHERE COALESCE(banned,false)=false` (692 -> 333)
- `totalComments`: Filter to only count comments from active users (6,992 -> 3,614)
- Videos and views are already correct (banned users' videos were previously cleaned up)
- Top Earners and Top Creators already have the banned filter

### 2. No code changes needed
The `useAdminStatistics.tsx` hook is already clean (single RPC call, ~40 lines). No frontend changes required -- the corrected data will flow through automatically.

## Technical Details

Updated SQL for the two affected lines in the RPC:

```text
'totalUsers' -> COUNT(*) FROM profiles WHERE COALESCE(banned,false)=false
'totalComments' -> COUNT(*) FROM comments WHERE user_id IN (SELECT id FROM profiles WHERE COALESCE(banned,false)=false)
```

## Expected Result
- "Total Users" card: 333 (active only)
- "Total Comments" card: 3,614 (from active users only)  
- All other stats remain unchanged (already correct)
- No additional code, no extra network requests
