
# Add Scheduled Cron Job for Escrow Reward Release

## What This Does
Set up a scheduled task that automatically runs `release_escrow_rewards()` every hour. This ensures that FIRST_UPLOAD rewards held in 48-hour escrow are released without requiring manual admin intervention.

## Test Results Summary
Before proceeding, here are the test results from the quality control system:
- Report Spam button: PASSED -- Successfully submitted a report, saved to database, video report_count incremented to 1
- Admin Spam Filter: PASSED -- Reported video appears in "Bi bao cao" tab with correct metadata
- Upload validation: Already verified working (duration >= 60s, description >= 50 chars, filename blocking)

## Implementation

### Step 1: Enable Required Database Extensions
Run SQL to enable `pg_cron` and `pg_net` extensions (if not already enabled):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
```

### Step 2: Create Cron Job
Schedule `release_escrow_rewards()` to run every hour via `pg_cron`. This calls the existing database function directly (no Edge Function needed since the logic is already in SQL):

```sql
SELECT cron.schedule(
  'release-escrow-rewards-hourly',
  '0 * * * *',
  $$SELECT * FROM public.release_escrow_rewards()$$
);
```

This runs at minute 0 of every hour. The function:
- Finds FIRST_UPLOAD reward transactions where `escrow_release_at <= now()`
- Verifies the associated video is NOT hidden
- Moves the reward from `pending_rewards` to `approved_reward`

### Why Direct SQL Instead of Edge Function
The `release_escrow_rewards()` function already exists as a database function with full logic. Calling it directly via `pg_cron` is simpler, faster, and avoids the overhead of an HTTP call to an Edge Function.

### No Code Changes Required
This only requires running two SQL statements via the database insert tool. No frontend or Edge Function changes needed.
