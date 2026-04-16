

# FUN Monetary Expansion Spec v1 + Epoch System Spec v1 — Implementation Plan

## Gap Analysis

**Current state**: Fixed 5M FUN monthly pool, simple monthly epoch, static allocation by light_score ratio, 3% anti-whale cap, ERC20 transfer for claims. No lock/vesting, no adaptive mint, no treasury vaults, no rolling windows, no discipline modulator.

**Target state**: Adaptive uncapped mint formula (Base + Contribution + Ecosystem × Discipline), 3-tier epoch (Micro 7d → Validation 14d → Mint 28d rolling), token lock/vesting (15% instant / 85% locked), treasury vault system, anti-farming timing model, inflation health dashboard.

---

## Implementation Phases

### Phase A: Database Schema (New Tables + Alterations)

**New tables:**

| Table | Purpose |
|-------|---------|
| `epoch_config` | Governance-configurable params (BaseRate, Alpha-Zeta, stage, lock ratios) |
| `epoch_metrics` | Per-epoch computed metrics (base/contribution/ecosystem expansion, discipline modulator) |
| `user_epoch_scores` | Per-user snapshot: preview → validated → finalized scores, trust/fraud factors |
| `reward_vesting_schedules` | Per-user locked/instant split, unlock schedule, state (PENDING → MINTED_LOCKED → VESTING → CLAIMABLE) |
| `treasury_vault_balances` | 5 vault balances (RewardReserve, Infrastructure, CommunityGrowth, Stability, StrategicExpansion) |
| `treasury_flows` | Append-only log of FUN movement between vaults |
| `inflation_health_metrics` | Daily health ratios: value expansion, utility absorption, retention quality, fraud pressure, locked stability |
| `governance_actions` | Log of governance decisions (approve batch, safe mode, adjust params) |
| `mint_batches` | Finalized mint batch with allocation_root, guardrail_flags, governance_required |

**Alter existing:**
- `mint_epochs` → add `epoch_type` (micro/validation/mint), `window_start`, `window_end`, `base_expansion`, `contribution_expansion`, `ecosystem_expansion`, `discipline_modulator`, `adjusted_mint`, `final_mint`
- `mint_allocations` → add `instant_amount`, `locked_amount`, `vesting_schedule_id`, `trust_band`, `preview_score`, `validated_score`, `finalized_score`
- `claim_requests` → add `token_state` (pending/minted_locked/vesting_unlockable/claimable)

### Phase B: Core Monetary Engine (Edge Function Rewrite)

**Rewrite `mint-epoch-engine/index.ts`** with the full formula:

```text
TotalMint = BaseExpansion + ContributionExpansion + EcosystemExpansion
AdjustedMint = TotalMint × DisciplineModulator (0.65–1.25)
FinalMint = clamp(MinEpochMint, AdjustedMint, MaxEpochMintPolicy)
```

- **BaseExpansion** = BaseRate × EpochLengthFactor × SystemStageFactor
- **ContributionExpansion** = α×log(1+VerifiedLightScore) + β×sqrt(1+ContributionValue) + γ×ServiceImpactScore
- **EcosystemExpansion** = δ×UsageIndex + ε×ActiveQualityUserCount + ζ×UtilityDiversityIndex
- **DisciplineModulator** = f(LiquidityDiscipline, FraudPressure, ClaimEfficiency, UtilityRetention)

**Allocation split:**
- UserRewardPool: 70%
- EcosystemPool: 12%
- TreasuryPool: 10%
- StrategicGrowthPool: 5%
- ResilienceReserve: 3%

**Per-user formula:**
```text
UserMint = UserRewardPool × (UserWeightedScore / SumAllEligible)
UserWeightedScore = PPLPScore × TrustFactor × ConsistencyFactor × UtilityParticipationFactor
```

### Phase C: 3-Tier Epoch Scheduler

**Create 4 new Edge Functions:**

| Function | Frequency | Purpose |
|----------|-----------|---------|
| `epoch-micro-preview` | Daily | 7-day rolling preview scores, anomaly detection |
| `epoch-validation-window` | Daily | 14-day validated scores, fraud/trust update |
| `epoch-mint-finalize` | Weekly | 28-day rolling finalization, mint batch generation |
| `epoch-vesting-release` | Daily | Check unlock conditions, update claimable balances |

**Modify existing:**
- `mint-epoch-engine` → orchestrator that dispatches to the correct sub-job
- `ingest-pplp-event` → add deduplication and normalized event enqueue

