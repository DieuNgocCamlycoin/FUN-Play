

## Thêm 3 tính năng mới trên trang Mint FUN

### Tổng quan

Tạo 3 component mới và tích hợp vào `FunMoneyPage.tsx`, đồng thời thêm `MintNotificationBanner` vào các trang Earn-related.

### 1. MintFlowGuide — Hướng dẫn trực quan 5 bước

**File mới:** `src/components/FunMoney/MintFlowGuide.tsx`

- Hiển thị 5 bước theo timeline ngang (hoặc dọc trên mobile):
  1. **Hành động** — Xem, like, comment, upload trên nền tảng
  2. **Tích lũy Light Score** — Hệ thống tự động tính điểm rolling 30 ngày
  3. **Phân bổ theo Epoch** — Cuối tháng, hệ thống phân bổ FUN từ pool 5M
  4. **Ký duyệt (Admin)** — Admin review & ký giao dịch on-chain
  5. **Nhận FUN về ví** — User claim FUN token (ERC-20) vào ví BSC

- Mỗi bước có icon, tên, mô tả ngắn, và đường nối (connector line) giữa các bước
- Dùng gradient color giống theme hiện tại (cyan → purple → pink)
- Đặt ngay sau PPLP Charter / trước MintableCard

### 2. ClaimFUNButton — Nút Claim FUN thông minh

**File mới:** `src/components/FunMoney/ClaimFUNButton.tsx`

- Query `mint_allocations` joined `mint_epochs` để lấy tổng FUN đã phân bổ cho user
- Phân loại trạng thái:
  - **Chưa có phân bổ** → hiển thị "Chưa có FUN" (disabled)
  - **Có phân bổ, chưa claim** → hiển thị số FUN + nút "Yêu cầu Claim"
  - **Đang pending claim** → Badge "Đang xử lý"
  - **Đã mint on-chain** → Badge "Đã nhận" + link tx_hash
- Khi bấm Claim → insert vào `claim_requests` table
- Đặt ngay cạnh/sau MintableCard hoặc thay thế ActivateClaimPanel hiện tại

### 3. MintNotificationBanner — Banner thông báo FUN mới

**File mới:** `src/components/FunMoney/MintNotificationBanner.tsx`

- Query `mint_allocations` where `created_at >= now() - 7 days` và `allocation_amount > 0`
- Nếu có → hiển thị banner gradient nổi bật: "🎉 Bạn có X FUN mới được phân bổ trong tháng Y!"
- Có nút dismiss (lưu vào localStorage)
- Có nút "Xem chi tiết" → navigate đến `/fun-money` tab history

**Tích hợp:**
- Hiển thị trên `FunMoneyPage.tsx` (trước MintableCard)
- Hiển thị trên `RewardHistory.tsx` (trang Earn) ở đầu trang

### 4. Cập nhật index & page

**File sửa:** `src/components/FunMoney/index.ts` — export 3 component mới

**File sửa:** `src/pages/FunMoneyPage.tsx`:
- Import 3 component
- Thêm `MintNotificationBanner` sau header
- Thêm `MintFlowGuide` trong tab Overview (thay/bổ sung card "Quy Trình Mới")
- Thêm `ClaimFUNButton` sau MintableCard

**File sửa:** `src/pages/RewardHistory.tsx` — thêm `MintNotificationBanner` ở đầu

### Technical Details

- Tất cả query dùng `supabase` client từ `@/integrations/supabase/client`
- Auth từ `useAuth()` hook
- Styling theo pattern hiện có: Card, Badge, gradient colors, lucide icons
- Responsive: grid cols thay đổi theo breakpoint (sm/md/lg)
- localStorage key cho dismiss: `fun_mint_notification_dismissed_{epoch_id}`

