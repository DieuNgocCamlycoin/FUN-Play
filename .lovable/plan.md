

# Fix Incorrect Reward Amounts for LIKE, VIEW, and SHARE Transactions

## Root Cause

The reward amounts in the database have inconsistencies from before the reward configuration was standardized. The **current correct amounts** (from `reward_config`) are:
- VIEW: 5,000 CAMLY (max 10/day)
- LIKE: 2,000 CAMLY (max 20/day)
- COMMENT: 5,000 CAMLY (max 10/day)
- SHARE: 5,000 CAMLY (max 10/day)

However, historical records contain incorrect amounts:

| Type | Wrong Amount | Correct Amount | Records | Total Difference |
|------|-------------|---------------|---------|-----------------|
| LIKE | 5,000 | 2,000 | 496 | -1,488,000 (overpaid) |
| LIKE | 500 | 2,000 | 6 | +9,000 (underpaid) |
| VIEW | 10,000 | 5,000 | 102 | -510,000 (overpaid) |
| VIEW | 500 | 5,000 | 19 | +85,500 (underpaid) |
| SHARE | 2,000 | 5,000 | 1 | +3,000 (underpaid) |
| COMMENT | 5,000 | 5,000 | 3,198 | 0 (all correct) |

## Solution (3 Steps)

### Step 1: Create a Snapshot Backup
Before making changes, back up the current state of affected reward_transactions for audit trail.

### Step 2: Update Incorrect Amounts in `reward_transactions`
Run SQL updates to correct amounts:
- LIKE records at 5,000 or 500 to 2,000
- VIEW records at 10,000 or 500 to 5,000
- SHARE records at 2,000 to 5,000

### Step 3: Run `sync_reward_totals()` to Reconcile Balances
After fixing the transaction amounts, call the existing `sync_reward_totals()` function to recalculate `total_camly_rewards`, `pending_rewards`, and `approved_reward` in `profiles` for all affected users. This ensures the profile balances match the corrected transaction history.

### No Frontend Changes Needed
- The Reward History page (`/reward-history`) already has Realtime subscriptions on `reward_transactions` with a 500ms debounce
- It already listens for `camly-reward` window events for instant feedback
- The `REWARD_TYPE_MAP` already maps all types (VIEW, LIKE, COMMENT, SHARE) with correct labels
- Once the database records are corrected, the page will display the correct amounts immediately

## Files Changed

| File | Change |
|------|--------|
| Database (SQL migration) | Fix incorrect amounts in reward_transactions |
| Database (SQL) | Run sync_reward_totals() to reconcile profiles |

No code files need modification -- this is purely a data correction task.

## Execution Order
1. Create snapshot backup of affected records
2. Update LIKE amounts (5,000 and 500 to 2,000)
3. Update VIEW amounts (10,000 and 500 to 5,000)
4. Update SHARE amounts (2,000 to 5,000)
5. Run `sync_reward_totals()` to recalculate all user balances
6. Verify corrections with summary query

