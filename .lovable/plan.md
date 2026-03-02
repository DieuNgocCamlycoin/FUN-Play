

# Audit Report: PPLP Light Score Scoring Accuracy

## Findings Summary

I compared the deployed `calculate_user_light_score` function and `aggregate_features_user_day` against the LS-Math v1.0 spec (`scoring-config-v1.ts`). Here are the issues found:

---

## Issue 1: `content_pillar_score` Always 0 in SQL Aggregation

**Severity: HIGH**

The SQL function `aggregate_features_user_day` (the cron-based aggregator) hardcodes `content_pillar_score = 0` (line 57). It never queries `pplp_ratings` to compute the actual content quality score.

Only the `build-features` edge function computes `content_pillar_score` from `pplp_ratings`, but that function is NOT called by the cron — the cron calls `aggregate_features_user_day` SQL function instead.

**Impact**: The 60% content weight in the formula (`0.6 * content_score`) is always 0 for all users scored via the cron pipeline. Users' scores are based only on the 40% action base.

**Fix**: Update `aggregate_features_user_day` to compute `content_pillar_score` from `pplp_ratings` using the spec formula: `h(P_c) = (P_c/10)^1.3` with content type multipliers.

---

## Issue 2: Raw Fallback Path Missing Several Action Types

**Severity: MEDIUM**

The `GREATEST(features, raw)` fallback in `calculate_user_light_score` (lines 62-72) counts raw activity from source tables but is missing:

| Action | Spec Weight | Status |
|--------|-------------|--------|
| Posts | 3.0 | Included |
| Comments + Post Comments | 1.5 | Included |
| Videos | 5.0 | Included |
| Likes (all 4 types) | 0.3 | Included |
| Donations | 4.0 | Included |
| **Shares** | **0.8** | **MISSING** |
| **Help/Bounty** | **6.0** | **MISSING** |
| **Reports** | **2.0** | **MISSING** |
| **Checkins** | **1.0** | **MISSING** |

**Impact**: When the raw fallback is used (activity after 02:00 AM cron), shares, help actions, reports, and checkins are not counted.

**Fix**: Add these missing sources to the raw fallback query.

---

## Issue 3: `aggregate_features_user_day` — `avg_rating_weighted` Always 0

**Severity: MEDIUM**

Line 56 of the aggregator hardcodes `avg_rating_weighted = 0`. This field was originally a fallback for `content_pillar_score` calculation. Neither field is populated from `pplp_ratings` in the SQL path.

---

## Issue 4: `sequence_count` Calculation Mismatch

**Severity: LOW**

In `aggregate_features_user_day`, `sequence_count` counts the number of **distinct action types** the user performed that day (line 39-54), not the actual completed behavioral sequences from the `sequences` table. The `build-features` edge function correctly queries `sequences WHERE state = 'complete'`.

The sequence multiplier formula `M_seq = 1 + 0.5 * tanh(Q/5)` expects Q = number of completed sequences, not distinct action types.

**Impact**: Users may get inflated or deflated sequence multipliers.

---

## Issue 5: No Ledger Write

**Severity: LOW**

`calculate_user_light_score` updates `profiles` but does NOT insert into `light_score_ledger`. The ledger is used by the `pplp-light-api` `/me` endpoint and trend calculation. Historical score tracking is incomplete.

---

## Proposed Fix Plan

### Step 1: Fix `aggregate_features_user_day` to compute `content_pillar_score` from `pplp_ratings`
- Query `pplp_ratings` for each user/date
- Calculate weighted pillar average per the spec: `(P_c/10)^1.3` with content type multipliers
- Also populate `avg_rating_weighted`

### Step 2: Fix `sequence_count` to query from `sequences` table
- Replace the "distinct action types" logic with actual completed sequence count

### Step 3: Add missing actions to the raw fallback path in `calculate_user_light_score`
- Add shares (from `reward_transactions`), help (from `bounty_submissions`), checkins (from `daily_checkins`)

### Step 4: Add ledger insert to `calculate_user_light_score`
- Insert a row into `light_score_ledger` after computing the final score

### Step 5: Re-aggregate and recalculate all users
- Run `aggregate_features_user_day` for all dates in the current epoch
- Batch recalculate all users

### Technical Details

All fixes are SQL migrations to the two core functions. No frontend changes needed. After deploying, a data refresh (aggregate + recalculate) will correct all existing scores.

