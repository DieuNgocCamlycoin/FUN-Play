
# Sửa lỗi gửi FUN trên Mobile

## Nguyên nhân gốc

Hệ thống ví sử dụng **Reown AppKit** với WalletConnect. Trên mobile, không có `window.ethereum` (chỉ có khi dùng in-app browser của MetaMask). Code hiện tại dùng `window.ethereum?.request()` để chuyển mạng sang BSC Testnet - lệnh này **thất bại âm thầm** trên mobile vì `window.ethereum` là `undefined`.

Ngoài ra, wagmi config chỉ đăng ký mạng BSC Mainnet (chain 56), không có BSC Testnet (chain 97), nên wagmi cũng không thể switch chain.

## Giải pháp

### 1. Thêm BSC Testnet vào cấu hình wagmi (`src/lib/web3Config.ts`)

- Import `bscTestnet` từ `@reown/appkit/networks`
- Thêm vào mảng `networks` để wagmi biết về mạng Testnet
- Điều này cho phép `switchChain` của wagmi hoạt động với chain 97

### 2. Sửa logic gửi FUN (`src/lib/donation.ts`)

Thay thế `window.ethereum?.request()` bằng `switchChain` từ `@wagmi/core`:

```text
Trước (không hoạt động trên mobile):
  await (window as any).ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x61' }],
  });

Sau (hoạt động trên cả web và mobile):
  import { switchChain, getWalletClient } from '@wagmi/core';
  await switchChain(wagmiConfig, { chainId: 97 });
  // Lấy lại walletClient sau khi đổi mạng
  const newWalletClient = await getWalletClient(wagmiConfig);
```

- Sau khi switch chain, cần tạo lại provider và signer từ walletClient mới
- Dùng `walletClient.transport` thay vì `window.ethereum` để tương thích WalletConnect
- Xoá toàn bộ logic `window.ethereum?.request` cho FUN

### 3. Sửa provider creation

Thay đổi cách tạo provider để ưu tiên walletClient transport (hoạt động với cả injected và WalletConnect):

```text
Trước:
  const provider = new ethers.BrowserProvider(
    (window as any).ethereum || walletClient.transport
  );

Sau:
  // Sau khi switchChain, lấy walletClient mới
  let activeWalletClient = walletClient;
  if (isFunToken) {
    await switchChain(wagmiConfig, { chainId: 97 });
    activeWalletClient = await getWalletClient(wagmiConfig);
  }
  const provider = new ethers.BrowserProvider(activeWalletClient.transport);
```

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/lib/web3Config.ts` | Thêm BSC Testnet vào networks |
| 2 | `src/lib/donation.ts` | Dùng wagmi `switchChain` thay vì `window.ethereum`, tạo lại provider sau khi đổi mạng |

Hai thay đổi này đảm bảo FUN hoạt động trên **cả mobile (WalletConnect) và desktop (injected wallet)**.
