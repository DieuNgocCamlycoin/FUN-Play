
# Kế Hoạch Hợp Nhất Nút "Claim Reward" và "Connect Wallet"

## 1. Phân Tích Hiện Trạng

### Các Thành Phần Hiện Có

| Component | File | Chức Năng |
|-----------|------|-----------|
| `ClaimRewardsButton` | `src/components/Rewards/ClaimRewardsButton.tsx` | Hiển thị khi có reward chưa claim, mở ClaimRewardsModal |
| `WalletButton` | `src/components/Web3/WalletButton.tsx` | Kết nối/ngắt ví, hiển thị địa chỉ, BSC chain |
| `MultiTokenWallet` | `src/components/Web3/MultiTokenWallet.tsx` | Hiển thị số dư token, kết nối ví |
| `ClaimRewardsModal` | `src/components/Rewards/ClaimRewardsModal.tsx` | Modal claim với đầy đủ logic wallet + claim |

### Vấn Đề Hiện Tại

1. **Quá nhiều nút trong header**: ClaimRewardsButton + MultiTokenWallet + FunWalletMiniWidget + CAMLYMiniWidget
2. **Logic phân tán**: Wallet connection logic có trong cả WalletButton, MultiTokenWallet và ClaimRewardsModal
3. **Trải nghiệm người dùng không tối ưu**: Người dùng phải click 2 nút khác nhau (kết nối ví → claim)
4. **ClaimRewardsButton ẩn khi không có reward**: Gây nhầm lẫn vì người dùng không biết tính năng này

---

## 2. Thiết Kế Mới: UnifiedClaimButton

### Concept: 1 Nút Thông Minh

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                    UNIFIED CLAIM BUTTON - STATES                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  STATE 1: Chưa đăng nhập                                                   │
│  ┌──────────────────────────────────┐                                      │
│  │ 🪙 Nhận Thưởng                   │  → Click → Navigate /auth            │
│  └──────────────────────────────────┘                                      │
│                                                                            │
│  STATE 2: Đã đăng nhập, chưa kết nối ví, có pending rewards                │
│  ┌──────────────────────────────────┐                                      │
│  │ 🪙 Nhận Thưởng [99+]             │  → Click → Mở modal với Connect Ví   │
│  │    Shimmer + Pulse Effect        │                                      │
│  └──────────────────────────────────┘                                      │
│                                                                            │
│  STATE 3: Đã kết nối ví, có pending rewards                                │
│  ┌──────────────────────────────────┐                                      │
│  │ 🪙 Claim [99+] | 0x1234...5678   │  → Click → Mở modal, claim ngay      │
│  │    Glow + Badge Animation        │                                      │
│  └──────────────────────────────────┘                                      │
│                                                                            │
│  STATE 4: Đã kết nối ví, không có pending rewards                          │
│  ┌──────────────────────────────────┐                                      │
│  │ 🪙 0x1234...5678 | BSC           │  → Click → Mở dropdown wallet        │
│  └──────────────────────────────────┘                                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Logic Flow

```text
User clicks button
        │
        ▼
┌─────────────────┐     NO      ┌─────────────────┐
│  User logged in?│ ──────────► │ Navigate /auth  │
└─────────────────┘             └─────────────────┘
        │ YES
        ▼
┌─────────────────┐     NO      ┌─────────────────┐
│ Has unclaimed   │ ──────────► │ Open wallet     │
│ rewards?        │             │ dropdown menu   │
└─────────────────┘             └─────────────────┘
        │ YES
        ▼
┌─────────────────┐
│ Open Claim Modal│  → Modal handles wallet connect if needed
│ (with rewards)  │  → Claim CAMLY on-chain
└─────────────────┘
```

---

## 3. Chi Tiết Component Mới

### 3.1. UnifiedClaimButton Component

**File:** `src/components/Rewards/UnifiedClaimButton.tsx`

**Props:**
```typescript
interface UnifiedClaimButtonProps {
  compact?: boolean;  // For mobile header (icon only)
}
```

