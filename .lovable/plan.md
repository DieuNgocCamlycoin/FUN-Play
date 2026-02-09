
# KẾ HOẠCH CẬP NHẬT TÊN VÀ AVATAR CHO VÍ HỆ THỐNG FUN PLAY

---

## I. YÊU CẦU TỪ USER

User muốn 2 ví hệ thống hiển thị tên và avatar FUN PLAY trong lịch sử giao dịch:

| Ví | Địa Chỉ | Tên Hiển Thị | Avatar |
|----|---------|--------------|--------|
| **Ví Tặng & Thưởng** | `0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8` | "FUN PLAY TẶNG & THƯỞNG" | Logo FUN PLAY |
| **Ví Treasury** | `0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998` | "FUN PLAY TREASURY" | Logo FUN PLAY |

---

## II. PHÂN TÍCH HIỆN TẠI

### Các File Liên Quan
1. **`src/hooks/useTransactionHistory.ts`**: Hook xử lý normalization giao dịch
2. **`src/components/Transactions/TransactionCard.tsx`**: Component hiển thị giao dịch
3. **`src/lib/web3Config.ts`**: Đã có `REWARD_WALLET_ADDRESS` cho ví Treasury

### Logic Hiện Tại (trong `useTransactionHistory.ts`)
- Dòng 313-355: Normalize `claim_requests` → Đã hardcode "FUN PLAY Treasury" cho sender
- Dòng 263-311: Normalize `donation_transactions` → Dùng profile từ database
- Dòng 357-401: Normalize `wallet_transactions` → Dùng profile từ database

### Avatar Path Có Sẵn
- `/images/fun-play-wallet-icon.png` - Đang được sử dụng cho claim_requests

### Vấn Đề Cần Giải Quyết
1. **Ví Tặng & Thưởng (`0x8f09...0E8`)**: Chưa được nhận diện đặc biệt
2. **Ví Treasury (`0x1DC2...998`)**: Đã nhận diện cho claim, nhưng khi là sender/receiver trong donation/wallet_transactions thì chưa

---

## III. GIẢI PHÁP

### Phương án: Tạo Config System Wallets + Override trong Normalization

#### Bước 1: Tạo System Wallet Config
**File**: `src/config/systemWallets.ts` (mới)

```typescript
// Cấu hình các ví hệ thống FUN PLAY
export const SYSTEM_WALLETS = {
  // Ví tặng thưởng & airdrop
  REWARD: {
    address: "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8",
    displayName: "FUN PLAY TẶNG & THƯỞNG",
    username: "@funplayreward",
    channelName: "FUN PLAY TẶNG & THƯỞNG",
    avatarUrl: "/images/fun-play-wallet-icon.png",
  },
  // Ví Treasury (claim, distribution)
  TREASURY: {
    address: "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",
    displayName: "FUN PLAY TREASURY",
    username: "@funplaytreasury",
    channelName: "FUN PLAY TREASURY",
    avatarUrl: "/images/fun-play-wallet-icon.png",
  },
};

// Helper function: Check if address is a system wallet
export function getSystemWalletInfo(address: string | null | undefined) {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  
  if (normalizedAddress === SYSTEM_WALLETS.REWARD.address.toLowerCase()) {
    return SYSTEM_WALLETS.REWARD;
  }
  if (normalizedAddress === SYSTEM_WALLETS.TREASURY.address.toLowerCase()) {
    return SYSTEM_WALLETS.TREASURY;
  }
  
  return null;
}

// Check if wallet is any system wallet
export function isSystemWallet(address: string | null | undefined): boolean {
  return getSystemWalletInfo(address) !== null;
}
```

#### Bước 2: Cập Nhật Hook `useTransactionHistory.ts`
**Thay đổi**:
1. Import `getSystemWalletInfo` từ config
2. Trong mỗi normalize block (donation, claim, wallet), check nếu address là system wallet → override display info

**Logic cập nhật**:
```typescript
// Import ở đầu file
import { getSystemWalletInfo } from "@/config/systemWallets";

// Trong normalize donation_transactions (khoảng dòng 262-311)
// Sau khi có senderInfo, receiverInfo từ profiles:

// Check if sender is system wallet
const senderSystemWallet = getSystemWalletInfo(senderProfile?.wallet_address);
const finalSenderInfo = senderSystemWallet || senderInfo;

// Check if receiver is system wallet  
const receiverSystemWallet = getSystemWalletInfo(receiverProfile?.wallet_address);
const finalReceiverInfo = receiverSystemWallet || receiverInfo;

// Sử dụng finalSenderInfo, finalReceiverInfo thay vì senderInfo, receiverInfo
```

