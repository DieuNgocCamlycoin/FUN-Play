

# Align Edge Functions with OpenAPI v1.0 Spec

## Summary

The OpenAPI spec defines 9 endpoints. 7 already exist as edge functions but need field/response alignment. 2 are entirely missing.

## Gap Analysis

| OpenAPI Endpoint | Edge Function | Status |
|---|---|---|
| `POST /v1/actions` | `submit-action` | ✅ Exists — field rename needed (`action_type_code` → `action_type`) |
| `GET /v1/actions/{actionId}` | — | ❌ **Missing** — need `get-action` |
| `POST /v1/actions/{actionId}/proofs` | `attach-proof` | ✅ Exists — response format needs `created_at` |
| `POST /v1/actions/{actionId}/validate` | `validate-action` | ✅ Exists — response needs `impact_weight`, `trust_multiplier`, `consistency_multiplier`, `ai_score`, `community_score`, `trust_signal_score`, `explanation` fields |
| `POST /v1/actions/{actionId}/mint` | `mint-from-action` | ✅ Exists — needs `release_mode`/`claim_percent` input + `tx_hash` in response |
| `GET /v1/users/{userId}/light-profile` | — | ❌ **Missing** — need `get-light-profile` |
| `POST /v1/events` | `create-event` | ✅ Exists — needs `event_type`, `source_platform`, `zoom_meeting_id`, `livestream_links` fields |
| `POST /v1/events/{eventId}/groups` | `create-group` | ✅ Exists — needs `group_name`, `estimated_participants` fields |
| `POST /v1/events/{eventId}/groups/{groupId}/attendance` | `submit-attendance` | ✅ Exists — needs `attendance_mode`, `optional_signals` input + `attendance_confidence` response |

## Implementation Plan

### Step 1: Create `get-action` edge function (NEW)
- Returns action detail with proofs array
- Response matches `ActionDetailResponse` schema
- Auth required — only action owner can view

### Step 2: Create `get-light-profile` edge function (NEW)
- Returns `UserLightProfileResponse`: `trust_level`, `total_light_score`, `total_fun_minted`, `streak_days`, `recent_actions`, `pillar_summary` (avg scores per pillar)
- Aggregates from `profiles`, `user_actions`, `pplp_validations`, `mint_records`
- Auth required

### Step 3: Align `submit-action` request/response
- Accept `action_type` (enum: INNER_WORK, CHANNELING, GIVING, SOCIAL_IMPACT, SERVICE, LEARNING) alongside existing `action_type_code`
- Add `created_at` to response

### Step 4: Align `validate-action` response
- Add missing fields: `impact_weight`, `trust_multiplier`, `consistency_multiplier`, `ai_score`, `community_score`, `trust_signal_score`, `explanation`
- Already computed internally — just need to include in response JSON

### Step 5: Align `mint-from-action` input/response
- Accept optional `release_mode` (instant/partial_lock) and `claim_percent` from request body
- Add `tx_hash` field to response (null until on-chain integration)

### Step 6: Align `create-event` fields
- Accept `event_type` enum, `source_platform`, `zoom_meeting_id`, `livestream_links`
- Migration: add `event_type`, `source_platform`, `zoom_meeting_id` columns to `events` table

### Step 7: Align `create-group` fields
- Accept `group_name`, `leader_user_id`, `estimated_participants`
- Map `group_name` → existing schema fields

### Step 8: Align `submit-attendance` input/response
- Accept `attendance_mode` enum and `optional_signals` object
- Return `attendance_confidence` (derived from participation_factor)

### Step 9: Copy OpenAPI spec to project
- Save as `docs/FUN_Backend_OpenAPI_v1.yaml` for reference

## Files

**New:**
- `supabase/functions/get-action/index.ts`
- `supabase/functions/get-light-profile/index.ts`
- `docs/FUN_Backend_OpenAPI_v1.yaml`

**Modified:**
- `supabase/functions/submit-action/index.ts` — accept `action_type` field
- `supabase/functions/validate-action/index.ts` — expand response
- `supabase/functions/mint-from-action/index.ts` — accept `release_mode`/`claim_percent`, return `tx_hash`
- `supabase/functions/create-event/index.ts` — new fields
- `supabase/functions/create-group/index.ts` — field mapping
- `supabase/functions/submit-attendance/index.ts` — `attendance_mode` + `attendance_confidence`

**Migration:**
- Add `event_type`, `source_platform`, `zoom_meeting_id` to `events` table