**States to track:**
- `user`: Auth state from useAuth
- `isConnected`, `address`: From useWalletConnectionWithRetry
- `unclaimedCount`, `totalUnclaimed`: Pending rewards count
- `approvedUnclaimed`: Only approved rewards (can be claimed)
- `pendingApproval`: Rewards waiting for admin approval

**Display Logic:**
```typescript
// Button label logic
const getButtonLabel = () => {
  if (!user) return "Nhận Thưởng";
  if (!isConnected && totalUnclaimed > 0) return "Nhận Thưởng";
  if (isConnected && totalUnclaimed > 0) return "Claim";
  if (isConnected) return formatAddress(address);
  return "Kết nối ví";
};
```

**Animation Effects:**
- **Shimmer**: When has unclaimed rewards (draw attention)
- **Glow pulse**: Yellow → Cyan gradient pulsing
- **Badge bounce**: Red badge with count animating
- **Coin rotate**: Coins icon rotating continuously

### 3.2. Updated ClaimRewardsModal

**Changes needed:**
- Already has wallet connection logic built-in ✅
- Already handles both connected and disconnected states ✅
- No changes required to the modal itself

---

## 4. Files Cần Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Rewards/UnifiedClaimButton.tsx` | **TẠO MỚI** | Smart unified button |
| `src/components/Layout/Header.tsx` | SỬA | Thay ClaimRewardsButton + MultiTokenWallet bằng UnifiedClaimButton |
| `src/components/Layout/MobileHeader.tsx` | SỬA | Thay nút Coins + MultiTokenWallet bằng UnifiedClaimButton compact |
| `src/components/Rewards/ClaimRewardsButton.tsx` | XÓA | Không còn sử dụng |
| `src/components/Web3/WalletButton.tsx` | GIỮ NGUYÊN | Có thể dùng ở nơi khác |
| `src/components/Web3/MultiTokenWallet.tsx` | GIỮ NGUYÊN | Dùng trong dropdown của UnifiedClaimButton |

---

## 5. Thiết Kế UI Chi Tiết

### 5.1. Desktop Full Button (State 2: có rewards, chưa kết nối)

```css
/* Button Container */
background: linear-gradient(135deg, 
  rgba(255, 215, 0, 0.15), 
  rgba(0, 231, 255, 0.15)
);
border: 2px solid rgba(255, 215, 0, 0.5);
border-radius: 9999px; /* pill shape */
padding: 8px 16px;
box-shadow: 
  0 0 15px rgba(255, 215, 0, 0.4),
  0 0 30px rgba(0, 231, 255, 0.2);

/* Shimmer Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* Icon Rotation */
@keyframes coinSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 5.2. Desktop Connected State (hiển thị address + balance)

```text
┌─────────────────────────────────────────────────┐
│ 🪙 Claim [12]  │  0x1234...5678  │  BNB icon   │
└─────────────────────────────────────────────────┘
        │                  │              │
    Click claim     Click dropdown    BSC indicator
```

### 5.3. Mobile Compact Button

```text
┌───────────┐
│    🪙     │  ← Icon only, 7x7 size
│   [12]    │  ← Badge with count
└───────────┘
```

---

## 6. Dropdown Menu Khi Đã Kết Nối

```text
┌───────────────────────────────────────┐
│  Đã kết nối                          │
│  0x1234...5678                        │
│  ✓ BSC Mainnet                        │
├───────────────────────────────────────┤
│  Token Balances                       │
│  ┌─────────────────────────────────┐  │
│  │  BNB    │    0.1234            │  │
│  │  CAMLY  │    125,000           │  │
│  │  USDT   │    50.00             │  │
│  └─────────────────────────────────┘  │
├───────────────────────────────────────┤
│  🎮 Mở FUN Wallet                    │
│  🔗 Xem trên BscScan                 │
├───────────────────────────────────────┤
│  ❌ Ngắt kết nối                      │
└───────────────────────────────────────┘
```

---

## 7. Code Structure

### UnifiedClaimButton.tsx
```typescript
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coins, Wallet, ChevronDown, ExternalLink, LogOut, Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnectionWithRetry } from "@/hooks/useWalletConnectionWithRetry";
import { useFunWalletSync } from "@/hooks/useFunWalletSync";
import { supabase } from "@/integrations/supabase/client";
import { ClaimRewardsModal } from "./ClaimRewardsModal";
import { DropdownMenu, ... } from "@/components/ui/dropdown-menu";

