

# Align Backend with FUN_Backend_Pseudocode.md

## Gaps Found

Comparing the pseudocode spec against the 5 deployed edge functions:

| Gap | Pseudocode | Current Implementation |
|-----|-----------|----------------------|
| **Action initial status** | `proof_pending` | `submitted` |
| **Proof attachment logic** | Check `hasMinimumProof()` → only move to `under_review` when enough proof | Always sets `under_review` after any single proof |
| **Validation: anti-fake checks** | `isDuplicateProof` + `exceedsVelocityLimits` run inside validation worker | Duplicate check is in `attach-proof`, velocity check only in `submit-action` (daily 10 limit). No high-impact limit (3/day) |
| **Validation digest** | `hash({actionId, userId, finalLightScore, totalMint, pplp, definition})` stored for audit | Not computed at all |
| **On-chain mint call** | `contract.mintValidatedAction(actionIdHash, wallet, amount, validationDigest)` | Only DB record — no on-chain call from edge function |
| **Lifetime Light Score** | `addToLifetimeLightScore(userId, finalLightScore)` | Not implemented |
| **Trust decay/increase** | `decayTrustForSpam` / `increaseTrustForVerifiedConsistency` | Not implemented |
| **Participation weights** | Check-in 0.25, Check-out 0.20, Host confirmed 0.25, Reflection 0.15, Duration 0.10, Optional 0.05 | Need to verify `submit-attendance` matches exactly |

## Plan

### Step 1: Fix action status flow
- `submit-action`: set initial status to `proof_pending` instead of `submitted`
- `attach-proof`: add `hasMinimumProof` check — only move to `under_review` when action has at least 1 qualifying proof

### Step 2: Add anti-fake checks to validate-action
- Add `isDuplicateProof` check (verify no proof hash/URL reused across different actions)
- Add `exceedsVelocityLimits` with both daily limit (10) and high-impact limit (3/day)
- Flag for manual review instead of proceeding when limits exceeded

### Step 3: Add validationDigest to mint-from-action
- Compute `validationDigest = hash({actionId, userId, finalLightScore, totalMint, pplpScores, PPLP_DEFINITION})` 
- Store in `mint_records` for audit trail
- Prepare for future on-chain `mintValidatedAction` call (add TODO with contract integration point)

### Step 4: Add lifetime Light Score tracking
- After successful mint, update `profiles.total_light_score += finalLightScore`
- Migration: add `total_light_score` column to profiles if not present

### Step 5: Add trust decay/increase functions
- `validate-action`: after validation, call `increaseTrustForVerifiedConsistency` (trust += 0.01, max 1.25)
- When spam/velocity flagged: call `decayTrustForSpam` (trust -= 0.05, min 1.0)
- Migration: add `trust_level` column to profiles (default 1.0) if not present

### Step 6: Verify participation factor weights
- Confirm `submit-attendance` uses exact pseudocode weights (0.25/0.20/0.25/0.15/0.10/0.05)

## Files affected

**Modified:**
- `supabase/functions/submit-action/index.ts` — status `proof_pending`
- `supabase/functions/attach-proof/index.ts` — `hasMinimumProof` gate
- `supabase/functions/validate-action/index.ts` — duplicate proof + velocity checks
- `supabase/functions/mint-from-action/index.ts` — validationDigest + lifetime LS update
- `supabase/functions/submit-attendance/index.ts` — verify/fix participation weights

**New:**
- 1 migration: `total_light_score` + `trust_level` columns on profiles

