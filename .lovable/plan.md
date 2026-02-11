
# Sửa lỗi: Gửi CAMLY báo "không đủ số dư" dù ví có đủ tiền

## Nguyên nhân gốc

Lỗi xảy ra do **ví hiển thị số dư và ví gửi giao dịch là 2 ví khác nhau**:

- **Ví lưu trong hồ sơ (database):** `0x0673531BF766753f...` -- ví này có 654,800 CAMLY
- **Ví đang kết nối (WalletConnect):** `0x22e154FE6B2859...` -- ví này KHÔNG có đủ CAMLY

Giao diện đọc số dư từ `senderProfile.wallet_address` (ví trong database), nhưng khi gửi giao dịch, hệ thống dùng `getWalletClient` từ wagmi (ví đang kết nối). Nếu 2 ví này khác nhau, số dư hiển thị sai so với ví thực tế gửi tiền.

## Giải pháp

### 1. Đồng bộ địa chỉ ví: hiển thị số dư từ ví đang kết nối

**Tệp:** `src/components/Donate/EnhancedDonateModal.tsx`

Thay đổi thứ tự ưu tiên khi đọc số dư: lấy địa chỉ ví đang kết nối (wagmi) TRƯỚC, chỉ fallback về `senderProfile.wallet_address` nếu wagmi không có.

```text
// Hiện tại (SAI):
let walletAddress = senderProfile?.wallet_address;  // DB wallet
if (!walletAddress) { walletAddress = wagmiAccount; } // fallback

// Sau khi sửa (ĐÚNG):
let walletAddress = wagmiAccount;  // Connected wallet (ưu tiên)
if (!walletAddress) { walletAddress = senderProfile?.wallet_address; } // fallback
```

### 2. Thêm cảnh báo khi ví kết nối khác ví trong hồ sơ

**Tệp:** `src/components/Donate/EnhancedDonateModal.tsx`

Hiển thị cảnh báo rõ ràng khi ví đang kết nối khác với ví lưu trong hồ sơ, giúp người dùng biết giao dịch sẽ gửi từ ví nào.

### 3. Kiểm tra số dư trước khi gửi giao dịch (pre-flight check)

**Tệp:** `src/lib/donation.ts`

Thêm bước kiểm tra số dư on-chain trước khi thực hiện giao dịch, đưa ra thông báo lỗi rõ ràng hơn (hiển thị số dư thực tế vs số tiền muốn gửi).

```text
// Trước khi gọi transfer():
const balance = await tokenContract.balanceOf(fromAddress);
const needed = ethers.parseUnits(amount.toString(), decimals);
if (balance < needed) {
  throw new Error(
    `Số dư không đủ. Ví ${fromAddress.slice(0,6)}...${fromAddress.slice(-4)} ` +
    `chỉ có ${ethers.formatUnits(balance, decimals)} ${tokenSymbol}, ` +
    `cần ${amount} ${tokenSymbol}`
  );
}
```

## Tóm tắt thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Donate/EnhancedDonateModal.tsx` | Ưu tiên đọc số dư từ ví đang kết nối (wagmi) thay vì ví trong DB |
| 2 | `src/components/Donate/EnhancedDonateModal.tsx` | Thêm cảnh báo khi ví kết nối khác ví hồ sơ |
| 3 | `src/lib/donation.ts` | Thêm pre-flight balance check trước khi gửi giao dịch |

Sau khi sửa, số dư hiển thị sẽ luôn khớp với ví thực tế gửi giao dịch, và người dùng sẽ nhận được thông báo rõ ràng nếu số dư không đủ.
