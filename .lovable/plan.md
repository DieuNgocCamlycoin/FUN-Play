

## Cập nhật trang Danh sách Đình chỉ: Tên user có thể nhấp vào

### Thay đổi

Trong file `src/pages/SuspendedUsers.tsx`, component `SuspendedRow`:

- Bọc tên hiển thị (`display_name`) và `@username` bằng thẻ `Link` từ `react-router-dom`
- Khi nhấp vào tên hoặc username, điều hướng đến `/:username` (hoặc `/:user_id` nếu không có username)
- Chỉ áp dụng cho user có `user_id` (không phải orphan/wallet không xác định)
- Thêm hiệu ứng hover (underline, màu sáng hơn) để người dùng biết đây là link có thể nhấp

### Chi tiết kỹ thuật

**File:** `src/pages/SuspendedUsers.tsx`

1. Import `Link` từ `react-router-dom`
2. Trong `SuspendedRow`, bọc phần tên + username (dòng 141-147) bằng `<Link to={`/${entry.username || entry.user_id}`}>`:
   - Tên (`display_name`): giữ nguyên style gạch ngang, thêm hover effect
   - `@username`: giữ nguyên style, thêm hover effect
   - Chỉ wrap bằng Link khi `!isOrphan`

Không cần thay đổi database hay các file khác.
