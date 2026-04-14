

# FUN Ecosystem — Light Score System Alignment Plan

## Current State vs CTO Diagram

After reviewing the codebase, there are **significant architectural gaps** between the CTO diagram and the current implementation:

| Aspect | CTO Diagram (Target) | Current Implementation |
|--------|----------------------|----------------------|
| **5 Pillars** | Serving Life, Truth, Love, Value, Unity | Identity, Activity, Onchain, Transparency, Alignment |
| **Scale** | 0–10 each | 0–100 each |
| **Formula** | **Multiplicative**: S × T × L × V × U / 10⁴ | **Additive**: weighted sum (0.25S + 0.20T + ...) |
| **Zero rule** | Any pillar = 0 → Score = 0 | No such rule |
| **Proof Layer** | Required for every action | Optional (proof URL is optional in MintRequestForm) |
| **Action Groups** | Inner Work, Channeling, Giving, Social Impact, Service | WATCH_VIDEO, LIKE, COMMENT, SHARE, etc. |
| **Validation** | AI Analysis + Community Feedback + System Signals | Partial (Angel AI moderation exists, no community feedback scoring) |

## Impact Assessment

This is a **foundational change** to the scoring engine. Changing from additive to multiplicative scoring and renaming all 5 pillars will affect:

- `light-score-pillars.ts` — pillar configs, weights, names
- `light-score-pillar-engine.ts` — all scoring functions, formula
- `pplp-engine.ts` — pillar scores interface (S, T, H, C, U)
- `LightScoreDashboard.tsx` — radar chart labels
- `MintRequestForm.tsx` — pillar sliders and labels
- `LightLevelBadge.tsx` — level display
- Multiple hooks and edge functions

## Proposed Plan (5 Steps)

### Step 1: Redefine 5 Pillars & Scoring Config
Rename pillars in `light-score-pillars.ts`:
- `identity` → `serving` (Serving Life / Phụng sự)
- `activity` → `truth` (Transparent Truth / Chân thật)
- `onchain` → `love` (Healing & Love / Chữa lành)
- `transparency` → `value` (Long-term Value / Giá trị)
- `alignment` → `unity` (Unity over Separation / Đoàn kết)

Scale each 0–10. Update `PILLAR_CONFIGS`, `PILLAR_LIST`, and `PillarName` type.

### Step 2: Switch to Multiplicative Formula
In `light-score-pillar-engine.ts`, replace:
```
weightedTotal = 0.20*S + 0.20*T + 0.20*L + 0.20*V + 0.20*U
```
With:
```
FinalScore = (S × T × L × V × U) / 10⁴
```
Add the **zero-kill rule**: if any pillar = 0, final score = 0. This is the anti-fake mechanism built into the math.

### Step 3: Enforce Proof Layer
Make proof URL **required** in `MintRequestForm.tsx`. Block submission if no proof is provided:
- "No Proof → No Score → No Mint"
- Accept: link, video, image URL, or system log reference

### Step 4: Remap Action Groups
Update action types in the system to align with the 5 fixed groups:
- Inner Work (meditation, reflection)
- Channeling (content creation, learning)
- Giving (donations, rewards)
- Social Impact (community help, mentoring)
- Service (platform contributions, governance)

Map existing `BASE_REWARDS` action types into these 5 groups.

### Step 5: Update All UI Components
- **RadarChart** in `LightScoreDashboard.tsx`: new labels (0–10 scale)
- **MintRequestForm.tsx**: sliders from 0–10 with new pillar names
- **Pillar detail rows**: new emoji and Vietnamese labels
- **pplp-engine.ts**: sync `PillarScores` interface (S, T, H, C, U stay but meanings change)

## Technical Considerations

- **Database**: The `pplp_events` scoring tags and `features_user_day` data won't need schema changes — only the interpretation layer changes
- **Existing scores**: Will need a one-time recalculation for all users after formula switch
- **Backward compatibility**: Existing mint requests already processed won't be affected
- **Level thresholds**: May need recalibration since multiplicative scoring produces different ranges than additive

## What stays the same
- LS-Math v1.0 database functions (authoritative source)
- Mint distribution: 99% User / 1% Platform
- Anti-whale cap, cooldown, pool limits
- Multisig 3/3 signing flow
- Edge functions for auto-routing

