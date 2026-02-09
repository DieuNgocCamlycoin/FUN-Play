

# KẾ HOẠCH CẬP NHẬT KẾT NỐI VÍ METAMASK TRÊN ĐIỆN THOẠI

---

## I. PHÂN TÍCH VẤN ĐỀ HIỆN TẠI

### Triệu chứng
Người dùng trên điện thoại (iOS/Android) khi nhấn kết nối ví MetaMask Mobile bị treo tại trạng thái "Đang kết nối..." và không thể hoàn thành quy trình.

### Nguyên nhân gốc rễ
1. **Package lỗi thời**: Dự án đang sử dụng `@web3modal/wagmi` phiên bản 5.1.11, đã bị deprecated vào năm 2024
2. **Không tương thích mobile**: Package cũ không hỗ trợ tối ưu cho deep link mobile trên iOS và Android
3. **Mismatch package**: File `package-lock.json` có `@reown/appkit` 1.8.1 nhưng `package.json` vẫn khai báo `@web3modal/wagmi`
4. **API cũ**: Mã hiện tại sử dụng `createWeb3Modal` (cũ) thay vì `createAppKit` (mới)

### Tại sao Extension hoạt động nhưng Mobile thì không?
- **Desktop Extension**: MetaMask Extension inject `window.ethereum` trực tiếp vào trình duyệt → kết nối tức thì qua injected provider
- **Mobile App**: Cần WalletConnect protocol để giao tiếp → cần deep link chính xác và session management

### Giải pháp: Nâng cấp lên Reown AppKit
**Reown AppKit** (phiên bản 2025 của Web3Modal):
- Hỗ trợ 100% cho mobile (iOS Safari, Android Chrome)
- Tự động phát hiện thiết bị và sử dụng deep link phù hợp
- Quản lý WalletConnect session tốt hơn
- Đã được sử dụng bởi Uniswap, PancakeSwap (production-ready)

---

## II. CHI TIẾT THỰC HIỆN

### PHASE 1: Cập nhật package.json

**Bước 1 - Xóa package cũ:**
```
"@web3modal/wagmi": "^5.1.11"
```

**Bước 2 - Thêm packages mới:**
```json
"@reown/appkit": "^1.8.1",
"@reown/appkit-adapter-wagmi": "^1.8.1"
```

**Bước 3 - Chạy lệnh**:
```bash
npm install
```

---

### PHASE 2: Viết lại `src/lib/web3Config.ts`

**Thay đổi imports:**
```typescript
// CỔ (deprecated)
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';

// MỚI (Reown AppKit 2025)
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc } from '@reown/appkit/networks';
```

**Tạo Wagmi Adapter:**
```typescript
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [bsc],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
```

**Khởi tạo AppKit:**
```typescript
let appKit: ReturnType<typeof createAppKit> | null = null;

export const initWeb3Modal = () => {
  if (!appKit && typeof window !== 'undefined') {
    appKit = createAppKit({
      adapters: [wagmiAdapter],
      networks: [bsc],
      projectId,
      metadata: {
        name: 'FUN PLAY',
        description: 'FUN PLAY - Nền tảng Video Web3 với Token CAMLY trên BSC',
        url: getMetadataUrl(),
        icons: ['/images/camly-coin.png']
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#facc15',
        '--w3m-border-radius-master': '12px',
      },
      featuredWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID, TRUST_WALLET_ID],
      features: {
        analytics: false,
        email: false,
        socials: [],
      }
    });
  }
  return appKit;
};

export const getWeb3Modal = () => {
  if (!appKit) {
    return initWeb3Modal();
  }
  return appKit;
};
```

---

### PHASE 3: Cập nhật `src/hooks/useWalletConnection.ts`

**Thay đổi hàm `connectWithMobileSupport()`:**

```typescript
const connectWithMobileSupport = useCallback(async (preferredWallet?: 'metamask' | 'bitget' | 'trust') => {
  try {
    setIsLoading(true);
    const isMobile = isMobileBrowser();
    
    // Nếu là mobile, AppKit sẽ tự động:
    // 1. Phát hiện nếu ứng dụng ví đã cài đặt
    // 2. Mở ứng dụng ví qua deep link
    // 3. Hoặc hiển thị QR code nếu chưa cài
    
    const modal = getWeb3Modal();
    if (modal) {
      if (isMobile) {
        logWalletDebug('Kết nối mobile - AppKit sẽ tự xử lý deep link');
      }
      await modal.open({ view: 'Connect' });
    }
  } catch (error) {
    console.error('Lỗi kết nối:', error);
  } finally {
    setIsLoading(false);
  }
}, []);
```

---

### PHASE 4: Cập nhật `src/hooks/useWalletConnectionWithRetry.ts`

