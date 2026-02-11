

# Sửa lỗi: Không hiện thông báo nhận FUN và không hiện trong lịch sử

## Nguyên nhân

Sau khi phân tích kỹ code và dữ liệu, phát hiện **3 vấn đề chính**:

### Vấn đề 1: Thông báo realtime chỉ theo dõi `wallet_transactions` nhưng bỏ qua `donation_transactions`

Component `GlobalPaymentNotifications` chỉ lắng nghe bảng `wallet_transactions`. Tuy nhiên, luồng tặng qua modal (EnhancedDonateModal) lưu giao dịch chính vào bảng `donation_transactions` (qua edge function `create-donation` + `confirm-bsc-donation`). Ngoài ra, hàm `sendDonation` cũng insert vào `wallet_transactions`, nhưng trường `to_user_id` đôi khi bị null (khi không tìm được profile theo wallet address), khiến filter realtime `to_user_id=eq.{userId}` không bắt được.

### Vấn đề 2: Truy vấn đếm sai trạng thái

Trong `GlobalPaymentNotifications`, truy vấn đếm dùng `.eq('status', 'success')` nhưng dữ liệu thực tế trong `wallet_transactions` lưu `status = 'completed'`. Kết quả: count luôn trả về 0.

### Vấn đề 3: Lấy số dư FUN thất bại trên mobile

Trên mobile (WalletConnect), `window.ethereum` không tồn tại. Code hiện tại kiểm tra `!(window as any).ethereum` và bỏ qua việc fetch balance. Cần lấy wallet address từ profile thay vì từ `window.ethereum`.

---

## Giải pháp

### 1. Sửa `GlobalPaymentNotifications` - Thêm lắng nghe `donation_transactions`

**Tệp:** `src/components/Web3/GlobalPaymentNotifications.tsx`

- Thêm channel thứ 2 lắng nghe `donation_transactions` với filter `receiver_id=eq.{userId}` và `status=eq.success`
- Sửa truy vấn đếm từ `status = 'success'` thành `status = 'completed'` cho `wallet_transactions`
- Khi nhận event từ `donation_transactions`, fetch token symbol từ `donate_tokens` để hiện đúng tên token

### 2. Sửa status filter trong count query

**Tệp:** `src/components/Web3/GlobalPaymentNotifications.tsx`

Thay:
```text
.eq('status', 'success')
```
Thành:
```text
.in('status', ['success', 'completed'])
```

### 3. Sửa balance fetch trên mobile

**Tệp:** `src/components/Donate/EnhancedDonateModal.tsx`

- Xoá kiểm tra `window.ethereum` khi lấy wallet address để fetch balance
- Ưu tiên dùng `senderProfile.wallet_address` (đã có sẵn từ DB)
- Chỉ dùng wagmi `getAccount` làm fallback thay vì `window.ethereum`
- Sửa `isBscNoWallet`: kiểm tra `!senderProfile?.wallet_address` thay vì `!window.ethereum`

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `GlobalPaymentNotifications.tsx` | Thêm lắng nghe `donation_transactions`, sửa status filter |
| 2 | `EnhancedDonateModal.tsx` | Sửa balance fetch trên mobile, bỏ phụ thuộc `window.ethereum` |

