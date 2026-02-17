

# Real-time Abuse Detection System

## Overview
Currently, the abuse detection system only loads data once on mount and requires manual refresh. This plan adds Supabase realtime subscriptions so the admin panel updates automatically when profiles change (new signups, bans, reward changes, wallet connections).

## Changes

### 1. `src/hooks/useAdminManage.ts` - Add realtime subscription
- Subscribe to `postgres_changes` on the `profiles` table for INSERT/UPDATE/DELETE events
- Use debounced refetch (1 second) to avoid excessive queries when bulk actions trigger multiple profile updates
- Auto-refresh `users` list when any profile changes (ban, unban, rewards, new signup)
- Clean up subscription on unmount

### 2. `src/components/Admin/tabs/IPAbuseDetectionTab.tsx` - Add realtime subscription
- Subscribe to `postgres_changes` on both `profiles` and `ip_tracking` tables
- When a new signup is tracked or a user is banned/unbanned, the IP clusters automatically refresh
- Use debounced refetch (1.5 seconds) to batch rapid changes
- Add a visual "Live" indicator badge to show the realtime connection status
- Clean up subscription on unmount

### 3. `src/hooks/useAdminRealtime.ts` - Already has realtime
- No changes needed -- this hook already subscribes to `profiles`, `reward_transactions`, and `claim_requests`

## Technical Details

### Debounce Strategy
- `useAdminManage`: 1s debounce on profile changes (this query is heavy -- `get_users_directory_stats` joins many tables)
- `IPAbuseDetectionTab`: 1.5s debounce on profile/ip_tracking changes (the `get_ip_abuse_clusters` RPC is also heavy)
- This prevents hammering the database during bulk ban operations (e.g., "Ban all 10 users in IP group")

### Realtime Channel Configuration
- `useAdminManage`: channel `admin-manage-realtime` listening to `profiles` table (all events)
- `IPAbuseDetectionTab`: channel `ip-abuse-realtime` listening to `profiles` + `ip_tracking` tables

### What Triggers Auto-Refresh
| Event | useAdminManage | IPAbuseDetectionTab |
|-------|---------------|---------------------|
| New user signup | Yes | Yes |
| User banned/unbanned | Yes | Yes |
| Rewards updated | Yes | No |
| New IP tracking entry | No | Yes |
| Wallet connected | Yes | Yes |

