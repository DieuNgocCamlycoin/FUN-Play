

# Kế hoạch: Nâng cấp Light Score & FUN Money theo tài liệu PPLP bổ sung

## Tổng quan phân tích

### So sánh Hiện tại vs Tài liệu mới

| Khía cạnh | Hiện tại | Tài liệu yêu cầu | Trạng thái |
|---|---|---|---|
| Công thức Light Score | 5 pillars x weights (fixed) | 5 pillars x Reputation Weight x Consistency Multiplier x Sequence Multiplier - Integrity Penalty | CẦN CẬP NHẬT |
| Reputation Weight | Chưa có | Weight dựa trên thời gian, lịch sử, hành vi | CẦN THÊM |
| Consistency Multiplier | Chưa có | 1 bài = x1.0, 30 ngày ổn định = x1.3, 90 ngày = x1.6 | CẦN THÊM |
| Sequence Multiplier | Đã lên kế hoạch (plan trước) | Chuỗi hành động nhân hệ số | ĐANG TRIỂN KHAI |
| Integrity Penalty | Có (suspicious_score) | Spam, đánh giá chéo, farm -> giảm điểm chậm | DA CO |
| Hiển thị điểm công khai | Hiển thị số cụ thể | Chỉ hiện Light Level (Presence/Growing/Builder/Guardian) | CẦN SỬA UI |
| Bảng xếp hạng | Có Top Earners/Creators | Không Top 1-2, chỉ xu hướng cá nhân | CẦN SỬA UI |
| FUN Mint Flow | Mint ngay theo activity count | Mint theo chu kỳ + Mint Pool tỷ lệ | GHI NHO TUONG LAI |
| 8 Câu Thần Chú | Chưa có | Xác nhận 8 câu thần chú PPLP | GHI NHO TUONG LAI |

---

## Thay đổi sẽ triển khai ngay

### 1. Thêm Reputation Weight vào RPC `calculate_user_light_score`

Tính dựa trên dữ liệu đã có:
- Thời gian đóng góp (account age): 0.6 -> 1.0
- Lịch sử không vi phạm (suspicious_score = 0): +0.1
- Có video approved: +0.1
- Có donations/giving: +0.1

```text
reputation_weight = base_weight (by account_age)
  + 0.1 if no violations
  + 0.1 if has approved content
  + 0.1 if has given to community
Cap: 1.0 -> 1.3
```

### 2. Thêm Consistency Multiplier vào RPC

Tính từ `daily_reward_limits` (số ngày active liên tục):
- Dưới 7 ngày active: x1.0
- 7-29 ngày: x1.1
- 30-89 ngày: x1.3
- 90+ ngày: x1.6

```text
active_days = COUNT(DISTINCT date) FROM daily_reward_limits WHERE user_id = p_user_id
consistency_multiplier = CASE
  WHEN active_days >= 90 THEN 1.6
  WHEN active_days >= 30 THEN 1.3
  WHEN active_days >= 7 THEN 1.1
  ELSE 1.0
END
```

### 3. Cập nhật công thức Light Score trong SQL function

```text
-- Công thức mới (theo tài liệu):
raw_score = (truth + trust + service + healing + community + pplp_bonus + sequence_bonus)

-- Áp dụng multipliers
weighted_score = raw_score
  * reputation_weight     -- 0.6 -> 1.3
  * consistency_multiplier -- 1.0 -> 1.6

-- Trừ penalty
final_score = weighted_score - integrity_penalty

-- Cap 0-100
```

### 4. Cập nhật UI: Ẩn điểm chi tiết công khai

Theo tài liệu: "Người khác không thấy bạn được bao nhiêu điểm chính xác"

- Trang Channel (profile công khai): Chỉ hiển thị Light Level label, KHÔNG hiện số điểm
- Trang FUN Money (cá nhân): Vẫn hiển thị đầy đủ pillars + số điểm (chỉ bản thân xem)

Light Level labels:
- "Light Presence" (0-25)
- "Light Growing" (26-50)
- "Light Builder" (51-70)
- "Light Guardian" (71-85)
- "Light Architect" (86-100)

### 5. Cập nhật `useLightActivity.ts`

- Thêm `consistencyMultiplier` và `reputationWeight` vào `LightActivity` interface
- Áp dụng multipliers vào client-side pillar calculation
- Thêm `lightLevel` string field

### 6. Cập nhật `LightActivityBreakdown.tsx`

- Thêm section hiển thị Reputation Weight và Consistency Multiplier
- Thêm Light Level badge nổi bật
- Thêm xu hướng tăng trưởng (growth trend) thay vì ranking

---

## Chi tiết kỹ thuật

### Migration SQL

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS light_level TEXT DEFAULT 'presence';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consistency_days INTEGER DEFAULT 0;
```

### Cập nhật RPC function `calculate_user_light_score`

Thêm vào function hiện tại:
1. Query `daily_reward_limits` đếm distinct dates -> consistency_days
2. Tính reputation_weight từ account_age + violations + content
3. Tính consistency_multiplier từ consistency_days
4. Áp dụng: `final = raw * rep_weight * consist_mult - penalty`
5. Tính light_level và UPDATE vào profiles

### Cập nhật `pplp-engine.ts`

Thêm functions:
- `calculateReputationWeight(accountAgeDays, suspiciousScore, hasApprovedContent, hasDonations)`
- `calculateConsistencyMultiplier(activeDays)`

### Cập nhật Channel.tsx

Thay thế hiển thị `light_score` số thành Light Level badge.

---

## Thứ tự triển khai

1. Migration: Thêm cột `light_level`, `consistency_days`
2. RPC: Viết lại `calculate_user_light_score` với multipliers mới
3. Engine: Cập nhật `pplp-engine.ts` thêm reputation + consistency functions
4. Hook: Cập nhật `useLightActivity.ts` với fields mới
5. UI: Cập nhật `LightActivityBreakdown.tsx` + `Channel.tsx`
6. Recalculate: Trigger batch tính lại cho tất cả users

---

## Ghi nhớ cho tương lai (CHƯA triển khai)

| Tính năng | Ghi chú |
|---|---|
| Mint Pool theo chu kỳ (tuần/tháng) | Cần thiết kế Mint Pool engine, phân bổ tỷ lệ, cron job hàng tuần |
| 8 Câu Thần Chú PPLP | Cần UI flow xác nhận, bảng `pplp_mantras_confirmed` |
| Cam kết 5 lời hứa cộng đồng | Cần UI + bảng tracking |
| Light Check-in hàng ngày | Cần UI widget + bảng `daily_checkins` |
| Không hiển thị bảng xếp hạng cạnh tranh | Cần redesign trang Admin stats + public ranking |
| Staking CAMLY tăng Reputation Weight | Chưa có smart contract staking |
| Cross-platform contribution score | Chưa có FUN Academy, FUN Earth, FUN Legal |
| AI phát hiện spam cảm xúc giả | Cần tích hợp AI layer riêng |

