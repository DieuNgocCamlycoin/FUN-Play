

# Ban Enforcement System - Complete Fix

## Current Gaps Found

After auditing the entire ban system, here are the critical enforcement gaps:

### Gap 1: Banned users can still log in and browse freely
`useAuth.tsx` never checks the `banned` flag from `profiles`. A banned user can log in, watch videos, comment, and use the platform normally.

### Gap 2: Banned users can still earn CAMLY rewards
The `award-camly` edge function (647 lines) has zero checks for `banned` status. A banned user can continue accumulating rewards through views, likes, comments, shares, and uploads.

### Gap 3: No IP-level signup blocking
When an IP cluster is banned, users can immediately create new accounts from the same IP and start farming again.

### Gap 4: No feedback to banned users
Banned users see no message explaining why they lost access -- they just see a normal app with zeroed rewards.

---

## Proposed Changes

### 1. Add ban check to `useAuth.tsx`
After session is established, query `profiles.banned` for the logged-in user. Expose `isBanned` and `banReason` in the hook's return value. This is a lightweight single-row query that runs once on login.

### 2. Create `BannedScreen` component
A simple full-screen overlay shown when `isBanned === true`. Displays:
- "Account suspended" message
- The ban reason from `profiles.ban_reason`
- A "Log out" button
- No access to any other features

This replaces the entire app content for banned users -- no navigation, no video player, no reward buttons.

### 3. Add ban check to `award-camly` edge function
Add a single query at the top of the reward flow (after auth, before any reward logic):
```text
SELECT banned FROM profiles WHERE id = userId
IF banned = true -> return { success: false, reason: "Account suspended" }
```
This is 1 extra DB query but blocks all reward farming from banned accounts server-side. It runs before any of the expensive anti-fraud checks, daily limit queries, etc.

### 4. Add IP-based signup blocking to `track-ip` edge function
When `action_type = 'signup'`, check how many banned accounts share the same IP hash:
```text
Count profiles WHERE signup_ip_hash = current_hash AND banned = true
IF count >= 3 -> auto-ban the new account immediately
```
This prevents farming clusters from regenerating after being banned.

---

## Files to Change

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Add `isBanned`, `banReason` state; query `profiles` on session change |
| `src/components/BannedScreen.tsx` | New component - full-screen ban notification |
| `src/App.tsx` or root layout | Wrap app content with ban check using `useAuth().isBanned` |
| `supabase/functions/award-camly/index.ts` | Add banned check after auth (line ~204) |
| `supabase/functions/track-ip/index.ts` | Add auto-ban for signups from IPs with 3+ banned accounts |

## What does NOT change
- `ban_user_permanently` RPC -- already works correctly (zeroes rewards, blacklists wallet, creates reward_ban)
- `unban_user` RPC -- already works correctly
- `IPAbuseDetectionTab.tsx` -- already fixed with server-side RPC
- `BannedUsersTab.tsx` -- no changes needed
- `useAdminManage.ts` -- no changes needed

## Performance Impact
- `useAuth`: +1 lightweight query per session (cached, runs once)
- `award-camly`: +1 single-row query per reward attempt (early exit saves all subsequent queries for banned users)
- `track-ip`: +1 count query on signup only (not on login/wallet_connect)

## Summary
These 5 changes close all enforcement gaps: banned users see a suspension screen, cannot earn rewards, and cannot create new accounts from the same IP. The changes are minimal (no new tables, no new RPCs) and add negligible overhead to existing flows.

