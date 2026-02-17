
# Optimize Abuse Detection: Remove Duplicates and Add Debounce

## Problem
The admin dashboard has **3 separate realtime channels** subscribing to the `profiles` table simultaneously:
1. `useAdminManage` -> `admin-manage-realtime` (profiles, debounced 1s)
2. `useAdminRealtime` -> `admin-realtime-dashboard` (profiles + reward_transactions + claim_requests, NO debounce)
3. `IPAbuseDetectionTab` -> `ip-abuse-realtime` (profiles + ip_tracking, debounced 1.5s)

When a single profile changes (e.g., ban), all 3 channels fire, triggering 3+ separate database queries -- two of them for profiles. The `useAdminRealtime` hook has no debounce at all, so rapid changes (bulk ban) hammer the DB.

## Changes

### 1. Add debounce to `useAdminRealtime.ts`
- Add a 1-second debounce to `fetchInitialStats` calls from realtime events
- This prevents hammering the DB when bulk operations trigger many profile/transaction changes
- Uses the same `useRef` + `useCallback` pattern as `useAdminManage`

### 2. Remove unused `onUnban` prop from `IPAbuseDetectionTab.tsx`
- The `onUnban` prop is passed in but never used anywhere in the component
- Only `onUnbanWithRestore` is used (it handles both restore and no-restore via the checkbox)
- Remove from the interface, component props, and the parent `WalletAbuseTab.tsx` call site

### 3. Remove `onUnban` from `WalletAbuseTab.tsx` prop forwarding
- Update the `IPAbuseDetectionTab` usage to no longer pass `onUnban`

## Technical Details

| File | Change | Resource Savings |
|------|--------|-----------------|
| `useAdminRealtime.ts` | Add 1s debounce to all realtime event handlers | Prevents unbatched DB queries during bulk operations |
| `IPAbuseDetectionTab.tsx` | Remove unused `onUnban` prop from interface and component | Cleaner code, smaller prop surface |
| `WalletAbuseTab.tsx` | Remove `onUnban` from IPAbuseDetectionTab usage | Matches interface cleanup |

## Why Not Merge the 3 Channels?
Each channel serves a different purpose with different data:
- `useAdminManage`: Full user directory (heavy RPC `get_users_directory_stats`)
- `useAdminRealtime`: Lightweight counts (pending, claims, active users)
- `IPAbuseDetectionTab`: IP cluster analysis (heavy RPC `get_ip_abuse_clusters`)

Merging them would mean the heavy RPCs fire even when only lightweight stats are needed. Keeping them separate with proper debounce is the most resource-efficient approach.
