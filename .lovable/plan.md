

# Fix Escrow Reward Release System

## Problem Found
The hourly cron job `release-escrow-rewards-hourly` is correctly scheduled and active, but it will **never release any rewards** because all 122 existing FIRST_UPLOAD records have `escrow_release_at = NULL`. The cron job's SQL filters on `escrow_release_at IS NOT NULL AND escrow_release_at <= now()`, so it skips every record.

The edge function code (line 679) correctly generates `escrow_release_at`, but these records were created before the escrow feature was deployed, so they were never populated.

## What Works
- Cron job is active and scheduled correctly (every hour at minute 0)
- `release_escrow_rewards()` function logic is correct
- `revoke_escrow_reward()` function is correct
- Edge function `award-camly` has correct escrow logic for future FIRST_UPLOAD rewards
- No dead/unused code found

## Fix Plan

### Step 1: Backfill existing FIRST_UPLOAD records
Run a SQL update to set `escrow_release_at = created_at + 48 hours` for all existing FIRST_UPLOAD transactions that have NULL `escrow_release_at`:

```sql
UPDATE reward_transactions
SET escrow_release_at = created_at + INTERVAL '48 hours'
WHERE reward_type = 'FIRST_UPLOAD'
  AND escrow_release_at IS NULL
  AND status = 'success';
```

This will allow the cron job to process the 122 existing records. Most of them are older than 48 hours, so they will be released on the next cron run.

### Step 2: Redeploy the award-camly Edge Function
Redeploy the edge function to ensure the currently running version includes the `escrow_release_at` logic (line 679). No code changes needed -- just a redeployment.

### No Code Changes Required
- No frontend changes
- No edge function code changes
- No dead code to remove
- Only a data backfill (Step 1) and edge function redeployment (Step 2)

### Technical Details
- The `release_escrow_rewards()` function will process backfilled records where `escrow_release_at <= now()` and the video is not hidden
- Records with hidden videos will remain in escrow (correct behavior)
- The atomic profile update moves rewards from `pending_rewards` to `approved_reward`