#### Bước 3: Cập Nhật `src/lib/web3Config.ts` (Optional - Sync Reference)
- Cập nhật `REWARD_WALLET_ADDRESS` để reference từ config mới
- Hoặc giữ nguyên nếu không muốn breaking changes

---

## IV. CHI TIẾT TRIỂN KHAI

### File 1: `src/config/systemWallets.ts` (TẠO MỚI)
**Nội dung**: Config 2 ví hệ thống với tên, avatar, username

**Dòng code**: ~40 dòng

### File 2: `src/hooks/useTransactionHistory.ts` (CẬP NHẬT)
**Thay đổi**:
1. **Dòng 1-5**: Thêm import `getSystemWalletInfo`
2. **Dòng 262-311 (Normalize donation)**: 
   - Check sender wallet → System wallet override
   - Check receiver wallet → System wallet override
3. **Dòng 313-355 (Normalize claim)**: 
   - Giữ nguyên (đã hardcode FUN PLAY Treasury)
   - Hoặc refactor dùng config
4. **Dòng 357-401 (Normalize wallet_transactions)**:
   - Check from_address → System wallet override
   - Check to_address → System wallet override

**Dòng code thay đổi**: ~30 dòng

---

## V. BẢNG TỔNG HỢP

| # | File | Loại | Phức Tạp | Dòng | Mô Tả |
|---|------|------|----------|------|-------|
| 1 | `src/config/systemWallets.ts` | Tạo mới | ⭐⭐ | ~40 | Config 2 ví hệ thống |
| 2 | `src/hooks/useTransactionHistory.ts` | Cập nhật | ⭐⭐⭐ | ~30 | Override display info cho system wallets |

**Tổng dòng**: ~70 dòng  
**Phức tạp**: ⭐⭐⭐ (Trung bình)  
**Thời gian**: 20-30 phút

---

## VI. KỲ VỌNG SAU TRIỂN KHAI

### Hiển Thị Trong Lịch Sử Giao Dịch

**Trước**:
```
[Avatar user] Unknown User → [Avatar user] Angel Diệu Ngọc
Ví: 0x8f09...0E8 → 0x1234...5678
```

**Sau**:
```
[Logo FUN PLAY] FUN PLAY TẶNG & THƯỞNG → [Avatar user] Angel Diệu Ngọc
Ví: 0x8f09...0E8 → 0x1234...5678
```

### Các Trường Hợp Được Xử Lý

| Trường Hợp | Sender | Receiver | Hiển Thị |
|------------|--------|----------|----------|
| User donate cho User | User A | User B | Avatar A → Avatar B |
| System tặng cho User | FUN PLAY TẶNG & THƯỞNG | User B | Logo FUN PLAY → Avatar B |
| User claim từ Treasury | FUN PLAY TREASURY | User A | Logo FUN PLAY → Avatar A |
| System transfer | FUN PLAY TẶNG & THƯỞNG | FUN PLAY TREASURY | Logo → Logo |

### Tính Năng Bổ Sung
- ✅ Avatar logo FUN PLAY cho cả 2 ví
- ✅ Tên tiếng Việt thân thiện
- ✅ Username chuẩn (@funplayreward, @funplaytreasury)
- ✅ Channel name đồng bộ
- ✅ Không cần click để xem profile (vì là system wallet)

---

## VII. NGUYÊN TẮC BẢO MẬT

| Dữ Liệu | Hiển Thị | Lý Do |
|---------|----------|-------|
| Địa chỉ ví hệ thống | ✅ PUBLIC | Web3 standard, minh bạch |
| Tên ví hệ thống | ✅ PUBLIC | Branding FUN PLAY |
| Logo FUN PLAY | ✅ PUBLIC | Asset có sẵn |
| Giao dịch onchain | ✅ PUBLIC | Đã verified blockchain |

---

## VIII. BACKLOG (Tương Lai)

1. Thêm tooltip "Đây là ví hệ thống FUN PLAY" khi hover
2. Disable click vào avatar ví hệ thống (vì không có profile page)
3. Thêm badge "Official" cho ví hệ thống
4. Sync config với `.env` nếu cần thay đổi địa chỉ ví
