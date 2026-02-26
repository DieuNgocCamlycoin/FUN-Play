

## Chẩn đoán vấn đề

Nút MINT trên trang cá nhân không hoạt động vì **hai hệ thống ví hoạt động độc lập**:

- **Hệ thống chính** (wagmi/Reown AppKit): `useWalletConnection` → `useWalletConnectionWithRetry` → `WalletContext`. Đây là hệ thống người dùng thực tế sử dụng để kết nối ví.
- **Hệ thống FUN Money** (`useFunMoneyWallet`): Truy cập trực tiếp `window.ethereum` (chỉ hoạt động với MetaMask). Khi người dùng kết nối ví qua AppKit, hook này không nhận diện được → `isWalletConnected = false` → nút hiển thị "Kết Nối Ví" thay vì "MINT NOW".

## Kế hoạch sửa lỗi

### Bước 1: Cập nhật `useFunMoneyWallet` để lấy trạng thái từ wagmi

Viết lại `src/hooks/useFunMoneyWallet.ts` để:
- Import `useWalletContext` từ `WalletContext` làm nguồn chính cho `isConnected`, `address`, `chainId`
- Tạo `provider`/`signer` từ `window.ethereum` (vẫn cần cho EIP-712 signing) nhưng **chỉ khi đã xác nhận kết nối qua wagmi**
- Hàm `connect()` gọi `connectWithRetry()` từ `WalletContext` thay vì gọi trực tiếp `eth_requestAccounts`
- Giữ `switchToBscTestnet()` hoạt động bình thường
- BSC Testnet chain ID = 97, nhưng hệ thống chính dùng BSC Mainnet (chain ID = 56). Cần xử lý logic `isCorrectChain` phù hợp

### Bước 2: Cập nhật `MintableCard` 

- Nút "Kết Nối Ví" gọi `connect()` từ hook đã cập nhật (sẽ mở AppKit modal)
- Khi ví đã kết nối nhưng sai chain → hiển thị nút "Chuyển sang BSC Testnet" thay vì chặn hoàn toàn

### Bước 3: Cập nhật `FunMoneyPage`

- Thay `useFunMoneyWallet()` bằng `useWalletContext()` cho các thông tin hiển thị trạng thái ví
- Hoặc giữ `useFunMoneyWallet()` vì nó đã được cập nhật ở bước 1

## Chi tiết kỹ thuật

Cấu trúc hook mới `useFunMoneyWallet`:

```typescript
// Lấy trạng thái từ WalletContext (wagmi)
const walletCtx = useWalletContext();

// Derive state
const isConnected = walletCtx.isConnected;
const address = walletCtx.address;
const chainId = walletCtx.chainId;
const isCorrectChain = chainId === 97; // BSC Testnet

// Tạo ethers signer khi cần (cho EIP-712)
const getSigner = async () => {
  const ethereum = window.ethereum;
  if (!ethereum) throw new Error('Không tìm thấy ví');
  const provider = new BrowserProvider(ethereum);
  return provider.getSigner();
};

// Connect = mở AppKit modal
const connect = () => walletCtx.connectWithRetry();
```

Lưu ý: Hệ thống chính đang cấu hình cho BSC Mainnet (chain 56), nhưng FUN Money cần BSC Testnet (chain 97). Cần giữ nguyên logic `switchToBscTestnet` để người dùng chuyển chain sau khi kết nối.

