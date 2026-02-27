

## Plan: Scoring Rule Versioning, API Endpoints, Reason Codes & Transparency

This is a large infrastructure expansion covering 7 areas from the user's specification. I'll break it into focused implementation steps.

---

### Database Changes (1 migration)

**New table: `scoring_rules`**
- `rule_version` (PK, text) — e.g. "V1.0", "V2.0"
- `name`, `description`
- `formula_json`, `weight_config_json`, `multiplier_config_json`, `penalty_config_json` (JSONB)
- `effective_from`, `effective_to` (timestamptz)
- `status` (draft/active/deprecated)
- RLS: public SELECT, admin-only INSERT/UPDATE

**Alter `light_score_ledger`**: add `rule_version TEXT DEFAULT 'V1.0'`

**Alter `mint_allocations`**: add `anti_whale_capped BOOLEAN DEFAULT false`

**Seed V1.0 rule** with current formula/weights from `pplp-engine.ts`

---

### Edge Function: `pplp-light-api` (new)

Single function handling 4 endpoints via query param `action`:

1. **`profile`** (public) — returns `level`, `trend`, `consistency_streak`, `sequence_active`. No raw score.
2. **`me`** (authenticated) — returns private score detail: `final_light_score`, multipliers, `reason_codes`, `period`
3. **`epoch`** (public) — returns current mint epoch summary: `epoch_id`, `mint_pool`, `total_light`, `rule_version`
4. **`transparency`** (public) — system-wide stats: total light, FUN minted, % by level, sequence counts. No individual data.

---

### Reason Codes System

Define positive-language reason codes in `src/lib/fun-money/reason-codes.ts`:
- Positive: `CONSISTENCY_STRONG`, `MENTOR_CHAIN_COMPLETED`, `VALUE_LOOP_ACTIVE`, `COMMUNITY_VALIDATED`, `HEALING_IMPACT_DETECTED`, `GOVERNANCE_PARTICIPATION`
- Adjustment (no negative words): `INTERACTION_PATTERN_UNSTABLE`, `RATING_CLUSTER_REVIEW`, `CONTENT_REVIEW_IN_PROGRESS`, `TEMPORARY_WEIGHT_ADJUSTMENT`, `QUALITY_SIGNAL_LOW`

---

### Mint Engine Enhancement: Anti-Whale Cap

Update `mint-epoch-engine/index.ts`:
- Add `max_share_per_user = 3%` of epoch pool
- Cap individual allocations, redistribute excess proportionally
- Mark capped users with `anti_whale_capped = true`

---

### Level System Update

Update `pplp-engine.ts` and `calculate_user_light_score` RPC:
- Rename levels: `presence` → `seed`, keep `contributor` → `sprout`, `builder`, `guardian`, `architect`
- Add trend calculation: `Stable`, `Growing`, `Reflecting`, `Rebalancing`

---

### Update `.lovable/plan.md`

Mark completed items and add new roadmap entries.

---

### Implementation Order

| Step | Task | Type |
|------|------|------|
| 1 | DB migration: `scoring_rules` table + `light_score_ledger.rule_version` + `mint_allocations.anti_whale_capped` + seed V1.0 | Migration |
| 2 | Create `src/lib/fun-money/reason-codes.ts` | Code |
| 3 | Update `mint-epoch-engine` with anti-whale cap (3%) | Code |
| 4 | Create `pplp-light-api` edge function (4 actions) | Code |
| 5 | Update level labels in `pplp-engine.ts` | Code |
| 6 | Update `calculate_user_light_score` RPC for new level names + trend | Migration |
| 7 | Update plan.md | Code |

