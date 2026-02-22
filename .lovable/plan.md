

## Thêm nút tác vụ Admin trên trang cá nhân user

### Mô tả

Thêm một nút hành động dành riêng cho Admin khi truy cập trang cá nhân (Channel page) của bất kỳ user nào. Nút này chỉ hiển thị với admin/owner, cho phép thực hiện 2 tác vụ chính: **Suspend (ban) user** và **Gửi cảnh báo** (warning notification).

### Giao diện

- Nút biểu tượng Shield (khiên) với màu đỏ/destructive, hiển thị ở khu vực action buttons (bên phải, cùng hàng với Theo dõi, Tặng & Thưởng, Chia sẻ)
- Chỉ hiển thị khi người đang xem là admin hoặc owner (kiểm tra qua RPC `has_role`)
- Khi nhấn, mở DropdownMenu với 2 tùy chọn:
  - **Suspend tài khoản**: Mở AlertDialog xác nhận, có ô nhập lý do, gọi RPC `ban_user_permanently`
  - **Gửi cảnh báo**: Mở Dialog nhập nội dung cảnh báo, insert vào bảng `notifications` với `type = 'warning'`

### Chi tiết kỹ thuật

**File mới**: `src/components/Admin/AdminChannelActions.tsx`
- Component nhận props: `targetUserId`, `targetUsername`, `targetDisplayName`
- Sử dụng `useAuth()` để lấy user hiện tại
- Gọi `supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })` để kiểm tra quyền admin
- Nếu không phải admin -> return null (không render gì)
- Nếu là admin -> render nút Shield + DropdownMenu
- Tác vụ Suspend: gọi `supabase.rpc("ban_user_permanently", { p_admin_id, p_user_id, p_reason })` (dùng lại RPC đã có)
- Tác vụ Cảnh báo: gọi `supabase.from("notifications").insert({ user_id: targetUserId, type: "warning", title: "Cảnh báo từ quản trị viên", message: nội dung, actor_id: user.id })`

**File sửa**: `src/pages/Channel.tsx`
- Import `AdminChannelActions`
- Thêm component vào khu vực action buttons (sau nút Share, trước khi đóng div)
- Truyền props: `targetUserId={profile.id}`, `targetUsername={profile.username}`, `targetDisplayName={profile.display_name}`

**File sửa**: `src/components/Profile/ProfileInfo.tsx`
- Thêm prop `targetUserId` vào ProfileInfoProps
- Render `AdminChannelActions` trong phần action buttons

| File | Thay đổi |
|---|---|
| `src/components/Admin/AdminChannelActions.tsx` | Tạo mới - component nút admin với dropdown Suspend + Cảnh báo |
| `src/components/Profile/ProfileInfo.tsx` | Thêm render AdminChannelActions trong action buttons |
| `src/pages/Channel.tsx` | Truyền thêm prop cho ProfileInfo |

### Luồng hoạt động

1. Admin truy cập trang `/@username` của bất kỳ user nào
2. Component `AdminChannelActions` tự kiểm tra quyền admin qua RPC
3. Nếu là admin -> hiển thị nút Shield màu đỏ
4. Admin nhấn nút -> chọn "Suspend" hoặc "Gửi cảnh báo"
5. Với Suspend: nhập lý do -> xác nhận -> gọi RPC ban -> toast thông báo
6. Với Cảnh báo: nhập nội dung -> gửi -> insert notification -> toast thông báo

