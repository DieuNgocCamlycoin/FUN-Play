

# Align Database with ERD + Sequence Diagrams v1

## Current State vs ERD

| ERD Entity | Current DB Table | Status |
|---|---|---|
| `users` (profiles) | `profiles` | ✅ Has `wallet_address`, `trust_level`, `total_light_score`, `total_fun_minted` |
| `action_types` | `action_types` | ✅ Matches |
| `user_actions` | `user_actions` | ✅ Matches |
| `proofs` | `proofs` | ✅ Matches |
| `pplp_validations` | `pplp_validations` | ✅ Matches (5 pillars + final_light_score + validation_status) |
| `mint_records` | `mint_records` | ⚠️ Missing `validation_digest` column |
| `balance_ledger` | `balance_ledger` | ✅ Matches (user_id, entry_type, amount, reference_table/id) |
| `event_groups` | `love_house_groups` | ⚠️ Name mismatch + missing `group_name`, `estimated_participants` |
| `group_attendance` | `attendance` | ⚠️ Name mismatch + missing `event_id`, `attendance_confidence` |
| `community_reviews` | `community_reviews` | ✅ Exists |

## Sequence Diagram Gaps

The 3 sequence diagrams confirm the flows already implemented in edge functions. One operational gap:

- **Sequence 3 (Async jobs)**: Recommends event bus topics (`action.submitted`, `proof.attached`, `validation.completed`, `mint.completed`). Currently no event/queue system — edge functions run synchronously. This is a future DevOps concern, not blocking.

## Plan

### Step 1: Database migration — align table columns

**`attendance` table:**
- Add `event_id` (uuid, FK → events) — ERD requires direct event linkage
- Add `attendance_confidence` (numeric) — ERD's `presence / confidence` field
- Add `attendance_mode` (text) — to track how attendance was recorded

**`love_house_groups` table:**
- Add `group_name` (text) — ERD's `group_name` field (currently only has `love_house_id`)
- Add `estimated_participants` (integer) — ERD shows this; table has `expected_count` which is similar but the OpenAPI spec uses `estimated_participants`

**`mint_records` table:**
- Add `validation_digest` (text) — for audit trail hash (already computed in edge function but not stored)

### Step 2: Update edge functions to use new columns

- `submit-attendance`: write `event_id`, `attendance_confidence`, `attendance_mode` to `attendance` table
- `create-group`: write `group_name`, `estimated_participants` to `love_house_groups`
- `mint-from-action`: persist `validation_digest` to `mint_records`

### Step 3: Save ERD doc to project docs
- Copy the document to `docs/FUN_ERD_Sequence_Diagrams_v1.docx`

## Not changing (intentional)
- Table names (`love_house_groups` → not renaming to `event_groups`, `attendance` → not renaming to `group_attendance`) — renaming would break all existing edge functions, RLS policies, and frontend queries. The current names work fine.
- Event bus / async queue system — future DevOps concern per Sequence 3

## Files affected

**Migration:** Add columns to `attendance`, `love_house_groups`, `mint_records`
**Modified:** `supabase/functions/submit-attendance/index.ts`, `supabase/functions/create-group/index.ts`, `supabase/functions/mint-from-action/index.ts`
**New:** `docs/FUN_ERD_Sequence_Diagrams_v1.docx`

