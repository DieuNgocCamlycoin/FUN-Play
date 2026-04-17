---
name: PPLP v2.5 Nice-to-haves Wave 1
description: Stability Index + Phase auto-switch + Admin parameter tuning UI shipped on top of PPLP v2.5
type: feature
---

## Wave 1 (Apr 17, 2026)

### Stability Index
- DB: `stability_snapshots` (user_id, snapshot_date, stability_index 0.5-1.2, variance, std_dev, mean_ls_30d)
- SQL: `compute_stability_index(_user_id)` reads last 30d `light_score_ledger`, returns 1.0 if <3 data points, else CV-based clamp
- Lib: `src/lib/fun-money/stability-index.ts` (`getStabilityIndex`, `recomputeStabilityIndex`, `getStabilityHistory`)
- UI: `src/components/FunMoney/StabilityIndexCard.tsx` (recharts line + recompute button)
- Wired into `runV25MintAdapter`: `adjustedVvu = rawVvu × stability × phase_mul`. metadata stores `stability_index`, `raw_vvu`

### Phase auto-switch
- DB: `system_phase_state` (current_phase, previous_phase, kpi_snapshot, is_current, auto_switch_enabled)
- SQL: `evaluate_phase_switch()` thresholds: early→growth (DAU≥1k+mint≥1M+users≥5k); growth→mature (DAU≥10k+mint≥50M+users≥50k)
- Lib: `src/lib/fun-money/system-phase.ts` (`getCurrentPhase` 5min cache, `getCurrentPhaseWeights`, `getPhaseHistory`)
- UI: `src/components/admin/PhaseControlPanel.tsx` (toggle auto, manual evaluate, history)
- Phase multiplier in adapter: early=1.0, growth=0.85, mature=0.7

### Admin parameter tuning
- DB: `parameter_overrides` (param_type, param_key, override_min/max/default, reason, expires_at) + `parameter_change_log` (auto-trigger)
- Lib: `src/lib/fun-money/parameter-overrides.ts` (60s cache, `loadOverrides`, `applyOverride`)
- UI: `src/components/admin/ParameterTuningEditor.tsx` (CRUD dialog + audit log tab)
- RLS: Owner+Admin write, public read

### Skipped
- A/B test (per user request)

### Mount points (TODO for next session)
- Mount `<ParameterTuningEditor />` + `<PhaseControlPanel />` in admin dashboard
- Mount `<StabilityIndexCard />` in user FUN Money page
- Optional cron for daily `compute_stability_index` per user (not wired yet — currently on-demand via adapter)