export const UnifiedClaimButton = ({ compact = false }) => {
  const { user } = useAuth();
  const { isConnected, address, ... } = useWalletConnectionWithRetry();
  const [modalOpen, setModalOpen] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [totalUnclaimed, setTotalUnclaimed] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  
  // Fetch unclaimed rewards...
  
  // Determine button state and behavior
  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (totalUnclaimed > 0) {
      setModalOpen(true);  // Modal handles wallet connection
      return;
    }
    
    // If connected with no rewards, dropdown will handle
  };
  
  // Render based on state...
  
  return (
    <>
      {/* Button with conditional rendering */}
      {/* Dropdown for connected state without rewards */}
      <ClaimRewardsModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
```

---

## 8. Migration Plan

### Bước 1: Tạo UnifiedClaimButton
- Tạo file mới với đầy đủ logic
- Test độc lập

### Bước 2: Cập nhật Header.tsx
- Xóa import ClaimRewardsButton
- Xóa import MultiTokenWallet
- Thêm import UnifiedClaimButton
- Thay thế trong render

### Bước 3: Cập nhật MobileHeader.tsx
- Xóa nút Coins riêng lẻ
- Xóa MultiTokenWallet compact
- Thêm UnifiedClaimButton compact

### Bước 4: Xóa file cũ
- Xóa `ClaimRewardsButton.tsx` (logic đã được merge)

---

## 9. Test Cases

| Test | Mô Tả | Expected Result |
|------|-------|-----------------|
| Not logged in | Click button | Navigate to /auth |
| Logged in, no wallet | Click button | Modal opens with wallet connect UI |
| Logged in, no rewards, no wallet | Click button | Show connect wallet prompt |
| Logged in, has rewards, no wallet | Click button | Modal with wallet connection options |
| Connected, has rewards | Click button | Modal with Claim button ready |
| Connected, no rewards | Click button | Dropdown shows balances |
| Mobile compact | Tap button | Same behavior as desktop |
| Badge animation | Has unclaimed | Red badge pulses with count |

---

## 10. Các Thành Phần Không Thay Đổi

| Component | Lý Do |
|-----------|-------|
| ClaimRewardsModal | Đã có đầy đủ logic, không cần sửa |
| CAMLYMiniWidget | Hiển thị giá, giữ nguyên |
| FunWalletMiniWidget | Hiển thị FUN Wallet, giữ nguyên |
| claim-camly Edge Function | Backend không thay đổi |
| useWalletConnectionWithRetry | Hook tái sử dụng |

---

## 11. Kết Quả Sau Triển Khai

### Trước

```text
Header: [FUN Wallet] [CAMLY Price] [🪙 Claim] [💳 Wallet] [+ Tạo] [🔔] [👤]
Mobile: [FUN] [CAMLY] [🔍] [🪙] [💳] [+] [👼] [⬇] [🔔] [👤]
```

### Sau

```text
Header: [FUN Wallet] [CAMLY Price] [🪙 Unified Claim/Wallet] [+ Tạo] [🔔] [👤]
Mobile: [FUN] [CAMLY] [🔍] [🪙 Unified] [+] [👼] [⬇] [🔔] [👤]
```

**Lợi ích:**
- Giảm 1 nút trong header
- UX đơn giản hơn: 1 nút cho tất cả
- Logic tập trung, dễ maintain
- Mobile-friendly với compact mode
- Vẫn tương thích với hệ thống Admin và CAMLY claim tự động

