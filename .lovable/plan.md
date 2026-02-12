

# Đồng bộ giao dịch Ví tặng thưởng 2 và nâng cấp trang CAMLY Rewards Admin

## Nguyên nhân gốc

Ví tặng thưởng 2 (`0x7b32E82C64FF4f02dA024B47A8653e1707003339`) đã có **9 giao dịch CAMLY trên blockchain** (tổng khoảng 3.500.000 CAMLY gửi ra + 5.009.999 CAMLY nhận vào), nhưng hệ thống hiển thị 0 vì:

- Hai edge function đồng bộ dữ liệu (`sync-transactions-cron` và `backfill-moralis`) chỉ liệt kê **2 ví hệ thống** (REWARD và TREASURY), **chưa có ví thứ 3** (`0x7b32...`).
- Do đó, giao dịch từ ví 2 chưa bao giờ được import vào bảng `wallet_transactions` trong database.

---

## Bước 1: Thêm ví tặng thưởng 2 vào hệ thống đồng bộ

### File `supabase/functions/sync-transactions-cron/index.ts`
- Thêm địa chỉ `0x7b32E82C64FF4f02dA024B47A8653e1707003339` vào mảng `SYSTEM_WALLETS`

### File `supabase/functions/backfill-moralis/index.ts`
- Thêm địa chỉ `0x7b32E82C64FF4f02dA024B47A8653e1707003339` vào mảng `SYSTEM_WALLETS`

Sau khi deploy, gọi `backfill-moralis` để import toàn bộ lịch sử giao dịch của ví 2 từ blockchain vào database.

---

## Bước 2: Nâng cấp trang CAMLY Rewards Admin

### File `src/components/Admin/tabs/RewardPoolTab.tsx`

**2a. Đổi tên card ví thành địa chỉ ví rút gọn:**
- "Ví tặng thưởng 1" thành hiển thị `0x1DC2...5998` kèm link BscScan
- "Ví tặng thưởng 2" thành hiển thị `0x7b32...3339` kèm link BscScan

**2b. Thêm card "Tổng đã tặng thưởng hệ thống":**
- Giá trị = CAMLY đã claim (từ `claim_requests`) + Tổng thưởng tay (từ `wallet_transactions`)
- Đặt ở vị trí nổi bật phía trên cùng

**2c. Hiển thị avatar + tên kênh người nhận:**
- Truy vấn bổ sung `display_name`, `avatar_url` từ bảng `profiles` và `name` từ bảng `channels`
- Mỗi dòng trong bảng "Thưởng bằng tay gần đây" hiển thị: Avatar, tên kênh, @username (link tới `/c/{username}`)

**2d. Cập nhật thời gian thực mỗi 2 giây:**
- Thêm `useEffect` với `setInterval(2000)` để tự động gọi lại `fetchData()`
- Hiển thị badge "Live" cho biết dữ liệu đang cập nhật real-time
- Cleanup interval khi component unmount

**2e. Sắp xếp lại bố cục tối ưu web và mobile:**

```text
+-------------------------------------------------------+
| [Tổng đã tặng thưởng hệ thống] [Live]  [Làm mới]     |
+-------------------------------------------------------+
| Pool CAMLY  |  BNB Gas  |  Đã claim  |  Thưởng tay    |
+-------------------------------------------------------+
| Ví 0x1DC2...5998       |  Ví 0x7b32...3339            |
+-------------------------------------------------------+
| Bảng: Thưởng tay gần đây (avatar + tên kênh + link)   |
+-------------------------------------------------------+
| Bảng: Lịch sử Claim                                   |
+-------------------------------------------------------+
```

- Mobile: các card tự động xếp 1 cột, bảng cuộn ngang

**2f. Liên kết với trang User Stats:**
- Click vào tên người nhận trong bảng sẽ mở trang channel `/c/{username}`

---

## Chi tiết kỹ thuật

### Files cần sửa (3 files):

1. `supabase/functions/sync-transactions-cron/index.ts` -- Thêm ví 2 vào mảng SYSTEM_WALLETS
2. `supabase/functions/backfill-moralis/index.ts` -- Thêm ví 2 vào mảng SYSTEM_WALLETS
3. `src/components/Admin/tabs/RewardPoolTab.tsx` -- Toàn bộ nâng cấp giao diện (địa chỉ ví, tổng tặng thưởng, avatar + tên kênh, real-time 2s, bố cục mới)

### Thứ tự thực hiện:
1. Cập nhật 2 edge function để thêm ví 2
2. Deploy và gọi `backfill-moralis` để đồng bộ lịch sử giao dịch ví 2
3. Cập nhật giao diện RewardPoolTab với đầy đủ tính năng mới
4. Kiểm tra dữ liệu hiển thị chính xác trên cả web và mobile

