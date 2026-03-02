

## Tính năng: Widget Tổng hợp Giao dịch Gửi/Nhận

Tạo widget tổng hợp cho user xem tổng giao dịch đã gửi và đã nhận, lọc theo token và thời gian -- tương tự giao diện FUN Profile.

### Thay đổi

#### 1. Cập nhật `src/hooks/useTransactionHistory.ts`
- Thêm `direction?: "all" | "sent" | "received"` và `"today"` vào `TransactionFilters` interface (line 55-65)
- Thêm logic filter direction trong phần Apply Filters (line 542-612): so sánh `sender_user_id` / `receiver_user_id` với `user.id`
- Thêm case `"today"` vào switch timeRange

#### 2. Tạo file mới `src/components/Transactions/TransactionSummaryWidget.tsx`
- **Props**: `transactions: UnifiedTransaction[]`, `currentUserId?: string`
- **State nội bộ riêng** (không ảnh hưởng filter chính):
  - `direction`: "both" | "sent" | "received" (3 tabs)
  - `tokenFilter`: "all" | "CAMLY" | "USDT" | "BNB" | "FUN" (5 nút)
  - `timeFilter`: "today" | "7d" | "30d" | "all" (4 nút)
- **Tính toán client-side** từ `transactions[]`:
  - Lọc theo direction: sent = `sender_user_id === currentUserId`, received = `receiver_user_id === currentUserId`
  - Lọc theo token (`token_symbol`) và thời gian (`created_at`)
  - Tính: tổng số giao dịch, tổng giá trị, breakdown theo token (khi chọn "Tất cả")
- **Giao diện**:
  - 3 tabs direction (toggle buttons với active highlight)
  - Hàng nút token (button group)
  - Hàng nút thời gian (button group)
  - Cards thống kê: Tổng GD, Tổng giá trị, GD lớn nhất

#### 3. Cập nhật `src/components/Transactions/index.ts`
- Export thêm `TransactionSummaryWidget`

#### 4. Tích hợp vào `src/components/Wallet/TransactionHistorySection.tsx`
- Thêm `TransactionSummaryWidget` sau `TransactionStats`, truyền `transactions` (allTransactions từ hook) và `user?.id`

### Chi tiết kỹ thuật

- Dữ liệu: Tái sử dụng `UnifiedTransaction[]` hiện có, không cần query DB mới
- Widget có state nội bộ riêng, không ảnh hưởng đến filter/danh sách giao dịch bên dưới
- Time filter "today": `created_at >= startOfToday()`
- Styling: Button group với `variant="default"` cho active, `variant="outline"` cho inactive, responsive mobile
- Breakdown theo token hiển thị khi chọn "Tất cả token": liệt kê từng token với số lượng và giá trị

