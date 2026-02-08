
# Đổi màu tiêu đề trang sang màu xanh logo FUN Play (#0066FF)

## Tình trạng hiện tại

Các tiêu đề trang hiện đang sử dụng gradient cầu vồng (`text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta`). Cần đổi sang màu xanh logo đơn sắc `#0066FF` để đồng nhất với hệ thống thiết kế.

## Danh sách thay đổi

### 1. `src/components/Video/ContinueWatching.tsx` (dòng 33)
- **Tiêu đề:** "Tiếp tục xem"
- **Hiện tại:** `text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta`
- **Sau:** `text-[#0066FF]`

### 2. `src/pages/WatchLater.tsx` (dòng 57)
- **Tiêu đề:** "Xem sau"
- **Hiện tại:** `text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta`
- **Sau:** `text-[#0066FF]`

### 3. `src/pages/WatchHistory.tsx` (dòng 105)
- **Tiêu đề:** "Lịch sử xem"
- **Hiện tại:** `text-transparent bg-clip-text bg-gradient-to-r from-cosmic-magenta via-cosmic-cyan to-cosmic-sapphire`
- **Sau:** `text-[#0066FF]`

### 4. `src/pages/Subscriptions.tsx` (dòng 135)
- **Tiêu đề:** "Kênh đã đăng ký"
- **Hiện tại:** `text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta`
- **Sau:** `text-[#0066FF]`

### 5. `src/pages/Index.tsx` (dòng 378)
- **Tiêu đề:** "Chưa có video nào" (trạng thái trống)
- **Hiện tại:** `text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta`
- **Sau:** `text-[#0066FF]`

### 6. `src/pages/Index.tsx` (dòng 354)
- **Chữ "FUN Play"** trong banner đăng nhập
- **Hiện tại:** `text-transparent bg-clip-text bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta`
- **Sau:** `text-[#0066FF]`

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 4 file |
| Tổng thay đổi | 6 chỗ |
| Cơ sở dữ liệu | Không |
| Đồng bộ Mobile | Tự động (component dùng chung) |

## Kết quả

- Tất cả tiêu đề trang hiển thị màu xanh logo `#0066FF` thay vì gradient cầu vồng
- Giao diện đồng nhất với Filter Chips Bar và các thành phần khác đã cập nhật
- Áp dụng đồng thời cho cả Desktop và Mobile
