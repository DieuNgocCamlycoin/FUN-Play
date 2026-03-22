

## Rà Soát Toàn Bộ Hệ Thống Tính Điểm User — Báo Cáo

### Kiến trúc tổng quan

Hệ thống tính điểm có **3 tầng song song**, mỗi tầng phục vụ mục đích khác:

```text
┌───────────────────────────────────────────────────────────────────┐
│ Tầng 1: LS-Math v1.0 (SERVER — DB function)                      │
│   calculate_user_light_score() → profiles.light_score             │
│   Công thức: L = (0.4B + 0.6C) × M_cons × M_seq × Π × w         │
│   → Dùng cho: Level assignment, eligibility, mint gating          │
│   → Chạy mỗi 4h (cron) hoặc manual trigger                      │
├───────────────────────────────────────────────────────────────────┤
│ Tầng 2: PPLP Engine (CLIENT — pplp-engine.ts)                    │
│   scoreAction() → tính FUN mint amount per action                 │
│   Công thức: Base × Q × I × K × Ux × (M_cons × M_seq × Π)       │
│   → Dùng cho: Tính mintable FUN, hiển thị breakdown              │
├───────────────────────────────────────────────────────────────────┤
│ Tầng 3: 5-Pillar Engine (CLIENT — light-score-pillar-engine.ts)  │
│   calculatePillarScores() → 5 sub-scores (0-100 each)            │
│   Công thức: Weighted sum 20% × 5 pillars - risk + streak        │
│   → Dùng cho: Radar chart hiển thị, Reputation NFT metadata      │
└───────────────────────────────────────────────────────────────────┘
```

### Bảng đánh giá chi tiết

```text
┌───────────────────────────────────┬────────┬─────────────────────────────────┐
│ Tiêu chí                          │ Status │ Chi tiết                        │
├───────────────────────────────────┼────────┼─────────────────────────────────┤
│ LS-Math công thức đúng (DB)       │  ✅    │ Khớp spec hoàn toàn             │
│ LS-Math công thức đúng (TS)       │  ✅    │ light-score-math.ts khớp DB     │
│ PPLP v2.0 validation              │  ✅    │ 5 điều kiện enforce trước mint  │
│ Charter gate (pplp_accepted_at)   │  ✅    │ Đã thêm trong useLightActivity  │
│ Min Light Score = 10              │  ✅    │ Đồng bộ DB + TS + UI            │
│ Cooldown 24h                      │  ✅    │ useLightActivity enforce        │
│ Anti-whale 3%                     │  ✅    │ calculateMintAllocations         │
│ Monthly epoch                     │  ✅    │ DB date_trunc('month')          │
│ Consistency M_cons formula        │  ✅    │ 1+0.6(1-e^{-S/30}) — cả 3 tầng │
│ Sequence M_seq formula            │  ✅    │ 1+0.5·tanh(Q/5) — khớp         │
│ Integrity Π formula               │  ✅    │ 1-min(0.5, 0.8×risk) — khớp    │
│ Reputation w formula              │  ✅    │ clip(0.5, 2, 1+0.25·ln(1+R))   │
│ Content h(P_c) = (P/10)^1.3      │  ✅    │ DB + TS + features_user_day     │
│ Cold start fallback               │  ✅    │ μ_topic × φ_u clipped [0.8,1.1] │
│ Raw fallback GREATEST()           │  ✅    │ DB function handles correctly   │
│ Ledger upsert                     │  ✅    │ ON CONFLICT works               │
│ 5-Pillar scoring (Whitepaper)     │  ✅    │ Extends, not replaces LS-Math   │
├───────────────────────────────────┼────────┼─────────────────────────────────┤
│ Level thresholds light-score-math │  ❌    │ CŨ: seed/sprout/builder/        │
│                                   │        │ guardian/architect               │
│                                   │        │ (0/50/200/500/1200)             │
│ Level thresholds useLightActivity │  ⚠️    │ Lấy level từ server (đúng)      │
│                                   │        │ nhưng client pillar-based score  │
│                                   │        │ dùng thang 0-100 khác server    │
│ light-score-math.ts KHÔNG import  │  ⚠️    │ scoring-config-v1.ts — 2 nguồn  │
│ scoring-config-v1.ts              │        │ config song song, dễ lệch       │
└───────────────────────────────────┴────────┴─────────────────────────────────┘
```

### 2 vấn đề cần khắc phục

#### 1. `light-score-math.ts` level thresholds CHƯA đồng bộ (❌ Medium)

**File `light-score-math.ts` dòng 44-50** vẫn dùng bộ level cũ:
- seed: 0, sprout: 50, builder: 200, guardian: 500, architect: 1200

Trong khi **DB function**, **pplp-engine.ts**, **scoring-config-v1.ts**, **light-score-pillars.ts** đều đã cập nhật:
- seed: 0, builder: 100, guardian: 250, leader: 500, cosmic: 800

Hàm `determineLevel()` trong light-score-math.ts (dòng 404-411) trả ra level sai nếu ai gọi nó. Hiện tại hàm này **không được gọi trực tiếp trong production flow** (DB function tự tính level), nhưng nó được dùng trong `generateExplanation()` và các test — tạo ra kết quả sai trong audit/explainability.

**Sửa:** Cập nhật `LS_PARAMS.level_thresholds` và `determineLevel()` trong `light-score-math.ts` cho khớp.

#### 2. `light-score-math.ts` config trùng lặp với `scoring-config-v1.ts` (⚠️ Low)

Cả hai file đều định nghĩa cùng tham số (gamma, beta, lambda, eta, kappa, theta, cap...) nhưng **không import nhau**. Hiện tại giá trị khớp, nhưng nếu sửa 1 file mà quên file kia → lệch.

**Sửa:** Cho `light-score-math.ts` import từ `scoring-config-v1.ts` thay vì khai báo `LS_PARAMS` riêng. Hoặc tối thiểu — đồng bộ level thresholds.

---

### Kế hoạch thực hiện

| # | Task | Priority | File |
|---|------|----------|------|
| 1 | Đồng bộ level thresholds trong light-score-math.ts | Medium | `light-score-math.ts` |
| 2 | Refactor LS_PARAMS import từ scoring-config-v1 (optional) | Low | `light-score-math.ts` |

**Kết luận:** Hệ thống tính điểm **hoạt động đúng trên production flow** (DB function là nguồn chính, client lấy kết quả từ server). Chỉ còn 1 file `light-score-math.ts` có level thresholds cũ cần đồng bộ — ảnh hưởng chủ yếu đến explainability/test, không ảnh hưởng scoring thực tế.

