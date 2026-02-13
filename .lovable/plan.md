

# Claim System Analysis and Bug Fixes

## How the Claim System Works (Step-by-Step)

### What the USER does:
1. Earn CAMLY rewards by watching videos, liking, commenting, sharing, uploading
2. Go to `/wallet` page and see the "Claim Rewards" section
3. Rewards start as "Cho duyet" (Pending Approval) -- waiting for admin
4. Once admin approves, rewards move to "Co the Claim" (Claimable)
5. When claimable amount reaches 200,000 CAMLY, the "CLAIM CAMLY" button activates
6. User connects their wallet (MetaMask/Bitget/Trust), clicks CLAIM
7. The system sends real CAMLY tokens on BSC blockchain to user's wallet

### What the ADMIN does:
1. Go to `/wallet` page (if admin, a green "Admin Quick Actions" card appears)
2. Click "Duyet Tat Ca" to bulk-approve all pending rewards for all users
3. Or go to `/admin?section=rewards` for individual user approval
4. After approval, users get a real-time toast notification and can claim

---

## Bugs Found (3 Critical Issues)

### Bug 1: Partial claim marks ALL rewards as claimed
**File**: `supabase/functions/claim-camly/index.ts` (lines 326-336)

When daily limit or lifetime cap reduces `claimAmount` below `totalAmount`, the code still marks ALL `unclaimedRewards` as claimed. This means users lose rewards they never actually received.

Example: User has 400,000 CAMLY approved but daily limit only allows 300,000. The system sends 300,000 but marks all 400,000 as claimed -- losing 100,000.

**Fix**: Only mark rewards as claimed up to the actual `claimAmount`. Sort rewards and pick IDs until sum reaches `claimAmount`.

### Bug 2: Blockchain error leaves claim_request stuck as "pending"
**File**: `supabase/functions/claim-camly/index.ts` (lines 372-378)

When the blockchain transaction fails (e.g., insufficient BNB gas), the catch block returns an error but never updates the `claim_request` record to `status: 'failed'`. Although the 5-minute auto-cleanup helps, users are blocked from retrying for 5 minutes unnecessarily.

**Fix**: In the catch block, update the claim_request to `failed` with the error message before returning.

### Bug 3: approved_reward reset to 0 even on partial claim
**File**: `supabase/functions/claim-camly/index.ts` (line 354)

After a successful claim, `approved_reward` is always reset to 0, even when only a portion was claimed (due to daily/lifetime limits). The remaining approved amount disappears from the UI.

**Fix**: Subtract `claimAmount` instead of resetting to 0:
```
approved_reward = GREATEST(approved_reward - claimAmount, 0)
```

---

## Implementation Plan

### 1. Fix claim-camly edge function (all 3 bugs)

**Partial claim fix** (lines 326-336):
- Sort `unclaimedRewards` and accumulate IDs until sum reaches `claimAmount`
- Only mark those specific reward IDs as claimed

**Catch block fix** (lines 372-378):
- Add `claimRequest?.id` tracking and update status to `failed` in the catch block

**Approved reward fix** (line 354):
- Change from `update({ approved_reward: 0 })` to a decrement: subtract `claimAmount` from current `approved_reward` using raw SQL or careful logic

### 2. Mobile optimization check
- The existing `ClaimRewardsSection` and `ClaimRewardsModal` already use `useIsMobile()` and responsive grids
- No additional mobile changes needed -- the bug fixes are all backend

---

## Files to Change

| File | Change | Type |
|------|--------|------|
| `supabase/functions/claim-camly/index.ts` | Fix partial claim, catch block, approved_reward reset | Bug fix |

All 3 fixes are in the same file. No frontend changes needed -- the UI is correct, only the backend logic has bugs.
