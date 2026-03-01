

## Plan: Refresh Feature Data & Recalculate Light Scores for All Users on March 1st

### Problem
The `calculate_user_light_score` function has been fixed to use `GREATEST(features, raw)`, but `features_user_day` for 2026-03-01 may still contain stale data from the 02:00 AM cron run. All users' Light Scores need recalculation with fresh data.

### Steps

**1. Re-aggregate features for March 1st**
- Run `SELECT aggregate_features_user_day('2026-03-01'::date)` via the data tool
- This updates `features_user_day` for all active users on that date with current counts from source tables

**2. Batch recalculate Light Scores for all active users**
- Call `recalculate-light-scores` edge function in batch mode (no `user_id` body) which iterates all eligible users and calls `calculate_user_light_score` for each
- The updated function already handles raw vs features comparison, so scores will be accurate

### No code changes needed
- The SQL function fix is already deployed
- The edge function `recalculate-light-scores` already supports batch mode
- This is purely a data refresh operation (2 sequential data tool calls)

