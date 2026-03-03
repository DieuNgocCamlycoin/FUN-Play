

## Kế hoạch: Bảng Giải trình Light Score hàng ngày (LS-Math v1.0)

### Mục tiêu
Tạo component hiển thị chi tiết Light Score theo ngày cho mỗi user, tương tự screenshot: ngày, B (action base), C (content score), L (final light score), và các multipliers (M_cons, M_seq, Π, w).

### Nguồn dữ liệu

Đã có sẵn 2 bảng:
- **`light_score_ledger`**: `base_score`, `final_light_score`, `consistency_multiplier`, `sequence_multiplier`, `integrity_penalty`, `reputation_weight`, `level`, `period`, `period_start` — RLS cho phép user đọc dữ liệu của mình
- **`features_user_day`**: `count_posts`, `count_videos`, `count_comments`, `content_pillar_score`, `consistency_streak`, `sequence_count`, `anti_farm_risk` — cần kiểm tra RLS

### Thay đổi kỹ thuật

#### 1. Kiểm tra/thêm RLS cho `features_user_day`
- Đảm bảo user có thể SELECT dữ liệu của mình từ `features_user_day` (cần cho cột B, C chi tiết)

#### 2. Tạo component `DailyLightScoreTable.tsx`
- Fetch từ `light_score_ledger` (period = 'day') + `features_user_day` cho user hiện tại, 30 ngày gần nhất
- Hiển thị bảng mỗi dòng là 1 ngày:
  - **Ngày** (yyyy-MM-dd)
  - **B** (action base score từ features_user_day hoặc tính từ ledger)
  - **C** (content_pillar_score)
  - **L** (final_light_score) — highlight màu
  - Dòng phụ: `M_cons: ×1.46 | M_seq: ×1.50 | Π: 0.00 | w: 1.97`
- Header hiển thị điều kiện mint (đủ/chưa đủ) + light level
- Collapsible accordion style

#### 3. Tích hợp vào FunMoneyPage
- Đặt trong tab "Chi Tiết" (`breakdown`), bên dưới `LightActivityBreakdown` và `ActivitySummary`
- Hoặc tạo riêng 1 section full-width bên dưới grid 2 cột hiện tại

#### 4. Tạo hook `useDailyLightScore.ts`
- Fetch `light_score_ledger` WHERE `user_id = auth.uid()` AND `period = 'day'` ORDER BY `period_start DESC` LIMIT 30
- Join với `features_user_day` để lấy B, C chi tiết
- Return array `{ date, B, C, L, mCons, mSeq, penalty, w }`

### Files tạo/sửa
- **Tạo**: `src/hooks/useDailyLightScore.ts`
- **Tạo**: `src/components/FunMoney/DailyLightScoreTable.tsx`
- **Sửa**: `src/pages/FunMoneyPage.tsx` — import và render component mới trong tab breakdown
- **Sửa**: `src/components/FunMoney/index.ts` — export component mới
- **Migration** (nếu cần): thêm RLS policy cho `features_user_day` SELECT

