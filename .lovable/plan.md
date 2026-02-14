

# Fix: "Chờ duyệt" Always Shows 0 -- Trust Score & Notification Issues

## Root Cause Analysis

The "Cho duyet" (Pending Approval) section correctly shows **0 CAMLY** because **all rewards are being auto-approved**. Here's why:

- Every user currently has `suspicious_score = 0`
- The auto-approve threshold is set to `3`
- Since `0 < 3`, ALL rewards skip admin approval and go directly to "Co the Claim"
- The admin "Duyet Tat Ca" button also shows "Khong co pending" because there is nothing to approve

This means the admin approval step is effectively bypassed for all users.

## What Needs to Change

### 1. Make Auto-Approve Configurable (Default OFF)
Currently the system auto-approves when `suspicious_score < 3`, but since no user has a score above 0, everything is auto-approved. 

**Fix**: Add a master toggle `AUTO_APPROVE_ENABLED` in `reward_config`. When set to `false` (default), ALL rewards require admin approval regardless of trust score. Admin can enable auto-approve later when the trust score system has enough data.

**File**: `supabase/functions/award-camly/index.ts` (lines 481-502)

### 2. Add Real-Time Notification When Admin Approves
The wallet page already has a realtime listener on `profiles`, but it uses `stats.approvedRewards` as the initial `prevApproved` value inside the effect. Since the effect re-runs when `debouncedFetch` changes, `prevApproved` can reset, causing missed notifications.

**Fix**: Use a `useRef` to track the previous approved value persistently across renders instead of a local `let` variable inside the effect.

**File**: `src/components/Wallet/ClaimRewardsSection.tsx` (lines 94-128)

### 3. Database Config Insert
Add `AUTO_APPROVE_ENABLED = false` to `reward_config` table so all future rewards require admin approval.

---

## User and Admin Workflow After Fix

### User Flow:
1. Earn CAMLY through watching, liking, commenting, uploading
2. Rewards appear in **"Cho duyet"** (Pending Approval) -- waiting for admin
3. Admin approves rewards -- user gets a toast notification instantly
4. Approved rewards move to **"Co the Claim"**
5. When balance reaches 200,000 CAMLY, the **CLAIM** button activates
6. Connect wallet and click CLAIM to receive tokens on BSC

### Admin Flow:
1. Open `/wallet` -- see green **Admin Quick Actions** card
2. Card shows count of users waiting and total CAMLY pending
3. Click **"Duyet Tat Ca"** to approve all at once
4. Or go to `/admin?section=rewards` for individual user management

---

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/award-camly/index.ts` | Check `AUTO_APPROVE_ENABLED` config before auto-approving |
| `src/components/Wallet/ClaimRewardsSection.tsx` | Fix notification ref to persist across renders |
| Database migration | Insert `AUTO_APPROVE_ENABLED = false` into `reward_config` |

### award-camly change (lines 481-502):
- Before the suspicious_score check, fetch `AUTO_APPROVE_ENABLED` from `reward_config`
- If `false`, set `canAutoApprove = false` immediately (skip trust score check)
- If `true`, proceed with the existing suspicious_score logic

### ClaimRewardsSection notification fix:
- Replace `let prevApproved = stats.approvedRewards` with a `useRef` that updates when stats change
- This ensures the toast fires correctly even after re-renders

