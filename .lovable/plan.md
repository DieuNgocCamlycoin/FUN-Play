

# Nhấn vào avatar trong Users Directory sẽ link tới kênh của người dùng

## Thay đổi

Hiện tại, cả hàng (row) trong bảng Desktop và thẻ (card) trên Mobile đều đã có `onClick` chuyển tới trang cá nhân. Yêu cầu là khi nhấn riêng vào **avatar**, sẽ chuyển tới **kênh** của người đó thay vì trang cá nhân.

### Cách thực hiện

Chỉ cần sửa **1 file**: `src/pages/UsersDirectory.tsx`

#### 1. Desktop (bảng Table)
- Bọc `Avatar` trong thẻ `<div>` có `onClick` riêng, gọi `e.stopPropagation()` để không kích hoạt `onClick` của cả hàng
- `onClick` của avatar sẽ điều hướng tới `/@${u.username}` hoặc `/channel/${u.user_id}`
- Thêm `cursor-pointer` và hiệu ứng hover (ring/border sáng) để người dùng biết avatar có thể nhấn được

#### 2. Mobile (thẻ Card)
- Tương tự, bọc `Avatar` trong thẻ `<div>` có `onClick` riêng với `e.stopPropagation()`
- Điều hướng tới kênh của người dùng khi nhấn vào avatar
- Thêm hiệu ứng hover/ring cho avatar

### Chi tiết kỹ thuật

- Tạo hàm `goToChannel(u)` điều hướng tới `/@${u.username}` (nếu có username) hoặc `/channel/${u.user_id}` (nếu không có)
- Avatar trên cả Desktop và Mobile sẽ gọi `goToChannel` thay vì `goToProfile`
- Nhấn vào phần còn lại của hàng/thẻ vẫn giữ nguyên hành vi cũ (`goToProfile`)

