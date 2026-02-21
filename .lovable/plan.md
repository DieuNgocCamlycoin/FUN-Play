

## Tích hợp lịch sử ví vào trang /suspended

### Tổng quan
Hiển thị thêm cột "Lịch sử ví" bên cạnh cột "Ví liên kết" (blacklisted_wallets) hiện tại, lấy dữ liệu từ bảng `ip_tracking` (các sự kiện `wallet_connect`) và `claim_requests` để liệt kê tất cả ví mà user bị ban đã từng kết nối.

### Thay đổi

#### 1. Tạo RPC function (Database Migration)
Tạo hàm `get_suspended_wallet_history` trả về danh sách ví đã từng kết nối của tất cả user bị ban:
- Truy vấn `ip_tracking` (action_type = 'wallet_connect') + `claim_requests` cho các user có `profiles.banned = true`
- Gộp (UNION) và loại trùng (DISTINCT) các wallet_address theo user_id
- Loại bỏ các ví đã có trong `blacklisted_wallets` để tránh hiển thị trùng
- Hàm công khai (SECURITY DEFINER) nhưng chỉ trả dữ liệu của user bị ban

#### 2. Cập nhật hook `usePublicSuspendedList.ts`
- Thêm query gọi RPC `get_suspended_wallet_history`
- Thêm interface `HistoricalWallet` (user_id, wallet_address, source)
- Merge dữ liệu lịch sử ví vào `SuspendedEntry` với field mới `historical_wallets`

#### 3. Cập nhật giao diện `SuspendedUsers.tsx`
- Trong cột "Ví liên kết", hiển thị thêm phần "Lịch sử ví" bên dưới danh sách blacklisted wallets
- Ví lịch sử hiển thị với style nhạt hơn (opacity thấp hơn) và badge nhỏ ghi nguồn ("tracking" / "claim")
- Cập nhật bộ lọc search để tìm kiếm cả trong historical wallets

### Chi tiết kỹ thuật

**RPC Function SQL:**
```sql
CREATE OR REPLACE FUNCTION get_suspended_wallet_history()
RETURNS TABLE(user_id uuid, wallet_address text, source text)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  WITH banned_users AS (
    SELECT id FROM profiles WHERE banned = true
  ),
  all_wallets AS (
    -- From ip_tracking
    SELECT it.user_id, it.wallet_address, 'tracking' as source
    FROM ip_tracking it
    JOIN banned_users bu ON bu.id = it.user_id
    WHERE it.wallet_address IS NOT NULL
    UNION
    -- From claim_requests
    SELECT cr.user_id, cr.wallet_address, 'claim' as source
    FROM claim_requests cr
    JOIN banned_users bu ON bu.id = cr.user_id
    WHERE cr.wallet_address IS NOT NULL
    UNION
    -- Current wallet from profiles
    SELECT p.id, p.wallet_address, 'profile' as source
    FROM profiles p
    JOIN banned_users bu ON bu.id = p.id
    WHERE p.wallet_address IS NOT NULL
  )
  SELECT DISTINCT aw.user_id, aw.wallet_address, MIN(aw.source) as source
  FROM all_wallets aw
  -- Exclude wallets already in blacklisted_wallets
  WHERE NOT EXISTS (
    SELECT 1 FROM blacklisted_wallets bw
    WHERE bw.wallet_address = aw.wallet_address
  )
  GROUP BY aw.user_id, aw.wallet_address;
$$;
```

**Hook changes:** Thêm query thứ 3 cho historical wallets, merge vào `SuspendedEntry`.

**UI changes:** Hiển thị ví lịch sử dưới ví bị chặn với badge "Đã kết nối" màu xám nhạt, phân biệt rõ với ví bị blacklist (có badge đỏ "Vĩnh viễn"/"Tạm thời").
