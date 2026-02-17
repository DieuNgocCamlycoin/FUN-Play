

# Backfill Suspicious Scores for Existing Users

## Current Status (All Clean)

Previous cleanups are fully complete:
- `src/lib/enhancedRewards.ts` -- deleted, zero references remain
- `detect-abuse` edge function -- deleted, zero references remain
- `award-camly` -- inline abuse scoring active for new rewards
- `track-ip` -- signup rate limiting active for new signups
- `useAdminManage.ts` -- optimized with single RPC call
- No unused imports, no dead code found anywhere

## Remaining Gap

All 684 users have `suspicious_score = 0` because the new inline detection only runs on **future** reward grants. The 681 farming accounts (116 from one IP alone, holding 187.5M pending CAMLY) were created before the fix and have never been scored.

Only 440 out of 684 users have a `signup_ip_hash` recorded (the rest signed up before IP tracking was added).

## Plan

### 1. Create a one-time backfill edge function

Create `supabase/functions/backfill-suspicious-scores/index.ts` that:
- Fetches all profiles with `suspicious_score = 0`
- For each user with a `signup_ip_hash`, counts how many signups share that IP
- Checks avatar, avatar_verified, and display_name
- Computes and updates the `suspicious_score` using the same logic as `award-camly`
- Returns a summary of how many users were updated and their score distribution

This is admin-only (requires admin auth token) and meant to be called once.

### 2. Add a "Recalculate Scores" button in the Admin Abuse Detection tab

Add a button in `WalletAbuseTab` (or the IP Abuse Detection section) that calls the backfill function. This gives the admin a one-click way to refresh all suspicious scores without developer intervention.

### 3. No other changes needed

- No database schema changes
- No changes to existing edge functions
- No frontend dead code to clean

## Technical Details

### New File: `supabase/functions/backfill-suspicious-scores/index.ts`

```text
Purpose: One-time (or on-demand) recalculation of suspicious_score for all users
Auth: Admin-only (verified via has_role RPC)
Logic:
  1. Fetch all profiles (id, signup_ip_hash, avatar_url, avatar_verified, display_name)
  2. For users with signup_ip_hash, batch-count signups per IP from ip_tracking
  3. Compute score: IP farming (>5 accounts = +3, >2 = +1), no avatar (+1), 
     not verified (+1), short/missing display_name (+1)
  4. Batch update profiles with new suspicious_score
  5. Return summary: { updated: number, distribution: { score: count } }
```

### Config: `supabase/config.toml`

Add entry:
```toml
[functions.backfill-suspicious-scores]
verify_jwt = false
```

### Modified File: `src/components/Admin/tabs/WalletAbuseTab.tsx`

Add a "Recalculate Suspicious Scores" button that calls the edge function and shows the result summary (number of users updated, score distribution). This button will be placed in the header area of the tab alongside existing controls.

