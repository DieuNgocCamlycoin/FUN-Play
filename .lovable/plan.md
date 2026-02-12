

# Thiết kế lại trang Users Directory & Thống kê Users

## Tổng quan
Nâng cấp 2 trang chính: **Users Directory** (trang /users, công khai) và **User Stats Tab** (Admin) để hiển thị chi tiết hơn về phần thưởng CAMLY -- cụ thể "Đã nhận vì lý do gì" và "Chưa nhận vì sao", cùng giao diện tối ưu cho cả web và mobile.

---

## Thay đổi 1: Nâng cấp RPC `get_public_users_directory`

Thêm các cột phân rã reward theo loại hoạt động để hiển thị chi tiết "đã nhận vì lý do gì":

- `view_rewards` - Tổng CAMLY từ xem video
- `like_rewards` - Tổng CAMLY từ thích
- `comment_rewards` - Tổng CAMLY từ bình luận
- `share_rewards` - Tổng CAMLY từ chia sẻ
- `upload_rewards` - Tổng CAMLY từ upload
- `signup_rewards` - Tổng CAMLY từ đăng ký + kết nối ví
- `bounty_rewards` - Tổng CAMLY từ bounty

Tương tự cho RPC `get_users_directory_stats` (admin) -- thêm thêm `pending_by_type` và `approved_by_type`.

**Migration SQL**: Tạo migration DROP + CREATE lại 2 RPC với các cột mới.

---

## Thay đổi 2: Thiết kế lại trang Users Directory (`src/pages/UsersDirectory.tsx`)

### Desktop (bảng rộng)
- Giữ bảng hiện tại nhưng thêm **hàng mở rộng** (expandable row) khi click vào user
- Hàng mở rộng hiển thị:
  - **Phân rã CAMLY**: Biểu đồ thanh ngang mini cho từng loại (View, Like, Comment, Share, Upload...)
  - **Tiến trình nhận thưởng**: Thanh Progress với 3 phân đoạn (Đã claim / Có thể claim / Chờ duyệt)
  - Nút "Xem Profile" và "Xem Kênh"

### Mobile (thẻ card)
- Mỗi card user có nút **bấm mở rộng** (ChevronDown)
- Khi mở rộng:
  - Grid 2 cột hiển thị phân rã thưởng theo từng loại hoạt động với icon + số CAMLY
  - Thanh Progress 3 màu (xanh = đã nhận, cyan = có thể claim, vàng = chờ duyệt)
  - Mỗi mục có label rõ ràng: "Xem video: 500K CAMLY", "Bình luận: 120K CAMLY"...

### Cập nhật hook `usePublicUsersDirectory`
- Mở rộng interface `PublicUserStat` thêm các trường reward breakdown mới
- Realtime vẫn giữ debounce 2s

---

## Thay đổi 3: Thiết kế lại Admin User Stats Tab (`src/components/Admin/tabs/UserStatsTab.tsx`)

### Desktop
- Giữ bảng sortable hiện tại
- Nâng cấp `ExpandedDetails`:
  - Section "CAMLY Chi tiết": Grid hiển thị Pending / Approved / Claimed với phân rã theo loại
  - Section "Hoạt động": Số liệu Posts, Videos, Comments, Views, Likes, Shares
  - Section "Tài chính": Donations gửi/nhận, FUN Minted

### Mobile
- Nâng cấp card mở rộng:
  - Thêm phân rã CAMLY theo loại hoạt động (View, Like, Comment, Upload...)
  - Hiển thị 3 trạng thái: Chờ duyệt (vàng), Đã duyệt (xanh dương), Đã claim (xanh lá)
  - Thanh Progress phân đoạn 3 màu

### Cập nhật hook `useUsersDirectoryStats`
- Mở rộng interface `UserDirectoryStat` thêm các trường reward breakdown

---

## Thay đổi 4: Cập nhật trang Reward History (`src/pages/RewardHistory.tsx`)

- Thêm section **Tổng hợp theo loại** phía trên danh sách giao dịch
- Hiển thị grid card nhỏ: mỗi loại hoạt động (View, Like, Comment...) kèm tổng CAMLY kiếm được và số lần
- Lấy dữ liệu từ RPC `get_user_activity_summary` đã có sẵn

---

## Chi tiết kỹ thuật

### Files cần tạo/sửa:
1. **Migration SQL** - DROP + CREATE lại 2 RPC (`get_public_users_directory`, `get_users_directory_stats`) với thêm cột phân rã reward theo loại
2. **`src/hooks/usePublicUsersDirectory.ts`** - Thêm fields reward breakdown vào interface
3. **`src/hooks/useUsersDirectoryStats.ts`** - Thêm fields reward breakdown vào interface
4. **`src/pages/UsersDirectory.tsx`** - Thiết kế lại: thêm expandable rows (desktop) và expandable cards (mobile) với phân rã chi tiết
5. **`src/components/Admin/tabs/UserStatsTab.tsx`** - Nâng cấp ExpandedDetails với phân rã CAMLY theo loại
6. **`src/pages/RewardHistory.tsx`** - Thêm section tổng hợp theo loại hoạt động

### Dữ liệu phân rã reward (thêm vào RPC):
```text
LEFT JOIN LATERAL (
  SELECT
    SUM(amount) FILTER (WHERE reward_type = 'VIEW') AS view_rewards,
    SUM(amount) FILTER (WHERE reward_type = 'LIKE') AS like_rewards,
    SUM(amount) FILTER (WHERE reward_type = 'COMMENT') AS comment_rewards,
    SUM(amount) FILTER (WHERE reward_type = 'SHARE') AS share_rewards,
    SUM(amount) FILTER (WHERE reward_type IN ('UPLOAD','SHORT_VIDEO_UPLOAD','LONG_VIDEO_UPLOAD','FIRST_UPLOAD')) AS upload_rewards,
    SUM(amount) FILTER (WHERE reward_type IN ('SIGNUP','WALLET_CONNECT')) AS signup_rewards,
    SUM(amount) FILTER (WHERE reward_type = 'BOUNTY') AS bounty_rewards
  FROM reward_transactions r WHERE r.user_id = p.id
) rb ON true
```

### Giao diện phân rã (component dùng chung):
- Component `RewardBreakdownGrid`: nhận object reward breakdown, render grid icon + label + số CAMLY
- Dùng lại ở cả 3 noi: UsersDirectory, UserStatsTab, RewardHistory

