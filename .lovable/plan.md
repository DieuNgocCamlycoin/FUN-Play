

# FUN Ecosystem — Full Architecture Build Plan (CTO Dev-Ready Spec)

## Current State

The previous implementation round already updated:
- **Pillar names** → Serving, Truth, Love, Value, Unity (0-10 scale) in `light-score-pillars.ts`
- **Multiplicative formula** → `(S×T×L×V×U)/10⁴` with zero-kill rule in `pplp-engine.ts`
- **Proof enforcement** → Required in `MintRequestForm.tsx`
- **Action Groups** → 5 fixed groups mapped in `light-score-pillars.ts`

**What's missing** (from the CTO spec):
1. **Database schema** — 9 new tables (`action_types`, `user_actions`, `proofs`, `pplp_validations`, `community_reviews`, `mint_records`, `balance_ledger`, `immutable_rules`) do not exist
2. **Dead code** — `PILLAR_WEIGHTS` (additive) still in `pplp-engine.ts`, tests still use 0-100 scale
3. **Validation Engine** — No AI + Community + System Trust 3-layer validation
4. **Mint Engine** — No `BaseMintRate × FinalLightScore` with `ImpactWeight × TrustMultiplier × ConsistencyMultiplier`
5. **API endpoints** — No edge functions for submit action, attach proof, validate, mint
6. **Community review system** — No endorse/flag UI or scoring

## Implementation Plan

### Step 1: Create Database Schema (9 tables + seed data)

One migration creating all tables with proper RLS:
- `action_types` — 6 seeded rows (INNER_WORK, CHANNELING, GIVING, SOCIAL_IMPACT, SERVICE, LEARNING)
- `user_actions` — status flow: submitted → proof_pending → under_review → validated → minted/rejected/flagged
- `proofs` — linked to user_actions, proof_type enum
- `pplp_validations` — 5 pillar scores + ai/community/trust scores + final_light_score
- `community_reviews` — endorse/flag per reviewer per action
- `mint_records` — 99/1 split tracked, release mode, lock amounts
- `balance_ledger` — full audit trail of all FUN movements
- `immutable_rules` — seeded with PPLP_DEFINITION, MINT_SPLIT, NO_PROOF_NO_SCORE, NO_SCORE_NO_MINT

RLS policies: users own their actions/proofs/reviews; admins manage all; public can view validated actions.

### Step 2: Clean Up Engine Code

- Remove dead `PILLAR_WEIGHTS` from `pplp-engine.ts`
- Add `ImpactWeight`, `TrustMultiplier`, `ConsistencyMultiplier` soft multipliers to the Light Score formula:
  ```
  FinalLightScore = RawLightScore × ImpactWeight × TrustMultiplier × ConsistencyMultiplier
  ```
- Add safety rules: `if T < 3 → manual review`, `if S = 0 → reject`, `if L = 0 → reject`
- Update `MintAmount = BaseMintRate × FinalLightScore` with 99/1 split
- Fix tests to use 0-10 scale and multiplicative formula

### Step 3: Create Edge Functions (Action Pipeline API)

Four edge functions matching the API spec:

1. **`submit-action`** — `POST /api/actions`: Create user_action + auto-set status
2. **`attach-proof`** — `POST /api/actions/{id}/proofs`: Attach proof, update status to `under_review`
3. **`validate-action`** — `POST /api/actions/{id}/validate`: Run AI scoring on 5 pillars, store `pplp_validations`, apply safety rules
4. **`mint-from-action`** — `POST /api/actions/{id}/mint`: Calculate mint amount, create mint_records with 99/1 split, update balance_ledger

### Step 4: Build Validation Engine (3-Layer)

In `validate-action` edge function:
- **AI Analysis** (60% weight): Use Lovable AI to classify action, detect spam, score 5 pillars
- **Community Feedback** (20% weight): Aggregate from `community_reviews` table
- **System Trust** (20% weight): Account age, consistency, report ratio, anti-farm risk

Combined formula:
```
pillar_final = 0.6 × ai_score + 0.2 × community_score + 0.2 × system_trust
```

### Step 5: Update UI — Action Submission Flow

Replace current `MintRequestForm` with a 4-step flow matching the CTO UX spec:
1. **Choose action** — Select from 5 action groups with Vietnamese labels
2. **Upload proof** — Required link/video/image
3. **System validates** — Show PPLP 5-pillar scoring in real-time
4. **Receive results** — Light Score + FUN Money amount with 99/1 breakdown

### Step 6: Anti-Fake Rules

- Duplicate proof detection (same URL check in `proofs` table)
- Velocity limit (max 10 scored actions/day, max 3 high-impact/day)
- Trust decay for spam users
- Community conflict flag → manual review

## Files Affected

**New files:**
- 1 migration (9 tables + seed data)
- `supabase/functions/submit-action/index.ts`
- `supabase/functions/attach-proof/index.ts`
- `supabase/functions/validate-action/index.ts`
- `supabase/functions/mint-from-action/index.ts`

**Modified files:**
- `src/lib/fun-money/pplp-engine.ts` — remove PILLAR_WEIGHTS, add soft multipliers
- `src/lib/fun-money/__tests__/pplp-engine.test.ts` — fix to 0-10 scale
- `src/components/FunMoney/MintRequestForm.tsx` — 4-step action submission flow
- `src/components/FunMoney/LightScoreDashboard.tsx` — show pillar breakdown from validations

## What Stays the Same
- LS-Math v1.0 database functions (authoritative source)
- Multisig 3/3 signing flow
- Auto-route-multisig trigger
- Existing `mint_requests` table (legacy, still used for current flow)
- Constitution v2.0

