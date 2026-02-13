
# Comprehensive Wallet Page and Reward System Improvements

## Issues Identified

1. **No real-time notification on wallet page after admin approval** -- The wallet page listens on `profiles` table updates but the `ClaimRewardsModal` only refreshes when opened. There is no toast/notification when admin approves rewards.

2. **All rewards are auto-approved (line 482 of award-camly)** -- `canAutoApprove = true` is hardcoded, bypassing the `suspicious_score` check entirely. Admin approval flow exists but is never triggered.

3. **No maximum withdrawal cap tied to reward pool balance** -- Users can claim up to 500,000 CAMLY/day but there is no check against the total remaining reward pool.

4. **No trust score integration in the claim flow** -- The `detect-abuse` function calculates `suspicious_score` but it is never called during the claim or reward process.

5. **Stuck pending claims block users permanently** -- No auto-cleanup of old pending claims.

---

## Plan

### 1. Real-Time Approval Notification on Wallet Page
**Files**: `src/components/Wallet/ClaimRewardsSection.tsx`

- Add a listener on the `reward_transactions` table for changes where `approved` changes from `false` to `true`
- When detected, show a toast notification: "Phan thuong cua ban da duoc duyet! Ban co the claim ngay."
- Also listen for `profiles` updates specifically to detect `approved_reward` increases and show a celebratory toast with the new approved amount

### 2. Re-Enable Trust Score Gating in award-camly
**File**: `supabase/functions/award-camly/index.ts`

- Replace line 482 (`const canAutoApprove = true;`) with actual `suspicious_score` check:
  - Fetch `suspicious_score` from `profiles` for the user
  - If `suspicious_score < AUTO_APPROVE_THRESHOLD` (default 3), auto-approve
  - Otherwise, set `approved = false` (pending admin review)
- Call `detect-abuse` periodically or at claim time to refresh the score

### 3. Maximum Withdrawal Cap Based on Reward Pool Balance
**File**: `supabase/functions/claim-camly/index.ts`

- Add a new config key `MAX_CLAIM_PER_USER` in `reward_config` table (e.g., 500,000 CAMLY)
- Before processing a claim, check the admin wallet's on-chain CAMLY balance
- If user's claim amount would exceed `MAX_CLAIM_PER_USER` or the pool is low, block the claim with a clear message
- Add a check: total lifetime claimed by user vs a configurable max lifetime cap
- When user reaches the cap, require admin approval for further claims

### 4. Auto-Cleanup Stuck Pending Claims
**File**: `supabase/functions/claim-camly/index.ts`

- Before the pending claim check (line 178), add an auto-fail query:
  ```sql
  UPDATE claim_requests 
  SET status = 'failed', error_message = 'Auto-timeout after 5 minutes'
  WHERE user_id = [userId] AND status = 'pending' 
  AND created_at < now() - interval '5 minutes'
  ```

### 5. Better Error Handling for Gas/Pool Errors
**File**: `src/components/Rewards/ClaimRewardsModal.tsx`

- In the catch block (line 250-258), detect specific error patterns:
  - `INSUFFICIENT_FUNDS` or `insufficient funds` -> Show "He thong dang bao tri vi thuong. Vui long thu lai sau."
  - `Reward pool temporarily unavailable` -> Show "Be thuong tam thoi het. Vui long cho admin nap them."
- Replace raw blockchain error with user-friendly Vietnamese messages

### 6. Admin Quick Approve on Wallet Page (for Admin Users)
**Files**: New `src/components/Wallet/AdminQuickApprove.tsx`, update `src/components/Wallet/ClaimRewardsSection.tsx`

- Check if current user has admin role using `supabase.rpc("has_role")`
- If admin, show a small card with:
  - Count of users with pending rewards
  - "Duyet Tat Ca" button calling `bulk_approve_all_rewards` RPC
  - Confirmation dialog before execution
- Render below the ClaimRewardsSection

### 7. Add MAX_CLAIM_PER_USER Config
**Database migration**:
- Insert new config: `INSERT INTO reward_config (config_key, config_value) VALUES ('MAX_CLAIM_PER_USER', '500000')`

### 8. Mobile Optimization
All new components will use existing responsive patterns:
- `useIsMobile()` hook for layout adjustments
- Touch-friendly buttons (min 48px)
- Toast notifications work on both desktop and mobile
- AdminQuickApprove card uses full-width on mobile

---

## Technical Summary

| File | Change | Priority |
|------|--------|----------|
| `src/components/Wallet/ClaimRewardsSection.tsx` | Add approval notification toast + import AdminQuickApprove | High |
| `src/components/Wallet/AdminQuickApprove.tsx` | New: admin quick approve component | High |
| `supabase/functions/award-camly/index.ts` | Re-enable trust score gating (line 482) | High |
| `supabase/functions/claim-camly/index.ts` | Auto-cleanup stuck claims + pool balance cap + better errors | High |
| `src/components/Rewards/ClaimRewardsModal.tsx` | User-friendly error messages for gas/pool errors | Medium |
| Database migration | Add `MAX_CLAIM_PER_USER` config row | Medium |
