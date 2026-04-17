---
name: PPLP v2.5 Migration
description: Mint pipeline migrated from v2.0 to v2.5 VVU formula with live trust + SBT bonuses on fun.rich
type: feature
---

## Active Engine: PPLP v2.5 (16Apr2026)

**Core formula**: `VVU = BaseValue × Quality × Trust × IIS × IM × AAF × ERP`
- VVU output is converted to FUN via `VVU_TO_FUN_RATE = 0.5` (1 VVU = 0.5 FUN)
- Per-request cap: `MAX_FUN_PER_REQUEST = 5000` (anti-whale)
- Min mint: `MIN_FUN_AMOUNT = 0.01`

## Wiring (active production paths)

1. **`src/lib/fun-money/pplp-v25-adapter.ts`** — `runV25MintAdapter({ userId, actionType, walletAddress, evidence })`
   - Fetches profile + `features_user_day` + live trust (via `runPPLPv25PipelineWithLiveTrust`)
   - Maps legacy action types (WATCH_VIDEO/LIKE_VIDEO/COMMENT/SHARE/UPLOAD_VIDEO/CREATE_POST) → v2.5 codes
   - Returns `{ vvu, funAmount, funAmountAtomic, decision, metadata }`
2. **`useAutoMintFun`** — calls adapter then `supabase.functions.invoke('pplp-mint-fun', ...)` with `engine_version: 'pplp-v2.5'`
3. **`useFunMoneyMintRequest.submitRequest`** — defaults to v2.5 (set `useV25: false` to fall back to v2.0)
4. **`useAutoMintRequest.submitAutoRequest`** — still on v2.0 (legacy LIGHT_ACTIVITY flow); migrate later if needed

## Edge function `pplp-mint-fun`

Now accepts `vvu_score`, `engine_version`, `metadata`. Decision `REVIEW_HOLD` → status `pending_review`.

## DB schema additions

`pplp_mint_requests` gained: `metadata jsonb`, `vvu_score numeric`, `engine_version text` (default `pplp-v2.0`).

## Decision logic (adapter)

- `funAmount < MIN_FUN_AMOUNT` → REJECT (`AMOUNT_BELOW_MIN`)
- `sybil_risk >= 60` → REJECT (`SYBIL_RISK_BLOCKED`)
- `sybil_risk >= 40` → REVIEW_HOLD (`SYBIL_RISK_REVIEW`)
- `aaf < 0.3` → REVIEW_HOLD (`AAF_LOW`)

## Trust gating still applies

Edge fn still enforces:
- T0/T1 sandbox cap (max 100 FUN/request)
- `sybil_risk >= 60` → 403
- per-platform daily cap (2 req/day fun_main)
- 20M FUN/month cross-platform epoch cap

## Tests

`src/lib/fun-money/__tests__/pplp-v25-adapter.test.ts` covers action mapping, VVU→FUN rate, audit metadata.
