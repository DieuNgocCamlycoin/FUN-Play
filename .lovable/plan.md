

## Kiểm tra toàn diện hệ thống Mint FUN Money — Báo cáo & Kế hoạch khắc phục

### Tổng quan

Hệ thống FUN Money Mint gồm: **pplp-engine.ts** (scoring), **constitution.ts** (PPLP v2.0 validation), **useLightActivity.ts** (tính mintable FUN), **useFunMoneyMintRequest.ts** (submit request), **MintableCard.tsx** (UI), **scoring-config-v1.ts** (config), **pool-system.ts** (4 pools + decay), cùng backend functions (calculate_user_light_score, get_fun_money_system_stats).

---

### Bảng đánh giá đối chiếu với tài liệu

```text
┌─────────────────────────────────────┬─────────┬──────────────────────────────────────────┐
│ Tiêu chí (theo tài liệu)           │ Trạng thái │ Chi tiết                              │
├─────────────────────────────────────┼─────────┼──────────────────────────────────────────┤
│ LS-Math v1.0 scoring formula        │  ✅     │ Đúng: L = (0.4B + 0.6C) × M_cons ×     │
│                                     │         │ M_seq × Π × w                           │
│ PPLP v2.0 — 5 điều kiện bắt buộc   │  ✅     │ validatePPLP() check đủ 5 flags         │
│ Base Rewards FUN_PLAY               │  ✅     │ Đúng: VIEW=10, LIKE=5, COMMENT=15...    │
│ Constitution v2.0 lifecycle         │  ✅     │ 4 trạng thái LOCKED/ACTIVATED/FLOWING/  │
│                                     │         │ RECYCLE đã implement                     │
│ Anti-whale cap 3%                   │  ✅     │ scoring-config-v1: cap=0.03,             │
│                                     │         │ light-score-math.ts redistribution loop  │
│ Monthly epoch                       │  ✅     │ epoch_type: 'monthly', DB fn dùng       │
│                                     │         │ date_trunc('month')                      │
│ Pool System 4-tier                  │  ✅     │ 40/30/20/10% đúng Whitepaper 5D         │
│ Inactivity Decay                    │  ✅     │ 90d grace, 0.1%/day, max 50%            │
│ Multisig 3/3 GOV                    │  ✅     │ WILL + WISDOM + LOVE, AttesterPanel +   │
│                                     │         │ AdminMintPanel                           │
│ No-Ego Policy                       │  ✅     │ Ẩn điểm thô, chỉ hiển thị Level+Trend  │
│ Cooldown 24h giữa các lần mint     │  ✅     │ MINT_COOLDOWN_HOURS = 24                │
│ Min 10 activities                   │  ✅     │ MIN_ACTIVITIES = 10                     │
│ Contract address                    │  ✅     │ 0x39A1b...F0CD6 BSC Testnet, đúng      │
│ Unified on-chain action FUN_REWARD  │  ✅     │ Đúng theo tài liệu                     │
├─────────────────────────────────────┼─────────┼──────────────────────────────────────────┤
│ PPLP Charter gate (pplp_accepted)   │  ❌     │ THIẾU: useLightActivity KHÔNG check     │
│                                     │         │ pplp_accepted_at trước khi cho mint     │
│ Min Light Score gating: MỚI vs CŨ  │  ⚠️     │ KHÔNG NHẤT QUÁN: Tài liệu = 10,        │
│                                     │         │ useLightActivity dùng 10 (đúng), nhưng  │
│                                     │         │ MintableCard tooltip nói "Cần 60",      │
│                                     │         │ pplp-engine THRESHOLDS.minLightScore=60  │
│ Level mapping KHÔNG NHẤT QUÁN       │  ❌     │ 3 bộ level khác nhau trong codebase     │
│ DEFAULT_MONTHLY_POOL 5M enforcement │  ⚠️     │ Config có nhưng không thấy enforce      │
│                                     │         │ trong client-side mint flow              │
└─────────────────────────────────────┴─────────┴──────────────────────────────────────────┘
```

---

### Chi tiết 4 vấn đề cần khắc phục

#### 1. THIẾU kiểm tra `pplp_accepted_at` trước khi cho mint (❌ Critical)

**Tài liệu yêu cầu:** Người dùng phải chấp nhận Hiến chương PPLP (`pplp_accepted_at IS NOT NULL`) trước khi được mint.

