

## Plan: Light Score Mathematical Spec (LS-Math v1.0) — ✅ COMPLETED

Replaced step-function scoring with formal mathematical formulas from the PPLP spec.

### Completed Steps

| Step | Task | Status |
|------|------|--------|
| 1 | Created `src/lib/fun-money/light-score-math.ts` with all 19 sections | ✅ Done |
| 2 | DB migration: added `content_pillar_score` to `features_user_day` | ✅ Done |
| 3 | Updated `calculate_user_light_score` RPC with LS-Math v1.0 formulas | ✅ Done |
| 4 | Updated `build-features` to compute content pillar scores | ✅ Done |
| 5 | Updated `pplp-engine.ts` with new formula functions | ✅ Done |
| 6 | Updated plan.md | ✅ Done |

### Key Formulas Implemented

- **Reputation Weight**: `w = clip(0.5, 2.0, 1 + 0.25 * log(1 + R_u))`
- **Content Pillar Score**: Weighted avg of community ratings per pillar k, with `(P_c/10)^1.3` quality curve
- **Action Base Score**: `B_u(t) = Σ b_τ * g(x)` with payload quality g ∈ [0, 1.5]
- **Content Daily Score**: `C_u(t) = Σ ρ(type) * h(P_c)`
- **Consistency Multiplier**: `M_cons = 1 + 0.6 * (1 - e^(-S/30))`
- **Sequence Multiplier**: `M_seq = 1 + 0.5 * tanh(Q/5)`
- **Integrity Penalty**: `Π = 1 - min(0.5, 0.8 * r)`
- **Daily Light Score**: `L = (0.4*B + 0.6*C) * M_cons * M_seq * Π`
- **Epoch Light Score**: `L_u(e) = Σ L_u(t)`
- **Anti-whale cap**: 3% max per user with redistribution
- **Cold start fallback**: `P̃_c = μ_topic * φ_u` when ratings < N_min
- **Eligibility**: 4 conditions (PPLP accepted, integrity gate, min contribution, no review)
- **Explainability**: Full audit object with top contributors and reason codes
- **AI advisory**: ego_risk, pillar_suggest, spam_risk (Section 19)

### Files

- `src/lib/fun-money/light-score-math.ts` — Pure math module (all 19 sections)
- `src/lib/fun-money/pplp-engine.ts` — Updated with logarithmic/exponential formulas
- `supabase/functions/build-features/index.ts` — Content pillar score computation
- DB RPC `calculate_user_light_score` — LS-Math v1.0 formulas
