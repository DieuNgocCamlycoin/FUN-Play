

# Claim System - Final Optimizations

## Current Status
The critical bugs from previous rounds are all fixed:
- `totalAmount` and `lifetimeRemaining` variables are defined
- `.maybeSingle()` is used correctly everywhere
- Reward over-marking logic is correct (strict `<=` check)
- Post-transaction steps are fire-and-forget

## Remaining Issues Found

### 1. Edge Function: Redundant Supabase Client Recreation in Catch Block (Lines 493-520)
When the edge function hits an error, the catch block creates entirely new Supabase clients and re-authenticates the user just to mark the pending claim as failed. This is wasteful and can itself fail silently. The `user` and `supabaseAdmin` variables from the try block are already in scope for the catch block in JavaScript/Deno -- we just need to check if they were defined before the error occurred.

**Fix:** Use the existing `supabaseAdmin` and `user` variables if available, falling back to recreation only if needed.

### 2. Edge Function: Empty Lines and Stale Comments (Lines 42-43, 52-53, 61-63, 127, 231)
Multiple blank lines and orphaned comments add noise. Cleaning these up makes the code easier to maintain.

### 3. ClaimRewardsModal: Claim Button Disabled Logic Too Complex (Line 715)
The disabled condition has 6 checks chained together. If `claimAmount` is 0 (initial state before data loads), the button is disabled even when it shouldn't be. The `claimAmount` is initialized to 0 and only set after `fetchUnclaimedRewards` completes, but the button check `claimAmount < MIN_CLAIM_THRESHOLD` fires immediately.

**Fix:** Allow claim when `claimAmount === 0` and `totalClaimable >= MIN_CLAIM_THRESHOLD` (meaning user hasn't customized the amount, so the full balance will be used).

### 4. Edge Function: `decimals()` Call Adds Latency (Lines 283-288)
The `camlyContract.decimals()` call adds an extra RPC call every time. CAMLY is always 18 decimals. Remove this unnecessary network call to save ~200ms.

---

## Implementation Plan

### Step 1: Optimize Edge Function Catch Block
Simplify the error handler to reuse existing `supabaseAdmin` and `user` variables instead of recreating clients.

### Step 2: Remove Unnecessary `decimals()` RPC Call
Hard-code decimals as 18 (CAMLY standard) instead of querying the contract each time.

### Step 3: Fix Claim Button Disabled Logic
Update the disabled check so `claimAmount === 0` (unset) doesn't block the button when `totalClaimable >= MIN_CLAIM_THRESHOLD`.

### Step 4: Clean Up Empty Lines
Remove stale blank lines and orphaned comments in the edge function.

---

## Technical Details

### Files to Modify
1. **`supabase/functions/claim-camly/index.ts`**
   - Remove `decimals()` call, hardcode 18
   - Simplify catch block to reuse existing variables
   - Clean up blank lines

2. **`src/components/Rewards/ClaimRewardsModal.tsx`**
   - Fix disabled logic on line 715 to handle `claimAmount === 0` case

### No Database Changes Required

### Performance Impact
- Removing `decimals()` saves ~200ms per claim (one fewer BSC RPC call)
- Simplified catch block reduces error recovery time
- Button fix prevents users from being stuck on disabled state

