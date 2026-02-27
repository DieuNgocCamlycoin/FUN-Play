

# Audit Report: FUN Money Minting System - FUN Play

## Overview

After thorough review of all scoring, minting, and PPLP validation code, here is the complete audit.

---

## 1. CURRENT SCORING FORMULAS IN USE

The system has **TWO parallel scoring engines** that are NOT fully aligned:

### Engine A: `pplp-engine.ts` (Used by MintRequestForm & AutoMintFun)
- **Light Score** = 0.25×S + 0.20×T + 0.20×H + 0.20×C + 0.15×U (5 pillar weighted sum, scale 0-100)
- **Mint Amount** = baseReward × Q × I × K × Ux
- Thresholds: Light >= 60, Truth >= 70, K >= 0.6, antiSybil >= 0.6
- Used by: `useMintRequest`, `useAutoMintFun`, `MintRequestForm`

### Engine B: `light-score-math.ts` (LS-Math v1.0 - The formal spec)
- **Daily Light Score** = (0.4×B + 0.6×C) × M_cons × M_seq × Π
- B = action base score, C = content daily score with γ=1.3 exponent
- M_cons = 1 + 0.6×(1 - e^(-S/30)) — consistency multiplier
- M_seq = 1 + 0.5×tanh(Q/5) — sequence multiplier
- Π = 1 - min(0.5, 0.8×risk) — integrity penalty
- Used by: `scoring-simulation.ts`, `mint-epoch-engine` (edge function)

### Problem identified
Engine A (used for real-time mint requests) uses a **simplified formula** that doesn't incorporate the full LS-Math v1.0 spec. Specifically:
- No consistency multiplier (M_cons) applied
- No sequence multiplier (M_seq) applied
- No content quality exponent (γ=1.3) applied
- Pillar scores are user self-reported (0-100 scale) instead of community-rated (0-2 per pillar)

---

## 2. USER MINT FLOW (Current Implementation)

There are **3 mint paths** currently active:

### Path 1: Manual Form (`MintRequestForm`)
1. User connects wallet
2. User self-reports pillar scores (S,T,H,C,U sliders 0-100)
3. User self-checks unity signals (4 checkboxes)
4. System calculates via Engine A → inserts `mint_requests` with status `pending`
5. Admin reviews and approves → on-chain mint via `lockWithPPLP`
6. User activates → claims

### Path 2: Auto-Mint from CAMLY rewards (`useAutoMintFun`)
1. User watches video / likes / comments → triggers `camly-reward` event
2. System maps CAMLY action to FUN action type
3. System fetches profile, checks: wallet exists, light_score >= 60, auto_mint enabled
4. System builds **hardcoded pillar scores** (S=50, T varies, H=50, C=40, U=30)
5. Submits via `useMintRequest.submitRequest()` → Engine A calculates
6. Same approval flow as Path 1

### Path 3: 1-Click Auto-Mint (`useAutoMintRequest`)
1. System receives pre-calculated pillars, light score, mintable FUN amount
2. Calculates K and Ux multipliers only
3. **Bypasses scoring engine** — uses provided `mintableFunAtomic` directly as both base and calculated amount
4. Inserts with Q=1.0, I=1.0

### Path 4: Epoch-based distribution (`mint-epoch-engine`)
1. Weekly cron creates epoch
2. Fetches all profiles with light_score > 0, not banned
3. Checks: PPLP accepted, level >= contributor, no anti-farm flags, activity in period
4. Distributes pool proportionally: allocation = (user_light / total_light) × pool
5. Anti-whale cap: max 3% per user, excess redistributed

---

## 3. PPLP VALIDATION STATUS

### Constitution v2.0 — 5 mandatory conditions
The code exists in `constitution.ts` with `validatePPLP()` checking:
1. hasRealAction
2. hasRealValue
3. hasPositiveImpact
4. noExploitation
5. charterCompliant

### Current usage: **NOT ENFORCED**
- `scoreAction()` in `pplp-engine.ts` supports `pplpValidation` parameter (line 277)
- But **none of the 3 mint paths actually pass this parameter**
- `useMintRequest` does not include `pplpValidation` in its input
- `useAutoMintFun` does not include it either
- Result: Constitution v2.0 validation is **dead code**

---

## 4. ISSUES FOUND

| # | Issue | Severity |
|---|-------|----------|
| 1 | Engine A (real-time) doesn't use LS-Math v1.0 formulas (no γ=1.3, no M_cons, no M_seq) | **High** |
| 2 | PPLP v2.0 validation (5 conditions) is never called | **High** |
| 3 | Auto-mint uses hardcoded pillar scores (S=50, H=50, C=40, U=30) instead of real data | **Medium** |
| 4 | Path 3 (1-Click) bypasses scoring entirely — uses raw amount as final | **Medium** |
| 5 | Self-reported pillar scores (0-100 sliders) in MintRequestForm — no community validation | **Medium** |
| 6 | `scoring-config-v1.ts` defines parameters but is not imported by the actual mint flow | **Low** |
| 7 | Epoch engine uses `light_score` from profiles table but doesn't verify how it was calculated | **Low** |

---

## 5. RECOMMENDED FIXES

### Fix 1: Unify scoring to LS-Math v1.0
Replace Engine A's simplified calculation in `useMintRequest` with calls to `light-score-math.ts` functions. This ensures consistency, M_cons, M_seq, and integrity are all applied.

### Fix 2: Enforce PPLP v2.0 validation
Pass `pplpValidation` to `scoreAction()` in all 3 mint paths. For auto-mint, set conditions based on action type (e.g., WATCH_VIDEO → hasRealAction=true, hasRealValue=true based on view duration).

### Fix 3: Replace hardcoded pillars in auto-mint
Use actual profile data (light_score_ledger / pplp_ratings) instead of hardcoded S=50, H=50, C=40, U=30.

### Fix 4: Add scoring to 1-Click path
Route `useAutoMintRequest` through `scoreAction()` instead of bypassing it.

---

## Summary

The formal LS-Math v1.0 spec and Constitution v2.0 are **fully implemented as libraries** but the actual mint flow uses a **simplified parallel engine** that doesn't apply consistency multipliers, sequence bonuses, content quality exponents, or PPLP v2.0 validation. The epoch engine is closer to spec but operates independently. To align with the latest standard, the real-time mint paths need to be refactored to use `light-score-math.ts` and enforce `validatePPLP()`.

