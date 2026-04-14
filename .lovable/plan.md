

# PRD Alignment — Zoom / Love House Attendance System (PRD Section 9)

## Analysis

I reviewed the uploaded PRD (v1.0) against the current codebase. The core PPLP pipeline (action → proof → validation → score → mint) is **already implemented** from the previous build rounds, including:
- 9 core tables (action_types, user_actions, proofs, pplp_validations, etc.)
- 4 edge functions (submit-action, attach-proof, validate-action, mint-from-action)
- Multiplicative formula with zero-kill rule
- 99/1 mint split
- Anti-fake rules (velocity limits, duplicate proof detection)

**The one major gap** is **PRD Section 9: Zoom / Love House Attendance** — the Event → Group → Attendance model that handles group meditation verification. The PRD explicitly states: "A livestream link proves that the event happened. It does not prove that each individual truly participated."

## What needs to be built

### Step 1: Database — 3 new tables

Create `events`, `groups`, and `attendance` tables as defined in PRD Section 9.4:

- **`events`**: event_id, host_user_id, title, platform_links (JSONB), start_at, end_at, recording_hash, status
- **`groups`**: group_id, event_id, leader_user_id, love_house_id, location, expected_count, status
- **`attendance`**: attendance_id, group_id, user_id, check_in_at, check_out_at, duration_minutes, confirmation_status, participation_factor

RLS: users see own attendance, group leaders manage their groups, admins see all.

### Step 2: Edge Functions — 3 new endpoints

1. **`create-event`** — POST: Host creates a Zoom/Love House session with platform links, timing
2. **`create-group`** — POST: Register a Love House subgroup within an event
3. **`submit-attendance`** — POST: User checks in/out, calculates participation_factor based on PRD Section 9.5 signals (duration threshold, leader confirmation, reflection submission)

### Step 3: Participation Factor Logic

Implement the scoring signals from PRD Section 9.5:
- Check-in + check-out = strong positive
- Stayed for threshold duration = strong positive
- Group leader confirmed = positive
- Post-session reflection = positive
- Missing proof or conflict = negative / manual review

The participation_factor (0.0–1.0) feeds into the Light Score as a modifier for attendance-based actions.

### Step 4: Link attendance to PPLP pipeline

When an attendance record is confirmed, auto-create a `user_action` (type: INNER_WORK or CHANNELING) with the attendance as proof, then route through the existing validation → score → mint pipeline.

## Files affected

**New:**
- 1 migration (3 tables + RLS + indexes)
- `supabase/functions/create-event/index.ts`
- `supabase/functions/create-group/index.ts`
- `supabase/functions/submit-attendance/index.ts`

**Modified:**
- `src/lib/fun-money/pplp-engine.ts` — add participation_factor to scoring input
- `supabase/functions/validate-action/index.ts` — check for attendance proof type

## What stays the same
- All existing tables and edge functions
- Multiplicative formula and zero-kill rule
- 99/1 mint split
- Multisig 3/3 signing flow

