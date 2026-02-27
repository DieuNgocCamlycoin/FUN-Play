

## Plan: Light Score Mathematical Spec (LS-Math v1.0)

This replaces the current step-function scoring with the formal mathematical formulas from the spec.

---

### 1. Create `src/lib/fun-money/light-score-math.ts`

Pure TypeScript implementation of all formulas from the spec:

- **Reputation Weight** (Section 3): `w = clip(0.5, 2.0, 1 + 0.25 * log(1 + R_u))`
- **Content Pillar Score** (Section 4): Weighted average of community ratings per pillar k, with rater reputation weights, epsilon = 1e-6
- **Action Base Score** (Section 5): `B_u(t) = Σ b_τ * g(x)` with payload quality adjustment g ∈ [0, 1.5]
- **Content Daily Score** (Section 6): `C_u(t) = Σ ρ(type) * (P_c/10)^1.3`
- **Consistency Multiplier** (Section 7): `M_cons = 1 + 0.6 * (1 - e^(-S/30))`
- **Sequence Multiplier** (Section 8): `M_seq = 1 + 0.5 * tanh(Q/5)`
- **Integrity Penalty** (Section 9): `Π = 1 - min(0.5, 0.8 * r)`
- **Cold Start Fallback** (Section 10): `P̃_c = μ_topic * φ_u` when ratings < N_min
- **Daily Light Score** (Section 11): `L = (0.4*B + 0.6*C) * M_cons * M_seq * Π`
- **Epoch Light Score** (Section 12): `L_u(e) = Σ L_u(t)`
- **Eligibility Check** (Section 13): 4 conditions
- **Explainability** (Section 16): Generate audit object with top contributors and reason codes
- **Default Parameters** (Section 17): All constants from spec as named config object

---

### 2. Update `calculate_user_light_score` RPC (DB Migration)

Replace the step-function logic with the mathematical formulas:

- Reputation weight: logarithmic formula instead of step thresholds
- Consistency: exponential decay `1 + 0.6 * (1 - exp(-S/30))` instead of if/else
- Sequence: `1 + 0.5 * tanh(Q/5)` instead of step
- Integrity: `1 - min(0.5, 0.8 * r)` instead of `r * 0.5`
- Daily score: `0.4 * B + 0.6 * C` split (action base vs content score)
- Content score: use `pplp_ratings` weighted average with `(P_c/10)^1.3` quality curve
- Store full explainability object in `light_score_details`

---

### 3. Update `build-features` Edge Function

Add content pillar score computation:
- Query `pplp_ratings` for user's content on target date
- Calculate weighted pillar scores using rater reputation weights
- Store aggregated content score in `features_user_day` (add `content_pillar_score` column)

---

### 4. DB Migration for new column

- Add `content_pillar_score NUMERIC DEFAULT 0` to `features_user_day`

---

### 5. Update `pplp-engine.ts`

- Replace `calculateReputationWeight` with logarithmic formula
- Replace `calculateConsistencyMultiplier` with exponential formula
- Add new exports: `calculateContentPillarScore`, `calculateActionBaseScore`, `calculateDailyLightScore`

---

### 6. Update `.lovable/plan.md`

Add LS-Math v1.0 as completed item.

---

### Implementation Order

| Step | Task |
|------|------|
| 1 | Create `light-score-math.ts` with all 19 sections |
| 2 | DB migration: add `content_pillar_score` to `features_user_day` |
| 3 | Update `calculate_user_light_score` RPC with new formulas |
| 4 | Update `build-features` to compute content pillar scores |
| 5 | Update `pplp-engine.ts` with new formula functions |
| 6 | Update plan.md |

