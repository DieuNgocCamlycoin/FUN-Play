

# Trang Users Directory Công Khai

## Mô tả
Tạo trang `/users` công khai để mọi người (kể cả khách chưa đăng nhập) đều xem được danh sách users kèm thống kê hoạt động, CAMLY rewards, donations, FUN Money -- không cần quyền admin.

## Các bước thực hiện

### 1. Tạo RPC mới `get_public_users_directory` (Migration SQL)

RPC tương tự `get_users_directory_stats` nhưng:
- **KHÔNG** yêu cầu quyền admin (bỏ `WHERE has_role(auth.uid(), 'admin')`)
- **Ẩn thông tin nhạy cảm**: không trả về `wallet_address`, `banned`, `pending_rewards`, `approved_reward`
- Chỉ trả về: user_id, username, display_name, avatar_url, avatar_verified, created_at, total_camly_rewards, posts_count, videos_count, comments_count, views_count, likes_count, shares_count, donations_sent_count, donations_sent_total, donations_received_count, donations_received_total, mint_requests_count, minted_fun_total

### 2. Tạo hook `src/hooks/usePublicUsersDirectory.ts`

- Gọi RPC `get_public_users_directory`
- Tương tự `useUsersDirectoryStats` nhưng dùng RPC công khai

### 3. Tạo trang `src/pages/UsersDirectory.tsx`

- Sử dụng `MainLayout` (giống Leaderboard) để có header/sidebar/bottom nav
- Giao diện:
  - Header gradient "Users Directory" với icon Users
  - Thanh tìm kiếm theo tên/username
  - Sắp xếp theo: CAMLY, Posts, Videos, Donations
  - Desktop: bảng với avatar, tên, hoạt động, CAMLY, FUN, donations
  - Mobile: card layout responsive
  - Click vào user dẫn đến trang profile (`/@username`)
  - Không có export CSV/PDF (chỉ admin mới cần)

### 4. Thêm route `/users` vào `App.tsx`

- Lazy load trang `UsersDirectory`
- Không cần auth guard

### 5. Thêm link vào sidebar (tùy chọn)

- Thêm mục "Users" vào sidebar navigation với icon `Users`

## Tệp thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | Migration SQL | Tạo RPC `get_public_users_directory` |
| 2 | `src/hooks/usePublicUsersDirectory.ts` | Hook mới gọi RPC công khai |
| 3 | `src/pages/UsersDirectory.tsx` | Trang công khai hiển thị users |
| 4 | `src/App.tsx` | Thêm route `/users` |
| 5 | `src/components/Layout/CollapsibleSidebar.tsx` | Thêm link "Users" vào sidebar |

## Chi tiết kỹ thuật

### RPC công khai (SQL)

```text
CREATE OR REPLACE FUNCTION get_public_users_directory()
RETURNS TABLE (
  user_id uuid, username text, display_name text, avatar_url text,
  avatar_verified boolean, created_at timestamptz,
  total_camly_rewards numeric, posts_count bigint, videos_count bigint,
  comments_count bigint, views_count bigint, likes_count bigint,
  shares_count bigint, donations_sent_count bigint, donations_sent_total numeric,
  donations_received_count bigint, donations_received_total numeric,
  mint_requests_count bigint, minted_fun_total numeric
)
-- Giống get_users_directory_stats nhưng:
-- Không WHERE has_role (ai cũng gọi được)
-- Không trả wallet_address, banned, pending_rewards, approved_reward
-- Chỉ hiển thị users KHÔNG bị banned
```

### Bảo mật
- Không lộ wallet address, trạng thái banned, hay số CAMLY chờ duyệt
- Chỉ hiện users active (lọc bỏ banned users)
- Không có chức năng export (chỉ admin mới cần)

