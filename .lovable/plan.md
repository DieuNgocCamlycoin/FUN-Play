

# Sửa lỗi: Không gửi được CAMLY & USDT trên Mobile

## Nguyên nhân gốc

Qua phân tích console logs và dữ liệu, có **2 vấn đề chính**:

### Vấn đề 1: Thiếu logic chuyển mạng BSC Mainnet (ảnh hưởng mobile)

Trong `src/lib/donation.ts`, hệ thống chỉ có logic chuyển mạng cho **FUN Money** (BSC Testnet, chainId 97), nhưng **hoàn toàn thiếu** logic chuyển sang **BSC Mainnet (chainId 56)** cho CAMLY, USDT, BNB. Khi ví mobile (qua WalletConnect) đang ở mạng khác (Ethereum, Polygon...), giao dịch sẽ thất bại ngay lập tức.

### Vấn đề 2: Giao dịch "pending" bị kẹt

Hiện có **20+ giao dịch CAMLY/USDT** ở trạng thái "pending" mà không có tx_hash. Các giao dịch này sẽ không bao giờ hoàn tất và gây nhiễu trong lịch sử.

### Vấn đề phụ: Build error

File `src/lib/pushNotifications.ts` có lỗi TypeScript: `pushManager` không tồn tại trên type `ServiceWorkerRegistration`.

## Giải pháp

### 1. Thêm chuyển mạng BSC Mainnet cho CAMLY/USDT/BNB

**Tep:** `src/lib/donation.ts`

Cau truc hien tai chi xu ly FUN:
```text
if (isFunToken) {
  switchChain(97);  // BSC Testnet
}
// CAMLY/USDT/BNB -> khong chuyen mang -> that bai tren mobile
```

Cau truc moi:
```text
if (isFunToken) {
  switchChain(97);   // BSC Testnet cho FUN
} else {
  switchChain(56);   // BSC Mainnet cho CAMLY/USDT/BNB
}
// Re-fetch walletClient sau khi chuyen mang
```

Chi tiet:
- Thêm block `else` để chuyển sang BSC Mainnet (chainId 56) cho tất cả token BSC không phải FUN
- Sử dụng cùng pattern: `switchChain` -> `wallet_addEthereumChain` fallback -> hướng dẫn thủ công
- Thông số BSC Mainnet: RPC `https://bsc-dataseed.binance.org/`, chainId `0x38`, symbol `BNB`
- Re-fetch `walletClient` sau khi chuyển mạng thành công
- Di chuyển logic re-fetch ra ngoài cả 2 block if/else để tránh trùng code

### 2. Dọn dẹp giao dịch pending bị kẹt

Cập nhật tất cả giao dịch đang "pending" mà không có tx_hash thành "failed":
```text
UPDATE donation_transactions
SET status = 'failed'
WHERE status = 'pending' AND tx_hash IS NULL;
```

### 3. Sửa build error pushNotifications.ts

**Tep:** `src/lib/pushNotifications.ts`

Thêm type assertion cho `registration` khi truy cập `pushManager` hoặc thêm type guard:
```text
const reg = registration as any;
let subscription = await reg.pushManager.getSubscription();
```

## Tóm tắt thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/lib/donation.ts` | Thêm switchChain(56) cho CAMLY/USDT/BNB trên BSC Mainnet, refactor logic chuyển mạng |
| 2 | `src/lib/pushNotifications.ts` | Sửa TypeScript error cho pushManager |
| 3 | Database | Cập nhật giao dịch pending bị kẹt thành failed |

Sau khi sửa, người dùng trên mobile sẽ được tự động chuyển sang đúng mạng BSC khi gửi bất kỳ token nào (CAMLY, USDT, BNB trên Mainnet hoặc FUN trên Testnet).

