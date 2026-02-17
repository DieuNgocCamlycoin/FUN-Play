
# Fix: IP Abuse Detection Missing 116-Account Cluster

## Root Cause

The IP Tracking tab in Admin Dashboard fetches `ip_tracking` records client-side, but the table has **19,402 rows**. The database automatically caps query results at **1,000 rows** without warning. This means only ~5% of IP data is analyzed, completely missing the largest farming clusters (116 accounts from one IP, 50 from another, etc.).

## Solution: Move IP Grouping to Server-Side

Replace the broken client-side approach with a database RPC function that aggregates IP clusters directly in the database -- no row limit issues, much faster, and uses far less bandwidth.

## Changes

### 1. New Database RPC Function: `get_ip_abuse_clusters`

Aggregates IP abuse data entirely server-side by combining both `ip_tracking` and `profiles.signup_ip_hash` sources:

- Groups accounts by IP hash
- Counts distinct users, wallets, and action types per IP
- Filters to only show IPs with 2+ accounts
- Returns pre-computed summaries (no client-side grouping needed)
- Joins profile data (username, display_name, avatar, wallet, pending_rewards, banned status) directly

This replaces ~80 lines of client-side JavaScript grouping logic with a single efficient SQL query.

### 2. Rewrite `IPAbuseDetectionTab.tsx`

Replace the entire `fetchIPGroups` function (which fetches all 19,402 rows) with a single RPC call to `get_ip_abuse_clusters`. The component will:

- Call the RPC function instead of fetching raw `ip_tracking` rows
- Receive pre-grouped data with user details already joined
- Remove all client-side grouping/filtering logic
- Keep the existing UI (stats cards, IP group cards, ban buttons) unchanged

### 3. Delete Dead Code

The entire client-side grouping logic (lines 49-136 of `IPAbuseDetectionTab.tsx`) including the `Set`-based grouping, the separate profiles fetch, and the `profileMap` construction will be removed and replaced with the single RPC call.

## Technical Details

### RPC Function SQL

```text
get_ip_abuse_clusters(min_accounts INTEGER DEFAULT 2)
RETURNS TABLE(ip_hash TEXT, account_count BIGINT, total_pending NUMERIC, 
              distinct_wallets BIGINT, users JSONB)

Logic:
1. UNION ip_tracking.ip_hash with profiles.signup_ip_hash to get all IP-user pairs
2. GROUP BY ip_hash, count distinct users
3. HAVING count >= min_accounts  
4. For each group, build a JSONB array of user profiles with:
   id, username, display_name, avatar_url, wallet_address, pending_rewards, banned
5. ORDER BY account_count DESC
```

### Component Changes

```text
IPAbuseDetectionTab.tsx:
- Remove: IPUser interface (unused after RPC returns JSONB)  
- Remove: IPGroup interface (replaced by RPC return type)
- Remove: fetchIPGroups with client-side grouping (~90 lines)
- Add: Simple RPC call to get_ip_abuse_clusters
- Keep: All UI rendering, ban buttons, stats cards
```

### Performance Impact

- Before: Fetches 1,000/19,402 rows + separate profiles query = incomplete data + 2 round trips
- After: Single RPC call returning ~20 pre-aggregated rows = complete data + 1 round trip

### No other files change

- `WalletAbuseTab.tsx` -- no changes needed, it just renders `IPAbuseDetectionTab`
- `useAdminManage.ts` -- no changes needed
- No new dependencies
