

# Optimize CAMLY Claim System

## Status: System is Working

91 successful claims, 37.5M CAMLY distributed. The decimal fix is active. The issues below are optimizations and cleanup.

## Issues Found

### 1. Raw Error Messages Exposed to Users
The edge function catch block (line 295-317) passes raw ethers error strings like `"insufficient funds for intrinsic transaction cost (transaction=0xf8a9..."` directly to users. These should be converted to friendly Vietnamese messages.

### 2. Duplicate Error Handling in ClaimRewardsModal
Lines 359-361 throw an error for `!data?.success`, then lines 390-392 check the exact same condition again (unreachable code).

### 3. Unnecessary Blocking in checkPendingClaims  
The function has a 2-second `await setTimeout` that blocks the UI thread when checking for stuck pending claims. This should be removed -- the server-side auto-cleanup already handles stuck claims.

### 4. Race Condition in approved_reward Update
Line 230 sets `approved_reward = totalAmount - claimAmount` using a value fetched earlier. If rewards were added between fetch and update, they would be lost. Should use atomic decrement instead.

### 5. Old Failed Claims Cleanup
10+ failed claims from Feb 14 with raw "insufficient funds for gas" errors should be cleaned up like the decimal-mismatch records.

### 6. Profile last_claim_at Never Updated
The `last_claim_at` field on profiles is never set after a successful claim.

## Changes

### File: `supabase/functions/claim-camly/index.ts`
- Replace the catch block's raw error forwarding with friendly message mapping (gas errors, network errors, timeout errors)
- Fix `approved_reward` update to use atomic decrement: `approved_reward = GREATEST(0, approved_reward - claimAmount)` via RPC or raw update
- Update `last_claim_at` on successful claim
- Move the low-balance alert and post-transaction tasks into a single fire-and-forget block

### File: `src/components/Rewards/ClaimRewardsModal.tsx`
- Remove duplicate `!data?.success` check (lines 390-392 are unreachable)
- Simplify `checkPendingClaims`: remove the 2-second sleep and unnecessary re-check logic
- Remove unused `claimTimeoutRef` and `claimTimerRef` cleanup duplication

### Database: Clean old gas-error failed claims
```sql
UPDATE claim_requests 
SET status = 'cleaned', error_message = 'Auto-cleaned: gas fee error (resolved)'
WHERE status = 'failed' 
  AND error_message LIKE '%insufficient funds for%';
```

## Technical Details

### Edge Function Error Mapping
```text
"insufficient funds" -> "He thong dang bao tri vi thuong. Vui long thu lai sau."
"nonce too low"      -> "Giao dich bi trung. Vui long thu lai."
"timeout"            -> "Mang blockchain cham. Vui long thu lai sau."
default              -> "Khong the claim. Vui long thu lai sau it phut."
```

### Atomic approved_reward Fix
Instead of:
```
UPDATE profiles SET approved_reward = totalAmount - claimAmount WHERE id = user.id
```
Use:
```
UPDATE profiles SET 
  approved_reward = GREATEST(0, COALESCE(approved_reward, 0) - claimAmount),
  last_claim_at = now()
WHERE id = user.id
```

### ClaimRewardsModal Simplification
Remove the redundant error check block and the blocking sleep in pending claim detection. The simplified `checkPendingClaims` will just query and set state without artificial delays.

