

# Align Edge Function Responses with OpenAPI Examples JSON

## Summary

The uploaded `FUN_Backend_OpenAPI_Examples.json` provides concrete sample request/response payloads. Comparing against current edge functions, most responses already match. Two functions need adjustments:

## Gaps Found

| Function | Gap | Example Expected | Current |
|----------|-----|-----------------|---------|
| `get-light-profile` | `pillar_summary` format | `{ serving_life_avg: 7.8, transparent_truth_avg: 8.4, ... }` (per-pillar averages) | `{ "service": { count, avg_light_score } }` (grouped by pillar_group) |
| `get-light-profile` | `recent_actions` type | Number (`12`) | Array of action objects |
| `validate-action` | `explanation` format | `{ notes: ["Event proof accepted", ...] }` | `{ flags, aiScores, communityScores, systemTrust, participationFactor }` |

All other endpoints (`submit-action`, `attach-proof`, `mint-from-action`, `create-event`, `create-group`, `submit-attendance`) already match the example payloads.

## Plan

### Step 1: Update `get-light-profile` response
- Change `pillar_summary` to compute per-pillar averages across all user validations: `serving_life_avg`, `transparent_truth_avg`, `healing_love_avg`, `long_term_value_avg`, `unity_over_separation_avg`
- Change `recent_actions` to return count (number) instead of array — move the array to a separate field `recent_actions_list` or remove it

### Step 2: Update `validate-action` explanation field  
- Add a `notes` array to the `explanation` object with human-readable strings like "Event proof accepted", "No duplicate proof detected"
- Keep existing detailed data alongside for debugging

### Step 3: Save examples file to docs
- Copy `FUN_Backend_OpenAPI_Examples.json` to `docs/` for reference

## Files

**Modified:**
- `supabase/functions/get-light-profile/index.ts` — pillar_summary format + recent_actions as count
- `supabase/functions/validate-action/index.ts` — explanation.notes array

**New:**
- `docs/FUN_Backend_OpenAPI_Examples.json`

