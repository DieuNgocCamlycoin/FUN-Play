

# Light Score Parameter Table v1.0 — Implementation Plan

## Gap Analysis: Current Code vs Spec Tables

### What's already correct
- VVU formula structure: `B × Q × TC × IIS × IM × AAF × ERP`
- 3-tier Light Score (PLS/NLS/LLS → TLS)
- Display formula: `100 × log(1 + RawLS)`
- 6 tiers (Seed → Cosmic)

### What needs updating

| Area | Current | Spec v1.0 |
|------|---------|-----------|
| **Base Values** | Generic codes (post_created: 3.0, daily_checkin: 1.0) | Spec table with 15 event types and specific ranges (Daily Check-in: 0.1–0.3, DID: 5–10, Soulbound: 8–15, etc.) |
| **Quality (Q_e)** | Calculated from length/originality/completion (0-1) | 4 levels: Low 0.3–0.6, Normal 0.8–1.0, Good 1.0–1.3, Excellent 1.3–1.8 |
| **Trust (TC_e)** | 4 tiers (new: 0.6, standard: 0.85, trusted: 1.0, veteran: 1.15) | 5 levels: Unknown 0.5–0.8, Basic 0.8–1.0, Verified 1.0–1.2, Strong 1.2–1.4, Core 1.4–1.5 |
| **IIS range** | 0–1.5 (OK) but patterns not matching spec | 5 patterns: Spam 0–0.3, Farming 0.5–0.8, Normal 0.9–1.0, Good 1.0–1.2, Pure 1.2–1.5 |
| **Impact (IM_e)** | 0–3.0 (OK) but levels don't match | 5 levels: None 0.5–0.8, Light 0.8–1.0, Clear 1.0–1.5, Strong 1.5–2.5, Massive 2.5–3.0 |
| **AAF** | Continuous calculation | 5 discrete levels: Normal 1.0, Suspicious 0.5–0.8, Flag 0.2–0.5, Near-spam 0.05–0.2, Block 0 |
| **ERP (Ego Risk Penalty)** | Currently = Epoch Recency Premium (time decay) | Spec redefines as Ego Risk Penalty: Neutral 1.0, Reward-optimizing 0.9, Clickbait 0.7–0.85, Toxic 0.5–0.7 |
| **Consistency (C_t)** | `1 + log(1+streak)/k`, range 0.9–1.3 | Stepped table: 1–3d→0.95, 4–7d→1.0, 8–30d→1.05, 30–90d→1.1, 90+→1.15–1.25 |
| **Reliability (R_t)** | Base 0.8 + components, range 0.5–1.2 | 4 levels: Abandon 0.6–0.8, Normal 0.9–1.0, Good 1.0–1.1, Very reliable 1.1–1.2 |
| **Network (QN/TN/DN)** | Passed as raw 0-1 inputs | QN: 4 levels 0.2–1.5, TN: 4 levels 0.5–1.3, DN: 4 levels 0.8–1.2 |
| **Legacy (PV/AD/LO/PU)** | Raw 0-1 inputs | PV: 1–100, AD: 0.5–1.5, LO: log formula + table (7d→1, 1yr→3), PU: 0.5–1.5 |
| **TLS Weights by Phase** | Fixed α=0.5, β=0.3, γ=0.2 | Phase-dependent: Early 0.7/0.2/0.1, Growth 0.5/0.3/0.2, Mature 0.4/0.3/0.3 |
| **Activation Thresholds** | Simple (earning ≥ 10 display) | Detailed: Earn basic LS>10+TC>0.8, Advanced LS>100, Referral LS>50, Vote LS>200, Proposal LS>500, Validator LS>1000 |

---

## Implementation

### 1. Create `src/lib/fun-money/light-score-params-v1.ts`
Single source of truth for ALL parameter tables from the spec:
- `EVENT_BASE_VALUES` — 15 event types with min/max ranges
- `QUALITY_LEVELS` — 4 levels with ranges
- `TRUST_LEVELS` — 5 levels (Unknown→Core)
- `IIS_PATTERNS` — 5 patterns with ranges
- `IMPACT_LEVELS` — 5 levels
- `AAF_LEVELS` — 5 statuses
- `EGO_RISK_PATTERNS` — 4 patterns (replaces old ERP time-decay)
- `CONSISTENCY_TABLE` — 5 streak bands
- `RELIABILITY_TABLE` — 4 behavior levels
- `NETWORK_QUALITY_TABLE`, `NETWORK_TRUST_TABLE`, `NETWORK_DIVERSITY_TABLE`
- `LEGACY_PV_TABLE`, `LEGACY_AD_TABLE`, `LEGACY_LO_TABLE`, `LEGACY_PU_TABLE`
- `TLS_PHASE_WEIGHTS` — Early/Growth/Mature
- `ACTIVATION_THRESHOLDS` — 6 feature gates
- Helper functions: `getBaseValue()`, `getQualityMultiplier()`, `getTrustConfidence()`, etc.

### 2. Update `src/lib/fun-money/pplp-engine-v25.ts`
- Replace `BASE_VALUES` with spec's 15 event types
- Replace `TRUST_WEIGHTS` with 5-level TC_e table
- Update `quality_score` calculation to map to 4 Quality levels (0.3–1.8)
- Replace `calculateERP()` (time decay) with `calculateEgoRiskPenalty()` (pattern-based)
- Keep AAF continuous calculation but add level classification

### 3. Update `src/lib/fun-money/light-score-v25.ts`
- Replace `consistencyMultiplierV25()` — use stepped table (range 0.95–1.25)
- Update `reliabilityMultiplierV25()` — map to 4 discrete levels (0.6–1.2)
- Add `SystemPhase` type and phase-aware `LIGHT_WEIGHTS`
- Update `getActivationStatus()` with detailed thresholds (LS>10+TC>0.8, etc.)
- Add typed network multiplier helpers for QN/TN/DN
- Add typed legacy parameter helpers for PV/AD/LO/PU with `LO = log(1 + days_active)`

### 4. Update `supabase/functions/event-scoring-engine/index.ts`
- Use new parameter tables for scoring

### 5. Save memory `mem://economy/light-score-parameter-table-v1`

---

## Files

| File | Action |
|------|--------|
| `src/lib/fun-money/light-score-params-v1.ts` | **Create** — All parameter tables |
| `src/lib/fun-money/pplp-engine-v25.ts` | **Update** — Base values, TC, Quality, ERP→EgoRisk |
| `src/lib/fun-money/light-score-v25.ts` | **Update** — Consistency, Reliability, Weights, Activation |
| `supabase/functions/event-scoring-engine/index.ts` | **Update** — Use new params |
| `mem://economy/light-score-parameter-table-v1` | **Create** — Memory |

