

## Plan: Fix Stale Feature Data in Light Score Calculation

### Root Cause
The `aggregate_features_user_day` cron runs once at 02:00 AM. Any activity after that isn't counted until the next day. But `calculate_user_light_score` only falls back to raw tables when `action_base = 0` — if features exist but are stale, it uses the incomplete data.

### Fix: Two Changes

**1. Update `calculate_user_light_score` SQL function**
- Remove the `IF v_action_base = 0` condition on the fallback
- For the **current day only** (`CURRENT_DATE`), always compute from raw tables and take the MAX of features vs raw data
- This ensures any activity after the cron job is still counted

**2. Re-aggregate features for today and recalculate**
- Run `aggregate_features_user_day('2026-03-01')` to update today's features with the 13 missing posts
- Then recalculate light score for this user

### Implementation

**Migration SQL:**
- Modify `calculate_user_light_score`: after reading from `features_user_day`, also compute a `v_action_base_raw` from raw tables for dates where `date = CURRENT_DATE`, then use `GREATEST(v_action_base_features, v_action_base_raw)` as the final action_base
- This is a ~15 line change in the existing function, specifically replacing the fallback `IF` block with an always-run supplement for current-day data

**No frontend changes needed** — the hook already reads `light_score` from profiles which will update automatically.

### Immediate Fix
After deploying the migration, invoke `aggregate_features_user_day('2026-03-01')` and then `calculate_user_light_score` for this user to immediately correct the score.

