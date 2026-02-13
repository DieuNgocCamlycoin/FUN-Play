

# Trang Lịch Sử Giao Dịch: Mobile + Chi Tiết Hoạt Động Thời Gian Thực

## Vấn đề hiện tại

1. **Mobile Drawer thiếu link**: Mục "Lịch Sử Giao Dịch" chưa có trong menu di động (MobileDrawer), chỉ có trên desktop Sidebar.
2. **Giao diện chưa tối ưu cho mobile**: Header, bộ lọc, và thẻ giao dịch chưa responsive tốt trên màn hình nhỏ.
3. **Thiếu thống kê hoạt động chi tiết**: Chưa hiển thị số lượt like, xem video, bình luận, chia sẻ, upload, đăng ký theo thời gian thực của từng user.

## Kế hoạch thực hiện

### Bước 1: Thêm link Lịch Sử Giao Dịch vào Mobile Drawer

**Tệp**: `src/components/Layout/MobileDrawer.tsx`

- Thêm mục `{ icon: Globe, label: "Lịch Sử Giao Dịch", href: "/transactions" }` vào mảng `rewardItems` (ngay sau "Lịch Sử Phần Thưởng")
- Import thêm icon `Globe` từ lucide-react

### Bước 2: Tối ưu giao diện Transactions page cho Mobile

**Tệp**: `src/pages/Transactions.tsx`

- Thu gọn header trên mobile: icon nhỏ hơn, ẩn subtitle, nút chỉ hiện icon
- Giảm padding và margin cho mobile (`px-3 py-4` thay vì `px-4 py-6`)
- Ẩn Card wrapper của bộ lọc trên mobile, hiển thị trực tiếp
- Trang này đã dùng `publicMode: true` nên khách chưa đăng nhập vẫn xem được

### Bước 3: Tối ưu TransactionFilters cho Mobile

**Tệp**: `src/components/Transactions/TransactionFilters.tsx`

- Bộ lọc full mode: chuyển sang dạng cuộn ngang (horizontal scroll) trên mobile thay vì flex-wrap
- Thu gọn các Select trigger width trên mobile

### Bước 4: Tối ưu TransactionCard cho Mobile

**Tệp**: `src/components/Transactions/TransactionCard.tsx`

- Đã có layout dọc trên mobile (ArrowDown). Tinh chỉnh thêm padding, font-size cho nhỏ gọn hơn.

### Bước 5: Thêm thống kê hoạt động chi tiết per-user

**Tệp mới**: `src/components/Transactions/UserActivityStats.tsx`

Tạo component hiển thị thống kê hoạt động thời gian thực của user đang xem, sử dụng RPC `get_user_activity_summary` (đã có sẵn trong database). Hiển thị:

- Lượt xem (Views)
- Lượt thích (Likes)  
- Bình luận (Comments)
- Chia sẻ (Shares)
- Upload
- Tổng CAMLY tích lũy / Đã duyệt / Chờ duyệt

Component này sẽ được tích hợp vào trang Transactions với Supabase Realtime listener trên bảng `reward_transactions` để cập nhật tức thì khi có hoạt động mới.

**Tệp**: `src/pages/Transactions.tsx`

- Thêm section "Thống kê hoạt động" phía trên danh sách giao dịch
- Người dùng đã đăng nhập sẽ thấy thống kê cá nhân
- Khách vãng lai vẫn xem được giao dịch công khai nhưng không thấy phần thống kê cá nhân

### Bước 6: Tối ưu TransactionStats cho Mobile

**Tệp**: `src/components/Transactions/TransactionStats.tsx`

- Đảm bảo grid 2 cột trên mobile hiển thị tốt với "Tổng giá trị" chiếm 2 cột

## Tệp cần thay đổi

| Tệp | Nội dung |
|------|----------|
| `src/components/Layout/MobileDrawer.tsx` | Thêm link "Lịch Sử Giao Dịch" |
| `src/pages/Transactions.tsx` | Tối ưu mobile + thêm UserActivityStats |
| `src/components/Transactions/TransactionFilters.tsx` | Responsive mobile |
| `src/components/Transactions/TransactionCard.tsx` | Tinh chỉnh mobile |
| `src/components/Transactions/TransactionStats.tsx` | Tinh chỉnh mobile |
| `src/components/Transactions/UserActivityStats.tsx` | Component mới - thống kê hoạt động realtime |
| `src/components/Transactions/index.ts` | Export component mới |

## Ghi chú

- Trang giao dịch công khai (`publicMode: true`) nên **không cần đăng nhập** để xem -- đã hoạt động đúng
- Thống kê hoạt động cá nhân chỉ hiện khi user đã đăng nhập (sử dụng RPC `get_user_activity_summary` có sẵn)
- Realtime listener sử dụng debounce 500ms để tối ưu hiệu năng
- Không cần thay đổi database -- tất cả RPC và bảng cần thiết đã tồn tại