**Thực tế:** `useLightActivity.ts` fetch profile nhưng KHÔNG select `pplp_accepted_at` và KHÔNG kiểm tra điều kiện này. User chưa chấp nhận Charter vẫn thấy nút MINT NOW và có thể submit request.

**Sửa:** Thêm `pplp_accepted_at` vào select query profile, thêm gate check: nếu null → `canMint = false`, `mintBlockReason = 'Bạn cần chấp nhận Hiến chương PPLP trước'`.

**File:** `src/hooks/useLightActivity.ts`

#### 2. Level mapping KHÔNG NHẤT QUÁN giữa 3 nơi (❌ Medium)

3 bộ level khác nhau trong codebase:

| Nguồn | Levels |
|-------|--------|
| **Tài liệu (memory)** | Light Seed (0-99), Light Builder (100-249), Light Guardian (250-499), Light Leader (500-799), Cosmic Contributor (800+) |
| **pplp-engine.ts** (LIGHT_LEVELS) | seed, sprout, builder, guardian, architect (tên khác, không có Leader/Cosmic) |
| **scoring-config-v1.ts** (levels) | seed(0), sprout(50), builder(200), guardian(500), architect(1200) — ngưỡng khác |
| **light-score-pillars.ts** + **ClaimGuide.tsx** | Light Seed(0), Light Builder(100), Light Guardian(250), Light Leader(500), Cosmic Contributor(800) — **ĐÚNG tài liệu** |
| **DB function** calculate_user_light_score | seed(0-49), sprout(50-199), builder(200-499), guardian(500-1199), architect(1200+) — **KHÁC tài liệu** |

**Sửa:** Đồng bộ tất cả về chuẩn tài liệu mới nhất (5 levels trong light-score-pillars.ts). Cập nhật:
- `pplp-engine.ts` LIGHT_LEVELS → 5 levels đúng tên + ngưỡng
- `scoring-config-v1.ts` levels → thresholds 0/100/250/500/800
- DB function `calculate_user_light_score` → cập nhật level mapping

**Files:** `pplp-engine.ts`, `scoring-config-v1.ts`, DB migration

#### 3. MintableCard tooltip hiển thị sai ngưỡng Light Score (⚠️ Medium)

**Vấn đề:** `MintableCard.tsx` dòng 219 tooltip nói "Cần tối thiểu 60 để mint" và progress bar check `>= 60` (dòng 227, 234). Nhưng `useLightActivity.ts` dùng `MIN_LIGHT_SCORE = 10` (đúng tài liệu). `pplp-engine.ts` `THRESHOLDS.minLightScore = 60` dùng cho scoring decision (REJECT), không phải mint gating.

**Sửa:** Cập nhật MintableCard tooltip và progress bar check từ 60 → 10 để khớp với gating logic thực tế.

**File:** `src/components/FunMoney/MintableCard.tsx`

#### 4. `pplp-engine.ts` THRESHOLDS.minLightScore = 60 quá cao so với tài liệu (⚠️ Medium)

**Vấn đề:** `scoreAction()` dùng `THRESHOLDS.minLightScore = 60` để REJECT request. Nhưng Light Score client-side (calculated from pillars, 0-100 range) khác hoàn toàn với server-side Light Score (LS-Math, có thể hàng trăm/nghìn). Khi user có server LS = 50 (trên ngưỡng 10) nhưng pillar-derived LS = 45 (dưới 60) → `scoreAction` REJECT → user bị từ chối sai.

**Sửa:** Đổi `THRESHOLDS.minLightScore` từ 60 → 10 để khớp tài liệu, hoặc tách biệt rõ ràng 2 loại light score (pillar-based vs LS-Math) trong scoring pipeline.

**File:** `src/lib/fun-money/pplp-engine.ts`

---

### Kế hoạch thực hiện

| # | Task | Priority | Files |
|---|------|----------|-------|
| 1 | Thêm gate `pplp_accepted_at` vào useLightActivity | Critical | `useLightActivity.ts` |
| 2 | Đồng bộ THRESHOLDS.minLightScore → 10 | Medium | `pplp-engine.ts` |
| 3 | Sửa MintableCard tooltip/progress bar 60→10 | Medium | `MintableCard.tsx` |
| 4 | Đồng bộ level mapping (pplp-engine + scoring-config + DB) | Medium | `pplp-engine.ts`, `scoring-config-v1.ts`, DB migration |

Tổng: sửa **3 files frontend** + **1 DB migration** cho level mapping.

