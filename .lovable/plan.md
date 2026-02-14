

# Fix: Incorrect Claim Rewards Balances (Unmarked Claimed Rewards)

## Problem

18 users show inflated "Co the Claim" (approved_reward) balances because their reward_transactions were not fully marked as `claimed` when on-chain claims succeeded. 

**Example (Angel Thu Ha):**
- Total earned: 781,000 CAMLY
- Successfully claimed on-chain: 500,000 CAMLY
- But only 70,000 worth of reward_transactions marked as `claimed = true`
- So `approved_reward` shows 711,000 instead of the correct 281,000

This is a data inconsistency from the same partial-marking bug we fixed in the edge function. The code fix is already deployed, but the historical data was never fully repaired.

## Root Cause

Previous claim operations only marked a subset of reward_transactions as claimed. The gap between `total_claimed` (from claim_requests) and `total_marked` (from reward_transactions where claimed=true) ranges from 3,000 to 475,000 CAMLY across 18 users.

## Fix (Data Repair Only - No Code Changes Needed)

### Step 1: Mark missing claimed rewards

Run a SQL migration that for each affected user:
1. Calculates the `unmarked_gap` (claimed on-chain minus marked in transactions)
2. Marks additional reward_transactions as `claimed = true` (oldest first) until the gap is filled

### Step 2: Re-sync profile balances

Run `sync_reward_totals()` to recalculate `approved_reward` and `pending_rewards` from the corrected transaction data.

### Affected Users (18 total)

| User | Claimed On-Chain | Marked as Claimed | Gap | Current approved_reward |
|------|-----------------|-------------------|-----|------------------------|
| Angel Vinh Nguyen | 1,310,000 | 835,000 | 475,000 | 3,780,000 |
| THANH TIEN | 500,000 | 64,000 | 436,000 | 680,000 |
| Angel Thu Ha | 500,000 | 70,000 | 430,000 | 711,000 |
| Nguyen Hoa_Richer | 500,000 | 152,000 | 348,000 | 1,054,000 |
| + 14 more users with smaller gaps | | | | |

After the fix, `approved_reward` will correctly reflect only the unclaimed portion of each user's rewards.