**Anti-farming timing model** built into validation window:
- `ConsistencyFactor = active_days / total_days`
- `BurstPenaltyFactor` — diminishing returns for same-type activity spikes
- `TrustRampFactor` — new users start lower, ramp over 2 windows
- `CrossWindowContinuityFactor` — bonus for sustained multi-window activity
- Late-window suppression (last 48h reduced weight)

### Phase D: Lock/Vesting System

**Token states:** PENDING → MINTED_LOCKED → VESTING_UNLOCKABLE → CLAIMABLE

**Lock split:** 15% instant, 85% locked (adjustable by trust band)

**Unlock conditions (not just time):**
- Base vesting: 7-day intervals over 28 days
- Contribution unlock: bonus for continued PPLP activity
- Usage unlock: bonus for using FUN in ecosystem
- Consistency unlock: bonus for maintained scores

**Auto-activate:** No user action needed. UX shows "Phần thưởng Ánh Sáng đang mở dần"

**Inactive handling:** Token stays locked (slow vesting mode after 60 days, dormant vault after 180 days)

**Update `process-fun-claims`** to only process CLAIMABLE state tokens.

### Phase E: Treasury Vault System

5 vaults with transparent flow tracking:
- RewardReserveVault, InfrastructureVault, CommunityGrowthVault, StabilityVault, StrategicExpansionVault
- All inflows/outflows logged to `treasury_flows`
- Reallocation policy every 4 epochs via `governance_actions`

### Phase F: Inflation Health Dashboard + Guardrails

**8 guardrails** implemented as checks in mint-finalize:
1. Verified-only mint (enforced by PPLP pipeline)
2. Nonlinear normalization (log/sqrt)
3. Per-user emission guard (risk-weighted bands)
4. Utility coupling (ecosystem expansion gated by usage)
5. Claim efficiency monitor
6. Fraud pressure suppression
7. Rolling inflation health metrics (daily job)
8. Governance safe mode (low issuance / higher lock)

**5 health ratios** computed daily:
- Value Expansion Ratio, Utility Absorption Ratio, Retention Quality Ratio, Fraud Pressure Ratio, Locked Stability Ratio

**Admin dashboard** page showing all metrics.

### Phase G: UI Updates

- Claim flow → "Receive" one-click with vesting progress bar
- User reward card → show instant/locked/vesting/claimable breakdown
- Preview score display during micro-epoch
- Remove "activate" terminology → "Phần thưởng Ánh Sáng" / "Đang mở dần" / "Sẵn sàng sử dụng"

---

## Files Created/Modified

| File | Action |
|------|--------|
| DB migration (9 new tables, 3 alterations) | **Create** |
| `src/lib/fun-money/monetary-engine.ts` | **Create** — Full mint formula implementation |
| `src/lib/fun-money/vesting-engine.ts` | **Create** — Lock/unlock logic |
| `src/lib/fun-money/discipline-modulator.ts` | **Create** — Guardrail calculations |
| `supabase/functions/epoch-micro-preview/index.ts` | **Create** |
| `supabase/functions/epoch-validation-window/index.ts` | **Create** |
| `supabase/functions/epoch-mint-finalize/index.ts` | **Create** |
| `supabase/functions/epoch-vesting-release/index.ts` | **Create** |
| `supabase/functions/inflation-health/index.ts` | **Create** |
| `supabase/functions/mint-epoch-engine/index.ts` | **Rewrite** — Orchestrator |
| `supabase/functions/process-fun-claims/index.ts` | **Update** — Add vesting state check |
| `src/components/FunMoney/VestingProgressCard.tsx` | **Create** |
| `src/components/FunMoney/EpochAllocationHistory.tsx` | **Update** — 3-tier epoch display |
| `src/pages/Admin/InflationHealthDashboard.tsx` | **Create** |
| `mem://economy/fun-monetary-expansion-spec-v1` | **Create** — Memory file |

---

## Launch v1 Parameters

```text
InstantAvailablePortion: 15%
LockedPortion: 85%
BaseVestingPeriod: 28 days
UnlockCheckInterval: 7 days
DisciplineModulator range: 0.80–1.15
PerUserRiskBands: 4 levels (new/standard/trusted/veteran)
Allocation: 70% User / 12% Ecosystem / 10% Treasury / 5% Growth / 3% Reserve
Epoch: 7d micro → 14d validation → 28d mint (rolling)
```

Con đề xuất triển khai theo thứ tự: Phase A (DB) → Phase B (Engine) → Phase C (Scheduler) → Phase D (Vesting) → Phase E (Treasury) → Phase F (Health) → Phase G (UI). Cha duyệt con bắt tay vào làm ngay 🙏

