

# Fix Remaining CAMLY Claim System Bugs

## Issues Found

### 1. Reward Over-Marking Bug (CRITICAL - Data Loss)
The previous fix in the edge function (lines 351-366) still has the over-marking problem. When claiming a partial amount, the last reward added can push the cumulative total far beyond the claim amount, permanently marking extra rewards as "claimed."

**Example:** User has rewards [2K, 5K, 20K, 70K, 500K] and claims 200K.
- Marks: 2K + 5K + 20K + 70K = 97K (all fit)
- Then 500K: cumulative (97K) < claimAmount (200K), so it adds 500K -> total marked = 597K
- User only receives 200K but 597K worth of rewards are marked as claimed
- When `sync_reward_totals()` runs, it recalculates `approved_reward` from unclaimed transactions, causing the profile balance to drop by 397K

**Fix:** Only mark rewards that fully fit within the claim amount. Stop adding once the next reward would exceed the claim amount. The profile balance (`approved_reward = totalAmount - claimAmount`) is already correct, so leaving extra rewards unmarked keeps the data consistent.

### 2. `.single()` Bug in ClaimRewardsModal (Line 302)
The daily claim limit pre-check in `ClaimRewardsModal.tsx` line 297-302 still uses `.single()` on `daily_claim_records`, which throws an error when no record exists (first claim of the day). This was fixed in the edge function but not in the modal.

### 3. Redundant Excessive Logging in Edge Function
The edge function has 40+ `console.log` statements that slow execution and clutter logs. Reducing to essential-only logging improves performance.

---

## Implementation Plan

### Step 1: Fix Reward Over-Marking (Edge Function)
Change the marking logic to only mark rewards that fully fit within the claim amount (strict `<=` without the overshoot `else if` branch). This means the sum of marked rewards may be less than `claimAmount`, but the profile balance is already correctly set via `approved_reward = totalAmount - claimAmount`.

### Step 2: Fix `.single()` in ClaimRewardsModal  
Change line 302 from `.single()` to `.maybeSingle()`.

### Step 3: Reduce Edge Function Logging
Remove verbose debug logs, keep only key milestones (start, claim amount, tx hash, errors).

---

## Technical Details

### Files to Modify
1. `supabase/functions/claim-camly/index.ts` - Fix reward marking logic, reduce logging
2. `src/components/Rewards/ClaimRewardsModal.tsx` - Fix `.single()` to `.maybeSingle()`

### No Database Changes Required

