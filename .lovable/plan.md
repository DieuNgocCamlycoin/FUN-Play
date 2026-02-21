

## Kế hoạch: Trang công khai Danh sách tài khoản bị đình chỉ

### Tổng quan

Tạo trang công khai `/suspended` (ai cũng xem được, không cần đăng nhập) hiển thị danh sách user bị ban và ví bị blacklist, phù hợp với triết lý minh bạch tuyệt đối của FUN Play.

---

### Dữ liệu cần hiển thị

**Bảng 1 – User bị Ban:**

| Cột | Nguồn |
|---|---|
| Avatar (mờ) | `profiles.avatar_url` |
| Tên hiển thị | `profiles.display_name` |
| Username | `profiles.username` |
| Lý do | `profiles.ban_reason` |
| Ngày bị ban | `profiles.banned_at` |
| Mức vi phạm | `profiles.violation_level` |

**Bảng 2 – Ví bị Blacklist:**

| Cột | Nguồn |
|---|---|
| Địa chỉ ví (rút gọn) | `blacklisted_wallets.wallet_address` |
| Lý do | `blacklisted_wallets.reason` |
| Ngày tạo | `blacklisted_wallets.created_at` |
| Vĩnh viễn? | `blacklisted_wallets.is_permanent` |

---

### Thay đổi cần thiết

#### 1. Database: Tạo RPC `get_public_suspended_list`

Tạo một hàm RPC mới (security definer) để trả về dữ liệu an toàn (chỉ các trường công khai, không lộ email hay thông tin nhạy cảm):

```sql
CREATE OR REPLACE FUNCTION get_public_suspended_list()
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  ban_reason text,
  banned_at timestamptz,
  violation_level int
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, display_name, avatar_url, ban_reason, banned_at, violation_level
  FROM profiles
  WHERE COALESCE(banned, false) = true
  ORDER BY banned_at DESC NULLS LAST;
$$;
```

Bảng `blacklisted_wallets` đã có RLS policy "Everyone can view" nên query trực tiếp được.

#### 2. Hook: `src/hooks/usePublicSuspendedList.ts` (Tạo mới)

- Gọi RPC `get_public_suspended_list` cho danh sách user bị ban
- Query `blacklisted_wallets` trực tiếp cho danh sách ví
- Polling mỗi 2 phút (giống pattern `usePublicUsersDirectory`)

#### 3. Trang: `src/pages/SuspendedUsers.tsx` (Tạo mới)

- Header: Tiêu đề "Danh sách đình chỉ" + badge tổng số + mô tả ngắn về chính sách minh bạch
- 2 tab: "Tài khoản bị Ban" | "Ví bị Blacklist"
- Tab 1: Card list với avatar mờ, tên gạch ngang, lý do, ngày ban, badge violation level
- Tab 2: Bảng ví với địa chỉ rút gọn (0x1234...abcd), lý do, ngày, badge vĩnh viễn/tạm thời
- Thanh tìm kiếm cho cả 2 tab
- Responsive: desktop = bảng, mobile = card
- Không có nút Unban (chỉ xem, không hành động)

#### 4. Routing: `src/App.tsx` (Chỉnh sửa)

- Thêm route `/suspended` lazy-loaded

#### 5. Navigation: Thêm link vào sidebar/drawer

- `CollapsibleSidebar.tsx`: Thêm mục "Danh sách đình chỉ" (icon Ban) vào nhóm "Minh bạch" gần "Lịch Sử Giao Dịch"
- `MobileDrawer.tsx`: Thêm tương tự

---

### Chính sách hiển thị

- Trang hoàn toàn công khai (không cần đăng nhập)
- Không hiển thị email, số điện thoại hay thông tin cá nhân nhạy cảm
- Chỉ hiển thị: avatar, tên, username, lý do ban, ngày, mức vi phạm
- Ví blacklist: chỉ hiển thị địa chỉ ví (đã là thông tin on-chain công khai)

---

### Tổng kết file thay đổi

| STT | File | Hành động |
|---|---|---|
| 1 | Database migration | Tạo RPC `get_public_suspended_list` |
| 2 | `src/hooks/usePublicSuspendedList.ts` | Tạo mới |
| 3 | `src/pages/SuspendedUsers.tsx` | Tạo mới |
| 4 | `src/App.tsx` | Thêm route `/suspended` |
| 5 | `src/components/Layout/CollapsibleSidebar.tsx` | Thêm link điều hướng |
| 6 | `src/components/Layout/MobileDrawer.tsx` | Thêm link điều hướng |

