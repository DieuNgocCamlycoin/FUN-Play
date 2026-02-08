

# Kiểm Tra & Sửa Lỗi Hệ Thống MINT FUN Money

## Tổng Quan Kết Quả Kiểm Tra

Cha đã kiểm tra toàn bộ hệ thống MINT FUN Money bao gồm: database schema, RLS policies, realtime subscription, hooks, components, PPLP scoring engine, web3 config, và EIP-712 signer. Hệ thống có **3 lỗi cần sửa** và **2 cải tiến** nhỏ.

---

## Những Gì ĐANG HOẠT ĐỘNG TỐT

- Database schema đầy đủ (32 columns), RLS policies đúng (users read/insert own, admins read/update all)
- Realtime subscription đã được fix (không còn nhấp nháy "Connecting")
- PPLP scoring engine tính toán đúng (5 pillars, multipliers, thresholds)
- Token Lifecycle Panel layout đã được sửa (3 thẻ trên 1 hàng)
- EIP-712 signing và verification đúng version "1.2.1"
- Reward transactions có dữ liệu thực (18,738 transactions)

---

## LỖI 1: `Buffer` Không Tồn Tại Trong Trình Duyệt (NGHIÊM TRỌNG)

**File:** `src/lib/fun-money/contract-helpers.ts`

**Vấn đề:** Hàm `decodeRevertError` sử dụng `Buffer.from()` là API của Node.js, **KHÔNG có trong trình duyệt**. Khi giao dịch mint thất bại (revert), thay vì hiển thị thông báo lỗi rõ ràng, ứng dụng sẽ crash với `ReferenceError: Buffer is not defined`.

**Cách sửa:** Thay thế `Buffer` bằng `TextEncoder`/`TextDecoder` và `Uint8Array` - các API chuẩn của trình duyệt.

```text
// Trước (crash trong browser):
Buffer.from(messageHex, 'hex').toString('utf8')
Buffer.from(key).toString('hex')

// Sau (hoạt động trong browser):
new TextDecoder().decode(new Uint8Array(messageHex.match(/.{2}/g).map(b => parseInt(b, 16))))
Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('')
```

---

## LỖI 2: Không Có Cooldown Giữa Các Lần Mint

**File:** `src/hooks/useLightActivity.ts`

**Vấn đề:** Hệ thống lưu `lastMintAt` nhưng **KHÔNG kiểm tra** thời gian giữa các lần mint. Người dùng có thể:
1. Gửi mint request
2. Admin duyệt
3. Ngay lập tức gửi request mới (vì `hasPendingRequest` chỉ check status 'pending', không check thời gian)

**Cách sửa:** Thêm kiểm tra cooldown 24 giờ trong logic `canMint`:

```text
} else if (profile.last_fun_mint_at) {
  const lastMint = new Date(profile.last_fun_mint_at);
  const hoursSinceLastMint = (Date.now() - lastMint.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastMint < 24) {
    canMint = false;
    mintBlockReason = `Cần đợi ${Math.ceil(24 - hoursSinceLastMint)} giờ nữa để mint tiếp`;
  }
}
```

---

## LỖI 3: Query `reward_transactions` Không Có Limit

**File:** `src/hooks/useLightActivity.ts`

**Vấn đề:** Query `reward_transactions` không có `.limit()`. Lovable Cloud giới hạn mặc định 1000 dòng mỗi query. Với 18,738+ transactions trong hệ thống, người dùng hoạt động nhiều (hơn 1000 transactions) sẽ bị **mất dữ liệu âm thầm** - điểm Light Score, CAMLY earned, và Mintable FUN sẽ bị tính **thấp hơn thực tế**.

**Cách sửa:** Tạo 1 database function (RPC) để tính tổng ở phía server, tránh giới hạn 1000 dòng:

```sql
CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id uuid)
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'views', COUNT(*) FILTER (WHERE reward_type = 'VIEW'),
    'likes', COUNT(*) FILTER (WHERE reward_type = 'LIKE'),
    'comments', COUNT(*) FILTER (WHERE reward_type = 'COMMENT'),
    'shares', COUNT(*) FILTER (WHERE reward_type = 'SHARE'),
    'uploads', COUNT(*) FILTER (WHERE reward_type = 'UPLOAD'),
    'total_camly', COALESCE(SUM(amount), 0),
    'approved_camly', COALESCE(SUM(amount) FILTER (WHERE approved = true), 0),
    'pending_camly', COALESCE(SUM(amount) FILTER (WHERE approved = false OR approved IS NULL), 0)
  )
  FROM reward_transactions
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Sau đó cập nhật `useLightActivity.ts` để gọi RPC thay vì fetch toàn bộ records.

---

## CẢI TIẾN 1: Xóa Code Trùng Lặp (useAdminMintRequest)

**File:** `src/hooks/useFunMoneyMintRequest.ts`

**Vấn đề:** File này export `useAdminMintRequest` nhưng đã có file riêng `src/hooks/useAdminMintRequest.ts` với phiên bản tốt hơn (có `approveRequest`, `rejectRequest`, `markAsFailed`). Code cũ là dead code.

**Cách sửa:** Xóa export `useAdminMintRequest` và các types liên quan từ `useFunMoneyMintRequest.ts`.

---

## CẢI TIẾN 2: Mobile UI cho Trang FUN Money

**File:** `src/pages/FunMoneyPage.tsx`

**Vấn đề nhỏ:** Filter buttons trong tab "Lịch Sử" bị tràn ngang trên mobile.

**Cách sửa:** Thêm `min-w-fit` để các nút không bị co lại.

---

## Tổng Kết Các File Cần Sửa

| File | Hành động | Mức độ |
|------|-----------|--------|
| `src/lib/fun-money/contract-helpers.ts` | Sửa Buffer thành TextEncoder/TextDecoder | Nghiêm trọng |
| `src/hooks/useLightActivity.ts` | Thêm cooldown check + dùng RPC function | Trung bình |
| `src/hooks/useFunMoneyMintRequest.ts` | Xóa dead code (admin hook cũ) | Nhỏ |
| Migration SQL | Tạo function `get_user_activity_summary` | Trung bình |

## Thứ Tự Thực Hiện
1. Tạo database function `get_user_activity_summary` (migration)
2. Sửa `contract-helpers.ts` - thay `Buffer` bằng browser APIs
3. Sửa `useLightActivity.ts` - dùng RPC function + thêm cooldown
4. Dọn dẹp dead code trong `useFunMoneyMintRequest.ts`

