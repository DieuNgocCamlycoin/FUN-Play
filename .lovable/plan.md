

## Phân Tích Hệ Thống PPLP & Light Score — Hiện Trạng và Đề Xuất Test

### 1. Hệ thống hoạt động ra sao?

```text
┌──────────────────────────────────────────────────────────────────┐
│                    PPLP SCORING PIPELINE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Events (pplp_events)                                           │
│    ↓                                                            │
│  02:00 AM — build-features → features_user_day                  │
│    ↓                                                            │
│  02:30 AM — detect-sequences → sequences                        │
│    ↓                                                            │
│  Mỗi 4h — calculate_user_light_score()                          │
│    │                                                            │
│    ├── B = 0.4 × Action Base (posts×3, videos×5, comments×1.5)  │
│    ├── C = 0.6 × Content Score ((P_c/10)^1.3)                   │
│    ├── M_cons = 1 + 0.6(1 - e^(-streak/30))                    │
│    ├── M_seq  = 1 + 0.5 × tanh(Q/5)                            │
│    ├── Π      = 1 - min(0.5, 0.8 × risk)                       │
│    └── L = (0.4B + 0.6C) × M_cons × M_seq × Π × w_u           │
│    ↓                                                            │
│  Đầu tháng — mint-epoch-engine                                  │
│    ├── Pool: 5,000,000 FUN / tháng                              │
│    ├── Anti-whale: max 3% per user                              │
│    └── Redistribute dư thừa cho users khác                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Đánh giá: Đã chuẩn chỉnh chưa?

**Đã tốt:**
- LS-Math v1.0 triển khai đầy đủ 19 sections trong `light-score-math.ts`
- Config single source of truth tại `scoring-config-v1.ts` (epoch_type: monthly -- khớp)
- DB function `calculate_user_light_score` có fallback raw data, upsert ledger
- Anti-whale, anti-farm, integrity penalty hoạt động
- 4 test cases simulation đã pass (Spam, Drama, Silent Consistent, Rating Ring)
- PPLP Constitution v2.0 validation trước khi scoring
- Inactivity Decay (90 ngày grace, 0.1%/ngày, max 50%)

**Cần bổ sung test:**
- Chưa có unit test riêng cho `light-score-math.ts` (chỉ có simulation test)
- Chưa có test cho edge functions (mint-epoch-engine, ingest-pplp-event)
- Chưa có security/attack simulation tests

### 3. Kế hoạch: Bộ Test Toàn Diện + Mô Phỏng Tấn Công

**File mới: `src/lib/fun-money/__tests__/light-score-math.test.ts`**
- Unit test cho từng hàm: `reputationWeight`, `contentPillarScore`, `actionBaseScore`, `dailyLightScore`, `consistencyMultiplier`, `sequenceMultiplier`, `integrityPenalty`, `checkEligibility`, `calculateMintAllocations`, `coldStartFallback`
- Edge cases: score = 0, negative inputs, extreme values

**File mới: `src/lib/fun-money/__tests__/attack-simulation.test.ts`**
Mô phỏng 6 kịch bản tấn công hacker:

1. **Sybil Attack** — 100 tài khoản giả, mỗi account có light score thấp, cố gắng chiếm pool
   - Kiểm tra: anti-whale cap 3% + eligibility gate chặn accounts có risk > 0.4

2. **Rating Ring Collusion** — 10 users chấm chéo cho nhau điểm tối đa
   - Kiểm tra: integrity penalty giảm 50% khi risk = 0.625

3. **Score Inflation via Spam** — 1000 bài post chất lượng thấp trong 1 ngày
   - Kiểm tra: exponent γ=1.3 crush điểm thấp, (2/10)^1.3 ≈ 0.148

4. **Whale Monopoly** — 1 user có light score = 50,000, cố lấy hết pool
   - Kiểm tra: anti-whale cap giới hạn 3% = 150,000 FUN max, redistribution hoạt động

5. **Epoch Gaming** — User chỉ hoạt động 1 ngày cuối epoch rồi nghỉ
   - Kiểm tra: consistency multiplier thấp (streak=1 → M_cons ≈ 1.02), thua user bền vững

6. **Inactivity Exploit** — User cố tích trữ FUN, không hoạt động 200 ngày
   - Kiểm tra: decay 11% balance quay về community pool

**File mới: `src/lib/fun-money/__tests__/pplp-engine.test.ts`**
- Test `scoreAction` pipeline end-to-end
- Test PPLP validation rejection
- Test BigInt mint amount calculations
- Test format/parse FUN amounts

Tổng cộng: **~50-60 test cases** bao phủ logic scoring, bảo mật, và edge cases.

### 4. Kết quả mong đợi

Sau khi chạy `npx vitest`, developer có thể xác nhận:
- Mọi công thức LS-Math v1.0 tính đúng
- Hacker không thể trục lợi qua spam, sybil, rating ring, hay whale monopoly
- Anti-whale redistribution phân bổ công bằng
- Inactivity decay bảo vệ khỏi tích trữ
- PPLP Constitution v2.0 chặn đúng hành vi không hợp lệ

