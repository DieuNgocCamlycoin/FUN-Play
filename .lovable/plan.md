
# Fix: Claim Function Marks Too Many Rewards as Claimed (Critical Data Loss Bug)

## Problem

When a user has more approved rewards than the daily/lifetime cap allows (500,000 CAMLY), the `claim-camly` edge function:

1. Correctly caps the claim amount to 500,000
2. Correctly sends 500,000 CAMLY on-chain
3. **BUG**: Marks ALL unclaimed rewards as claimed (not just 500,000 worth)
4. **BUG**: Resets `approved_reward` to 0 (should be `totalAmount - claimAmount`)

This caused 6 users to lose a combined ~3,039,000 CAMLY in rewards that were incorrectly marked as claimed.

## Root Cause

Lines 326-348 in `supabase/functions/claim-camly/index.ts` mark ALL reward IDs from `unclaimedRewards` as claimed, regardless of whether the actual claim amount was capped. The previous fix changed from partial marking to full marking, which introduced this regression.

## Fixes

### 1. Fix `claim-camly` Edge Function (Partial Marking)

**File**: `supabase/functions/claim-camly/index.ts`

Replace lines 326-348 with logic that only marks rewards up to `claimAmount`:

- Sort rewards by amount (smallest first) to mark as many individual transactions as possible
- Accumulate reward IDs until reaching the `claimAmount` cap
- Only mark those specific IDs as `claimed`
- Set `approved_reward = totalAmount - claimAmount` (not 0)

### 2. Restore Lost Rewards (Database Fix)

Run a data repair migration to unmark the excess rewards for the 6 affected users:

For each affected user, calculate `excess = marked_amount - claimed_amount`, then unmark that many reward_transactions (set `claimed = false, claimed_at = NULL, claim_tx_hash = NULL`) and restore `approved_reward` in their profile.

The repair will use `sync_reward_totals()` RPC after unmarking to ensure profile balances are perfectly reconciled.

### 3. Profile Balance Sync

After restoring lost rewards, call `sync_reward_totals()` to reconcile all profile balances with the actual reward_transactions data.

---

## Technical Details

### Edge Function Changes (`claim-camly/index.ts`)

Replace lines 326-348:

```text
// OLD (buggy): marks ALL rewards, resets to 0
const allRewardIds = unclaimedRewards.map(r => r.id);
// ... marks all, sets approved_reward = 0

// NEW (fixed): only mark rewards up to claimAmount
const sorted = [...unclaimedRewards].sort((a, b) => Number(a.amount) - Number(b.amount));
let remaining = claimAmount;
const idsToMark = [];
for (const r of sorted) {
  if (remaining <= 0) break;
  idsToMark.push(r.id);
  remaining -= Number(r.amount);
}
// Mark only selected IDs as claimed
// Set approved_reward = totalAmount - claimAmount
```

### Data Repair (SQL Migration)

For each of the 6 affected users, identify excess claimed rewards and unmark them. Then run `sync_reward_totals()` to reconcile.

---

## Summary of Changes

| File/Action | Change |
|-------------|--------|
| `supabase/functions/claim-camly/index.ts` | Only mark rewards up to claimAmount as claimed; set approved_reward to remainder |
| Database migration | Restore incorrectly claimed rewards for 6 affected users |
| Run `sync_reward_totals()` | Reconcile all profile balances |
