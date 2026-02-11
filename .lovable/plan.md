

# Hiển thị tất cả giao dịch realtime + thông báo tin nhắn

## Tổng quan

Hiện tại hệ thống lịch sử giao dịch chỉ tải dữ liệu một lần khi mở trang, không tự cập nhật khi có giao dịch mới. Ngoài ra, khi gửi token qua hàm `sendDonation` (gửi trực tiếp), hệ thống không gửi tin nhắn chat cho người nhận.

## Thay đổi

### 1. Thêm Realtime vào hook `useTransactionHistory`

**Tệp:** `src/hooks/useTransactionHistory.ts`

- Thêm 2 Supabase Realtime channel lắng nghe bảng `wallet_transactions` và `donation_transactions`
- Khi có INSERT mới (status = completed/success, tx_hash not null), tự động gọi `refresh()` để cập nhật danh sách
- Sử dụng debounce 500ms để tránh gọi quá nhiều lần khi có nhiều giao dịch cùng lúc
- Thêm lắng nghe `claim_requests` cho giao dịch rút thưởng

### 2. Gửi tin nhắn chat khi giao dịch thành công

**Tệp:** `src/lib/donation.ts`

Sau khi insert vào `wallet_transactions` thành công (dòng 101-111), thêm logic:
- Tìm hoặc tạo cuộc trò chuyện giữa người gửi và người nhận (`user_chats`)
- Gửi tin nhắn chat dạng "donation" với nội dung thông báo đã nhận token
- Chỉ gửi khi `toUserId` tồn tại (có người nhận trong hệ thống)

### 3. Đảm bảo tất cả token hiển thị đúng

Hiện tại dữ liệu đã có đủ các token:
- `wallet_transactions`: BTC, CAMLY, BNB, USDT (FUN sẽ xuất hiện khi có giao dịch FUN mới)
- `donation_transactions`: USDT, FUN, CAMLY, BNB

Không cần thay đổi gì thêm cho phần hiển thị - hook đã xử lý đúng tất cả token.

---

## Chi tiết kỹ thuật

### Realtime subscription (useTransactionHistory.ts)

```text
// Thêm useEffect mới với 3 channel:
// Channel 1: wallet_transactions (INSERT, status=completed)
// Channel 2: donation_transactions (INSERT + UPDATE to success)  
// Channel 3: claim_requests (INSERT + UPDATE to success)
// Mỗi event trigger refresh() với debounce 500ms
```

### Chat message khi gửi token (donation.ts)

```text
// Sau khi record transaction thành công:
if (toUserId) {
  // 1. Tìm chat hiện có hoặc tạo mới
  // 2. Insert chat_message type "donation"
  // 3. Nội dung: "Bạn đã nhận được {amount} {tokenSymbol}!"
}
```

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/hooks/useTransactionHistory.ts` | Thêm realtime subscription cho 3 bảng giao dịch |
| 2 | `src/lib/donation.ts` | Gửi tin nhắn chat khi giao dịch thành công |

Sau khi cập nhật, trang `/transactions` sẽ tự động hiển thị giao dịch mới ngay khi chúng xảy ra, và người nhận sẽ nhận được tin nhắn trong mục Messages.

