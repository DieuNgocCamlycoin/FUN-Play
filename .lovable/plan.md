
# Sửa lỗi hiển thị dữ liệu thưởng tay trang CAMLY Rewards Admin

## Phân tích nguyên nhân gốc

### Lỗi 1: 55 giao dịch CAMLY từ Ví 1 thiếu `block_timestamp` (NULL)
- Edge function `backfill-moralis` khi gặp giao dịch đã tồn tại trong database sẽ **BỎ QUA (skip)** thay vì cập nhật `block_timestamp`.
- Do đó 55 giao dịch cũ (import từ BscScan trước đó) vẫn có `block_timestamp = NULL`.
- 6 giao dịch USDT cũng bị NULL timestamp.

### Lỗi 2: Logic lọc ngày sai trong `RewardPoolTab.tsx`
- Dòng 202: `if (!ts || ts < WALLET1_CUTOFF)` -- điều kiện `!ts` khiến TẤT CẢ giao dịch có NULL timestamp đều được tính vào tổng.
- Hậu quả: tổng CAMLY bị phồng lên vì bao gồm cả những giao dịch SAU ngày giới hạn mà chỉ thiếu timestamp.

### Lỗi 3: Lookup profile bị trùng lặp
- Một số địa chỉ ví có chữ hoa/thường khác nhau trong database (ví dụ `0xcc0e4b14...` và `0xcc0E4B14...`) thuộc cùng 1 user.
- Địa chỉ `0x80041caa...` được liên kết với 2 user khác nhau, gây hiển thị sai avatar/tên kênh.

## Dữ liệu thực tế đã kiểm chứng

| Ví | Token | Số GD trước mốc | Tổng | Mốc thời gian |
|----|-------|-----------------|------|---------------|
| Ví 1 | CAMLY | 59 | 19.691.562 | Trước 8/1/2026 |
| Ví 1 | USDT | 6 | 72 | Trước 8/1/2026 |
| Ví 2 | CAMLY | 7 | 3.500.000 | Trước 18/1/2026 |

---

## Bước 1: Sửa `backfill-moralis` để cập nhật timestamp cho giao dịch cũ

### File: `supabase/functions/backfill-moralis/index.ts`

Thay vì bỏ qua khi gặp giao dịch trùng, sẽ **UPDATE `block_timestamp`** nếu bản ghi hiện tại có `block_timestamp = NULL`:

```
if (existing) {
  // Nếu đã có nhưng thiếu block_timestamp -> cập nhật
  if (!existing.block_timestamp && tx.block_timestamp) {
    await supabase
      .from("wallet_transactions")
      .update({ block_timestamp: tx.block_timestamp })
      .eq("id", existing.id);
  }
  result.duplicatesSkipped++;
  continue;
}
```

Sau khi deploy, gọi `backfill-moralis` để cập nhật 55+ giao dịch thiếu timestamp.

---

## Bước 2: Sửa logic lọc ngày trong `RewardPoolTab.tsx`

### File: `src/components/Admin/tabs/RewardPoolTab.tsx`

**2a. Sửa điều kiện lọc ngày (xoá `!ts`):**

Thay:
```
if (!ts || ts < WALLET1_CUTOFF)
```

Thành:
```
if (ts && ts < WALLET1_CUTOFF)
```

Chỉ tính những giao dịch CÓ timestamp hợp lệ VÀ nằm trong mốc thời gian.

**2b. Thêm phần hiển thị giao dịch chưa có timestamp:**

Hiển thị riêng số lượng giao dịch thiếu timestamp (nếu có) kèm ghi chú "Đang đồng bộ..." để admin biết cần chạy backfill.

**2c. Sửa lookup profile -- dùng `LOWER()` nhất quán:**

Đổi query fetch profiles thành so sánh case-insensitive:
```typescript
const addrToProfile = new Map();
profiles?.forEach(p => {
  if (p.wallet_address) {
    addrToProfile.set(p.wallet_address.toLowerCase(), {
      username: p.username,
      avatar_url: p.avatar_url,
      user_id: p.id
    });
  }
});
```

Khi lookup: dùng `tx.to_address?.toLowerCase()` (đã có sẵn).

**2d. Sửa link channel -- dùng channel name thay vì username:**

Thay `href={/c/${tx.recipient_username}}` thành dùng channel slug hoặc user profile path chính xác.

---

## Bước 3: Deploy và chạy backfill

1. Deploy `backfill-moralis` mới
2. Gọi backfill cho Ví 1 để cập nhật 55 giao dịch thiếu timestamp
3. Kiểm tra lại database: đảm bảo 0 giao dịch có NULL timestamp
4. Xác nhận tổng CAMLY hiển thị đúng trên giao diện

---

## Chi tiết kỹ thuật

### Files cần sửa (2 files):

1. `supabase/functions/backfill-moralis/index.ts` -- Thêm logic UPDATE block_timestamp cho giao dịch đã tồn tại
2. `src/components/Admin/tabs/RewardPoolTab.tsx` -- Sửa logic lọc ngày, sửa profile lookup, thêm hiển thị giao dịch thiếu timestamp

### Thứ tự thực hiện:
1. Sửa `backfill-moralis` (thêm UPDATE logic)
2. Deploy và chạy backfill cho Ví 1
3. Sửa `RewardPoolTab.tsx` (lọc ngày đúng, profile lookup chính xác)
4. Kiểm tra kết quả cuối cùng trên web và mobile
