
# Sửa lỗi gửi FUN và hiển thị số dư FUN

## Nguyên nhân

FUN Money contract (`0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2`) được deploy trên **BSC Testnet (chain 97)**, nhưng hệ thống đang đọc số dư từ **BSC Mainnet RPC** (`https://bsc-dataseed.binance.org/`). Kết quả là số dư FUN luôn trả về 0 và giao dịch gửi FUN thất bại.

## Giải pháp

Thêm logic phân biệt RPC dựa trên token: nếu token là FUN, dùng BSC Testnet RPC; các token khác vẫn dùng BSC Mainnet RPC.

---

### 1. Sửa hiển thị số dư FUN (`src/components/Donate/EnhancedDonateModal.tsx`)

**Thay đổi:** Trong `useEffect` fetch balance (dòng ~262-288), thêm điều kiện chọn RPC phù hợp:

```text
Trước:
  const BSC_RPC = "https://bsc-dataseed.binance.org/";
  const readProvider = new ethers.JsonRpcProvider(BSC_RPC);

Sau:
  const BSC_MAINNET_RPC = "https://bsc-dataseed.binance.org/";
  const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
  const isFunToken = tokenConfig.symbol === "FUN";
  const rpcUrl = isFunToken ? BSC_TESTNET_RPC : BSC_MAINNET_RPC;
  const readProvider = new ethers.JsonRpcProvider(rpcUrl);
```

### 2. Sửa gửi FUN token (`src/lib/donation.ts`)

**Thay đổi:** Trong hàm `sendDonation`, khi token là FUN, cần đảm bảo user đang ở đúng mạng (Testnet) hoặc sử dụng Testnet provider. Thêm logic chuyển mạng trước khi gửi:

```text
Trước:
  const provider = new ethers.BrowserProvider((window as any).ethereum || walletClient.transport);

Sau:
  const provider = new ethers.BrowserProvider((window as any).ethereum || walletClient.transport);

  // Nếu gửi FUN Money, cần chuyển sang BSC Testnet
  if (tokenAddress === "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2") {
    try {
      await (window as any).ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // BSC Testnet
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await (window as any).ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x61',
            chainName: 'BNB Smart Chain Testnet',
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
            nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
            blockExplorerUrls: ['https://testnet.bscscan.com'],
          }],
        });
      }
    }
    // Re-create provider after chain switch
    provider = new ethers.BrowserProvider((window as any).ethereum);
  }
```

### 3. Sửa hiển thị số dư FUN trong SendToFunWalletModal (`src/components/Web3/SendToFunWalletModal.tsx`)

**Thay đổi:** Cập nhật fetch balance CAMLY sang FUN nếu cần, hoặc ít nhất thêm logic RPC testnet cho FUN.

(Component này chỉ gửi CAMLY nên không cần sửa cho FUN.)

### 4. Sửa MultiTokenWallet (`src/components/Web3/MultiTokenWallet.tsx`)

**Thay đổi:** Kiểm tra và thêm logic tương tự - dùng Testnet RPC khi đọc số dư FUN.

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Donate/EnhancedDonateModal.tsx` | Dùng BSC Testnet RPC cho FUN token |
| 2 | `src/lib/donation.ts` | Chuyển sang BSC Testnet trước khi gửi FUN |
| 3 | `src/components/Web3/MultiTokenWallet.tsx` | Dùng BSC Testnet RPC cho FUN balance |
