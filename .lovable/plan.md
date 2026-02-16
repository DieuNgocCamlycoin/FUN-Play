

# Fix Critical CAMLY Claim System Crashes

## Root Cause Found

The `claim-camly` edge function has **two undefined variables** that crash the function every time it's called. This is why users click "Claim" but nothing happens -- the function throws a runtime error before reaching the blockchain transaction.

### Bug 1: `totalAmount` is never defined (Line 101)
The code references `totalAmount` but never calculates it from `unclaimedRewards`. This causes an immediate `ReferenceError` crash.

**Fix:** Add `const totalAmount = unclaimedRewards.reduce((sum, r) => sum + Number(r.amount), 0);` before line 101.

### Bug 2: `lifetimeRemaining` is never defined (Line 170)
The code calculates `lifetimeClaimed` but then references `lifetimeRemaining` which doesn't exist.

**Fix:** Add `const lifetimeRemaining = config.MAX_CLAIM_PER_USER - lifetimeClaimed;` after line 167.

---

## Implementation Plan

### Step 1: Fix `claim-camly` Edge Function
Add the two missing variable declarations:
- `totalAmount` = sum of all unclaimed reward amounts (before line 101)
- `lifetimeRemaining` = MAX_CLAIM_PER_USER minus lifetimeClaimed (after line 167)

### Step 2: Deploy and verify
Deploy the fixed edge function and confirm it no longer crashes.

---

## Technical Details

### Files to Modify
1. `supabase/functions/claim-camly/index.ts` -- Add 2 missing variable declarations

### No Database Changes Required

### Why This Was Missed Before
Previous fixes focused on the reward-marking logic and `.single()` bug but didn't catch that the variable declarations for `totalAmount` and `lifetimeRemaining` were missing from the code. Without these, the function crashes on every invocation at line 101 before any business logic runs.

