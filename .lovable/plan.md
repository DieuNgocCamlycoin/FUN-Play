

# Sửa thống kê User trong Admin Dashboard + Realtime

## Vấn đề

1. **Số liệu sai**: RPC `get_users_directory_stats` đang đếm videos, comments, views, likes từ bảng `reward_transactions` (chỉ đếm khi user được thưởng). Cần đếm từ bảng thực tế (`videos`, `comments`, `likes`, v.v.) giống như đã sửa cho trang `/users` public.

2. **Không có realtime**: Hook `useUsersDirectoryStats` chỉ tải dữ liệu 1 lần khi mở trang, không tự cập nhật khi có thay đổi.

## Thay đổi

| # | Tệp / Migration | Mô tả |
|---|-----------------|--------|
| 1 | Migration SQL | Cập nhật RPC `get_users_directory_stats` - đếm videos từ bảng `videos`, comments từ `comments`, likes từ `likes`, views từ `videos.view_count` |
| 2 | `src/hooks/useUsersDirectoryStats.ts` | Thêm Realtime listener (debounce 2s) lắng nghe bảng `likes`, `comments`, `reward_transactions` |

## Chi tiết kỹ thuật

### 1. Sửa RPC `get_users_directory_stats`

Thay đổi các nguồn dữ liệu:
- `videos_count`: Đếm từ bảng `videos` (thay vì reward_transactions UPLOAD)
- `comments_count`: Đếm từ bảng `comments` (thay vì reward_transactions COMMENT)
- `views_count`: Tính `SUM(view_count)` từ bảng `videos` (thay vì reward_transactions VIEW)
- `likes_count`: Đếm từ bảng `likes` WHERE `is_dislike = false` (thay vì reward_transactions LIKE)
- `shares_count`: Giữ nguyên từ `reward_transactions` (không có bảng shares riêng)
- `total_camly`: Giữ nguyên từ `reward_transactions`

### 2. Thêm Realtime vào hook

Áp dụng cùng pattern đã dùng cho `usePublicUsersDirectory`:
- Dùng `useRef` + `useCallback` để đảm bảo thứ tự hooks đúng
- Debounce 2 giây trước khi gọi lại RPC
- Lắng nghe 3 bảng: `likes`, `comments`, `reward_transactions`
- Cleanup khi unmount

