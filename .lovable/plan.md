

# Fix CAMLY Claim System - Wrong Token Decimals

## Root Cause

The CAMLY token contract uses **3 decimals** (confirmed by on-chain `decimals()` call), but the `claim-camly` edge function hardcodes **18 decimals** on line 176:

```
ethers.parseUnits(claimAmount.toString(), 18)  // WRONG
```

When a user claims 500,000 CAMLY:
- With 18 decimals: 500,000 x 10^18 = 5 x 10^23 (astronomically large)
- With 3 decimals: 500,000 x 10^3 = 500,000,000 (correct)

The wallet has 79,367,000 CAMLY (raw: ~79,367,000,000). The balance check always fails because 5 x 10^23 > 79,367,000,000.

This explains why EVERY claim request in the database has `error_message: "Insufficient CAMLY balance in reward pool"` despite the wallet having 79M+ CAMLY.

## Fix

### File: `supabase/functions/claim-camly/index.ts`

**Line 176**: Change decimals from 18 to 3:

```typescript
// Before (WRONG):
const amountInWei = ethers.parseUnits(claimAmount.toString(), 18);

// After (CORRECT):
const amountInWei = ethers.parseUnits(claimAmount.toString(), 3);
```

That is the only code change needed. The edge function error handling (returning 200 with friendly messages) is already correctly deployed from the previous fix.

## No other changes needed

- The frontend `ClaimRewardsModal.tsx` already handles `success: false` responses correctly
- The edge function already returns 200 for all user-facing errors
- No database changes required
- Both web and mobile use the same edge function, so both are fixed

## Verification

After deploying, claims should succeed because:
- 500,000 CAMLY with 3 decimals = 500,000,000 raw units
- Wallet balance = 79,367,000,000 raw units
- 79,367,000,000 > 500,000,000 (balance check passes)
