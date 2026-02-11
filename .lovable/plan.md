

# Chi tiết hoá CAMLY Rewards + Cập nhật giao diện Mobile

## Vấn đề hiện tại
Trang Users Directory hiện chỉ hiển thị `total_camly_rewards` (tổng CAMLY) mà không cho biết bao nhiêu đã được nhận (claimed) và bao nhiêu chưa nhận (unclaimed). Giao diện mobile cards cũng chưa hiển thị đủ thông tin chi tiết.

## Giải pháp

### 1. Cập nhật RPC `get_public_users_directory` (Migration SQL)

Thêm 2 cột mới vào kết quả trả về của RPC:
- `claimed_camly` — Số CAMLY đã được claim (từ bảng `reward_transactions` với điều kiện `claimed = true`)
- `unclaimed_camly` — Số CAMLY chưa claim (tính bằng tổng trừ đi phần đã claim)

### 2. Cập nhật hook và interface

Thêm 2 trường `claimed_camly` và `unclaimed_camly` vào interface `PublicUserStat` trong file `src/hooks/usePublicUsersDirectory.ts`.

### 3. Cập nhật giao diện

**Bảng desktop:**
- Tách cột CAMLY thành 3 cột nhỏ: Tổng | Đã nhận | Chưa nhận
- Màu sắc phân biệt: vàng cho tổng, xanh lá cho đã nhận, cam cho chưa nhận

**Thẻ mobile (cải thiện lớn):**
- Thêm phần CAMLY breakdown với thanh tiến trình (progress bar) trực quan hiển thị tỷ lệ đã nhận / tổng
- Hiển thị thêm các chỉ số: Comments, Likes, Shares, Donations received, FUN Minted
- Bố cục dạng lưới 2 cột cho các chỉ số để dễ đọc hơn
- Hiển thị ngày tham gia ở cuối thẻ

## Tệp thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | Migration SQL | Thêm `claimed_camly`, `unclaimed_camly` vào RPC |
| 2 | `src/hooks/usePublicUsersDirectory.ts` | Thêm 2 trường mới vào interface |
| 3 | `src/pages/UsersDirectory.tsx` | Cập nhật bảng desktop + thẻ mobile |

## Chi tiết kỹ thuật

### Cập nhật RPC (SQL)

Trong lateral join tính rewards, thêm logic:

```text
COALESCE(SUM(amount) FILTER (WHERE claimed = true), 0) AS claimed_camly,
(COALESCE(SUM(amount), 0) - COALESCE(SUM(amount) FILTER (WHERE claimed = true), 0)) AS unclaimed_camly
```

### Bố cục thẻ mobile mới

Mỗi thẻ sẽ bao gồm:
- Avatar + Tên hiển thị + Username + Huy hiệu xác minh
- Phần CAMLY với thanh tiến trình (đã nhận X / tổng Y)
- Lưới 2 cột hiển thị các chỉ số: Views, Videos, Posts, Comments, Đã tặng, Được nhận, FUN, Likes
- Ngày tham gia ở cuối thẻ

