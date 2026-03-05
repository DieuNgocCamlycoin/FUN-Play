

## Báo Cáo Kiểm Tra 6 Lớp Bảo Mật — PPLP & Light Score Mint System

### Tóm tắt: 5/6 lớp CHUẨN, 1 lớp cần cải thiện nhẹ

---

### Lớp 1: Chống Gian Lận (Sybil-resistance) — ✅ CHUẨN

| Cơ chế | Trạng thái | Chi tiết |
|--------|-----------|----------|
| Anti-whale cap 3% | ✅ | `calculateMintAllocations` + mint-epoch-engine đều enforce |
| Eligibility gate (risk > 0.4 → block) | ✅ | `checkEligibility` chặn `INTEGRITY_GATE_EXCEEDED` |
| Integrity penalty Π = 1 - min(0.5, 0.8×risk) | ✅ | Max giảm 50% score |
| IP cluster detection | ✅ | `get_ip_abuse_clusters` DB function |
| Anti-farm signals table | ✅ | `signals_anti_farm` kiểm tra trong mint-epoch-engine |
| PPLP v2.0 validation (5 điều kiện) | ✅ | `validatePPLP` chặn trước scoring |
| Ingest dedup (minute-bucket hash) | ✅ | `ingest_hash` UNIQUE constraint |
| Daily mint cap (2 requests/day) | ✅ | `pplp-mint-fun` edge function |
| **118/118 attack simulation tests passed** | ✅ | Sybil, Rating Ring, Spam, Whale, Epoch Gaming, Inactivity |

---

### Lớp 2: Tính Đúng & Nhất Quán — ✅ CHUẨN

| Cơ chế | Trạng thái |
|--------|-----------|
| LS-Math v1.0 single source of truth (`scoring-config-v1.ts`) | ✅ |
| DB function `calculate_user_light_score` khớp TS math | ✅ |
| `GREATEST(aggregated, raw)` fallback trong DB | ✅ |
| Ledger upsert `ON CONFLICT (user_id, period, period_start)` | ✅ |
| Monthly epoch cycle nhất quán (config + engine + UI) | ✅ |
| Content pillar score `(P/10)^1.3` nhất quán cả TS và SQL | ✅ |
| Consistency multiplier `1 + 0.6(1 - e^{-S/30})` khớp | ✅ |
| 56 unit tests cho light-score-math.ts | ✅ |

---

### Lớp 3: Chống Thao Túng Dữ Liệu — ✅ CHUẨN

| Cơ chế | Trạng thái |
|--------|-----------|
| `pplp_events` append-only với `ingest_hash` UNIQUE | ✅ |
| Auth check trong `ingest-pplp-event` (Bearer JWT → `getClaims`) | ✅ |
| `actor_user_id` lấy từ JWT, KHÔNG từ client input | ✅ |
| Service role key chỉ dùng server-side | ✅ |
| DB triggers (`auto_ingest_pplp_event`) xử lý server-side | ✅ |
| Source tracking: `web`, `db_trigger`, `backfill` | ✅ |
| Batch limit: 1-50 events/request | ✅ |
| Valid event types whitelist (26 types) | ✅ |
| Cold start fallback có φ_u trust factor capping [0.8, 1.1] | ✅ |

---

### Lớp 4: Kinh Tế Bền Vững — ✅ CHUẨN

| Cơ chế | Trạng thái |
|--------|-----------|
| Fixed pool: 5,000,000 FUN/tháng (không lạm phát) | ✅ |
| 4 Pool system: Community 40%, Platform 30%, Recycle 20%, Guardian 10% | ✅ |
| FUN không burn — chỉ đổi trạng thái (LOCKED → ACTIVATED → FLOWING → RECYCLE) | ✅ |
| Inactivity decay: 0.1%/ngày sau 90 ngày, cap 50% | ✅ |
| Anti-whale 3% cap với redistribution loop (max 10 iterations) | ✅ |
| Epoch mint cap on-chain (`epochMintCap = 1,000,000 FUN/day`) | ✅ |
| `FORBIDDEN_POOLS`: No Team Pool, No Investor Pool | ✅ |
| Q×I product capped at 10.0 | ✅ |
| Max mint per tx: 500,000 FUN | ✅ |

---

### Lớp 5: An Toàn Smart Contract — ✅ CHUẨN

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| Reentrancy | ✅ Safe | `_mint` → `_transfer` không có external calls |
| Access control | ✅ | `onlyGov` modifier, `guardianGov` immutable |
| Upgradeability | ✅ N/A | Contract không có proxy/upgrade pattern — immutable by design |
| Signature replay | ✅ Protected | Nonce tăng sau mỗi `lockWithPPLP`, EIP-712 domain binding |
| Integer overflow | ✅ | Solidity ^0.8.20 auto-revert on overflow |
| Duplicate sigs | ✅ | `seen[]` array check trong signature loop |
| Max signatures | ✅ | `MAX_SIGS = 5` |
| Epoch rate limit | ✅ | `epochMintCap` + `epochDuration` trên chain |
| Community pool immutable | ✅ | `communityPool` là `immutable` |
| Pause mechanism | ✅ | `govPauseTransitions` |
| Excess recycle | ✅ | `govRecycleExcessToCommunity` only from contract balance |

**Phát hiện nhỏ:** `getContractAddress()` cho phép đọc từ `localStorage` — đây là design choice cho dev/testing, nhưng trên production nên hardcode. Hiện tại KHÔNG ảnh hưởng bảo mật vì contract address chỉ dùng client-side và mọi validation diễn ra on-chain.

---

### Lớp 6: Vận Hành An Toàn — ⚠️ CẦN CẢI THIỆN NHẸ

| Cơ chế | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Multisig 3-of-3 (WILL + WISDOM + LOVE) | ✅ | App-level enforcement |
| GOV Attesters quản lý qua DB + fallback config | ✅ | |
| Pause contract | ✅ | `govPauseTransitions` |
| Ban user + blacklist wallet | ✅ | `ban_user_permanently` |
| Wallet change cooldown 30 ngày | ✅ | |
| Claim freeze 72h sau đổi ví | ✅ | |
| IP tracking + abuse clusters | ✅ | |
| **Timelock cho governance** | ⚠️ Chưa có | `guardianGov` có quyền tức thời, chưa có timelock delay |
| **On-chain multisig cho GOV** | ⚠️ Chưa có | GOV multisig chỉ ở app-level, on-chain chỉ cần 1 GOV wallet |
| **Monitoring/alerting** | ⚠️ Cơ bản | Có admin dashboard nhưng chưa có real-time alerting cho anomalies |

---

### Kết Luận

Hệ thống PPLP + Light Score + FUN Money mint đã **chuẩn chỉnh ở 5/6 lớp**. Lớp 6 (Ops/Governance) hoạt động tốt ở tầng application nhưng có thể cải thiện bằng:

1. **Timelock contract** cho governance actions (thêm delay 24-48h trước khi thay đổi attester/pause có hiệu lực)
2. **On-chain multisig** cho guardianGov (hiện tại là single EOA)
3. **Real-time alerting** khi phát hiện anomaly (spike mint requests, unusual IP patterns)

Những cải thiện này thuộc về **mainnet readiness** — với BSC Testnet hiện tại, hệ thống đã đủ an toàn để vận hành.