**Giảm timeout:**
```typescript
const connectionTimeout = 10000; // 10 giây thay vì 15 (AppKit nhanh hơn)
```

**Loại bỏ progress simulation phức tạp:**
```typescript
// AppKit có UI riêng cho trạng thái kết nối
// Loại bỏ code progress bar thủ công không cần thiết
```

---

### PHASE 5: Kiểm tra `src/App.tsx` và `src/main.tsx`

**Đảm bảo:**
```typescript
// ✓ Import wagmiConfig từ web3Config.ts
import { wagmiConfig } from '@/lib/web3Config';

// ✓ WagmiProvider wrapping app
<WagmiProvider config={wagmiConfig}>
  {children}
</WagmiProvider>

// ✓ Không còn import initWeb3Modal ở main.tsx nữa
// AppKit tự khởi tạo khi cần
```

---

## III. BẢNG TỔNG HỢP THAY ĐỔI

| # | File | Kiểu | Mô Tả |
|---|------|------|-------|
| 1 | `package.json` | Cập nhật | Bỏ @web3modal/wagmi, thêm @reown/appkit |
| 2 | `src/lib/web3Config.ts` | Viết lại | Dùng `createAppKit` thay `createWeb3Modal` |
| 3 | `src/hooks/useWalletConnection.ts` | Cập nhật | Dùng `appKit.open()` thay `modal.open()` |
| 4 | `src/hooks/useWalletConnectionWithRetry.ts` | Cập nhật nhỏ | Giảm timeout, loại bỏ progress simulation |
| 5 | `src/App.tsx` | Kiểm tra | Đảm bảo WagmiProvider dùng wagmiConfig đúng |

---

## IV. QUY TRÌNH KẾT NỐI SAU KHI CẬP NHẬT

```
[Người dùng nhấn "Kết nối ví"]
         ↓
[appKit.open() được gọi]
         ↓
[AppKit phát hiện thiết bị]
         ↓
   ┌─────┬─────┐
   ↓     ↓     ↓
Desktop Mobile (iOS) Mobile (Android)
   ↓     ↓     ↓
 Modal  Deep link  Deep link
        MetaMask   MetaMask
   ↓     ↓     ↓
[Người dùng xác nhận kết nối]
         ↓
[Thiết lập session WalletConnect]
         ↓
[watchAccount() bắt sự kiện]
         ↓
[setIsConnected(true)]
         ↓
[Hiển thị địa chỉ ví] ✅
```

---

## V. KẾT QUẢ SAU KHI HOÀN THÀNH

| Trước | Sau |
|-------|-----|
| ❌ Kết nối Mobile bị treo | ✅ Kết nối Mobile thành công |
| ❌ Dùng @web3modal/wagmi cũ | ✅ Dùng Reown AppKit 2025 |
| ❌ Deep link không hoạt động | ✅ Deep link tự động bởi AppKit |
| ❌ Chỉ Extension hoạt động | ✅ Cả Extension + Mobile App hoạt động |
| ❌ Chưa cài ví: lỗi | ✅ Chưa cài ví: hiển thị QR code |

---

## VI. KIỂM TRA SAU KHI TRIỂN KHAI

**Trên Desktop:**
- [ ] Chrome + MetaMask Extension: kết nối thành công
- [ ] Firefox + MetaMask Extension: kết nối thành công

**Trên iPhone:**
- [ ] Safari + MetaMask App (đã cài): mở MetaMask App → kết nối
- [ ] Safari + MetaMask chưa cài: hiển thị QR code

**Trên Android:**
- [ ] Chrome + MetaMask App (đã cài): mở MetaMask App → kết nối
- [ ] Chrome + MetaMask chưa cài: hiển thị QR code

---

## VII. LƯU Ý QUAN TRỌNG

1. **VITE_WALLETCONNECT_PROJECT_ID** trong `.env` phải hợp lệ (đã kiểm tra: `438c4373...`)
2. **metadata.url** phải khớp với domain thực tế (`play.fun.rich`)
3. Sau khi deploy, **PHẢI kiểm tra trên thiết bị thực** (simulator không hỗ trợ ứng dụng ví)
4. AppKit tự động xử lý retry và reconnect → không cần code retry phức tạp
5. Toàn bộ deep link được AppKit quản lý → loại bỏ được hàm `getWalletDeepLink()` cũ

---

## VIII. THỨ TỰ TRIỂN KHAI

```
[1] Cập nhật package.json + npm install
         ↓
[2] Viết lại src/lib/web3Config.ts
         ↓
[3] Cập nhật src/hooks/useWalletConnection.ts
         ↓
[4] Cập nhật src/hooks/useWalletConnectionWithRetry.ts
         ↓
[5] Kiểm tra src/App.tsx + src/main.tsx
         ↓
[6] Test kết nối trên Desktop + Mobile
         ↓
[7] Deploy lên production
```

