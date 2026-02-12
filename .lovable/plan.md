
# Sửa Lỗi Giao Dịch Onchain Không Hiển Thị

## Nguyên nhân gốc

Hiện tại, hook `useTransactionHistory` ở **chế độ cá nhân** (private mode) truy vấn bảng `wallet_transactions` theo điều kiện:

```text
or(from_user_id.eq.${user.id}, to_user_id.eq.${user.id})
```

Tuy nhiên, trong cơ sở dữ liệu có **74/492 giao dịch** (15%) không có `from_user_id` hoặc `to_user_id` (đều là NULL). Đây là các giao dịch được đồng bộ từ blockchain nhưng không thể liên kết ngược với hồ sơ người dùng (vì địa chỉ ví không khớp hoặc chưa được đăng ký trên Fun Play).

Kết quả: Người dùng **không thấy** các giao dịch liên quan đến ví mình nếu giao dịch đó không có `user_id` được gán.

## Giải pháp

### Bước 1: Sửa truy vấn `wallet_transactions` trong `useTransactionHistory.ts`

Thay đổi logic truy vấn ở chế độ cá nhân:
- **Trước**: Chỉ tìm theo `from_user_id` hoặc `to_user_id`
- **Sau**: Tìm theo **cả** `user_id` **và** `wallet_address` của người dùng

Cụ thể:
1. Lấy `wallet_address` của user từ bảng `profiles` (đã có sẵn trong đoạn code dòng 471-478)
2. Di chuyển việc lấy `wallet_address` lên **trước** khi truy vấn `wallet_transactions`
3. Xây dựng điều kiện `or()` mở rộng:

```text
-- Trước (bỏ lỡ giao dịch không có user_id):
or(from_user_id.eq.userId, to_user_id.eq.userId)

-- Sau (bắt được tất cả giao dịch liên quan đến ví):
or(
  from_user_id.eq.userId,
  to_user_id.eq.userId,
  from_address.ilike.walletAddress,
  to_address.ilike.walletAddress
)
```

### Bước 2: Cập nhật hiển thị cho giao dịch không có profile

Khi `from_user_id` hoặc `to_user_id` là NULL và không phải ví hệ thống, hiển thị địa chỉ ví rút gọn thay vì "Không rõ":
- Đã có sẵn logic `getSystemWalletDisplayInfo` cho ví hệ thống
- Thêm fallback: nếu không có profile và không phải ví hệ thống, hiển thị `0x1234...abcd` làm tên

### Bước 3: Backfill `user_id` cho các giao dịch hiện có

Chạy SQL để liên kết lại các giao dịch có NULL user_id với profile dựa trên `wallet_address`:

```text
UPDATE wallet_transactions wt
SET to_user_id = p.id
FROM profiles p
WHERE LOWER(wt.to_address) = LOWER(p.wallet_address)
  AND wt.to_user_id IS NULL;

UPDATE wallet_transactions wt
SET from_user_id = p.id
FROM profiles p
WHERE LOWER(wt.from_address) = LOWER(p.wallet_address)
  AND wt.from_user_id IS NULL;
```

### Bước 4: Cập nhật `sync-transactions-cron` để luôn liên kết user_id

Trong edge function `sync-transactions-cron`, logic hiện tại đã có `walletToUserId` map nhưng sử dụng **case-sensitive matching**. Cần đảm bảo:
- So sánh địa chỉ ví luôn dùng `toLowerCase()`
- Đã có trong code hiện tại (dòng `walletToUserId[p.wallet_address.toLowerCase()]`) - xác nhận hoạt động đúng

### Bước 5: Đảm bảo tương thích mobile

Trang `/reward-history` (RewardHistory.tsx) đã responsive. Thay đổi chính nằm ở hook `useTransactionHistory.ts` nên tự động áp dụng cho cả desktop và mobile, bao gồm:
- Trang Ví (`/wallet`) → `TransactionHistorySection`
- Trang Giao Dịch Công Khai (`/transactions`)

## Chi tiết kỹ thuật

### File cần sửa

| File | Thay đổi |
|------|----------|
| `src/hooks/useTransactionHistory.ts` | Mở rộng query wallet_transactions theo wallet_address, di chuyển lấy wallet_address lên trước |
| SQL (data fix) | Backfill from_user_id/to_user_id cho 74 giao dịch thiếu |

### Thay đổi cụ thể trong `useTransactionHistory.ts`

**Dòng 199-229**: Sửa truy vấn wallet_transactions ở chế độ cá nhân

Trước:
```text
user?.id
  ? supabase
      .from("wallet_transactions")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq("status", "completed")
      ...
```

Sau:
```text
// Lấy wallet_address trước (di chuyển từ dòng 471-478)
let userWalletAddress = null;
if (!publicMode && user?.id) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .single();
  userWalletAddress = profile?.wallet_address?.toLowerCase() || null;
}

// Query mở rộng
const orConditions = [`from_user_id.eq.${user.id}`, `to_user_id.eq.${user.id}`];
if (userWalletAddress) {
  orConditions.push(`from_address.ilike.${userWalletAddress}`);
  orConditions.push(`to_address.ilike.${userWalletAddress}`);
}

supabase
  .from("wallet_transactions")
  .select("*")
  .or(orConditions.join(","))
  .eq("status", "completed")
  ...
```

**Dòng 382-432**: Cập nhật normalize wallet_transactions - thêm fallback hiển thị khi không có profile:
```text
// Nếu không có profile và không phải ví hệ thống, dùng địa chỉ ví làm tên
const fallbackFromInfo = {
  displayName: formatAddress(w.from_address),
  username: formatAddress(w.from_address),
  avatarUrl: null,
  channelName: formatAddress(w.from_address),
};
const finalFromInfo = senderSystemWallet || (fromProfile ? fromInfo : fallbackFromInfo);
```

## Tác động

- Người dùng sẽ thấy **toàn bộ** giao dịch onchain liên quan đến ví mình, kể cả giao dịch không có `user_id`
- Không ảnh hưởng đến logic thưởng, claim, hoặc donation
- Tương thích cả desktop và mobile
- Backfill SQL sẽ liên kết lại 74 giao dịch thiếu user_id với profile tương ứng
