
# 🎁 Cập Nhật Thuật Ngữ: THƯỞNG & TẶNG / REWARD & DONATE

## 📋 Tổng Quan Thay Đổi

Thay thế tất cả từ ngữ liên quan đến "Tip", "Tặng thưởng" bằng thuật ngữ mới theo yêu cầu:

| Cũ | Mới (Tiếng Việt) | Mới (Tiếng Anh) |
|----|------------------|-----------------|
| Tip | Tặng | Donate |
| Tặng thưởng | Thưởng & Tặng | Reward & Donate |
| TipModal | DonateModal | DonateModal |
| sendTip | sendDonation | sendDonation |
| tipModalOpen | donateModalOpen | donateModalOpen |

---

## 📁 Danh Sách Files Cần Thay Đổi

### 1. Đổi Tên File
| File cũ | File mới |
|---------|----------|
| `src/components/Tipping/TipModal.tsx` | `src/components/Donate/DonateModal.tsx` |
| `src/lib/tipping.ts` | `src/lib/donation.ts` |

### 2. Cập Nhật Nội Dung

#### **DonateModal.tsx** (rename từ TipModal)
- `TipModal` → `DonateModal`
- `TipModalProps` → `DonateModalProps`
- `tipModalOpen` → `donateModalOpen`
- Dialog title: `Tip ${creatorName}` → `Tặng cho ${creatorName}`
- Dialog description: `"Gửi tiền cryptocurrency để ủng hộ creator"` → `"Thưởng & Tặng cho creator yêu thích của bạn"`
- Button: `"Gửi tiền"` → `"Tặng ngay"`

#### **donation.ts** (rename từ tipping.ts)
- `sendTip` → `sendDonation`
- `SendTipParams` → `SendDonationParams`
- Comments và error messages cập nhật tương ứng

#### **src/pages/Watch.tsx**
- Import: `TipModal` → `DonateModal`
- State: `tipModalOpen` → `donateModalOpen`
- `setTipModalOpen` → `setDonateModalOpen`
- Button text: `"Tip"` (dòng 669) → `"Tặng"` 

#### **src/pages/Wallet.tsx**
- Import: `sendTip` → `sendDonation`
- Function call: `sendTip({...})` → `sendDonation({...})`

#### **src/components/Web3/SendToFunWalletModal.tsx**
- Import: `sendTip` → `sendDonation`
- Function call: `sendTip({...})` → `sendDonation({...})`

---

## 📝 Chi Tiết Thay Đổi Code

### File 1: `src/components/Donate/DonateModal.tsx`

**Thay đổi:**
```tsx
// Interface
interface DonateModalProps { ... }

// Component
export const DonateModal = ({ ... }: DonateModalProps) => {
  // ...
}

// Dialog Title (dòng 115)
// Cũ: {manualAddress ? "Chuyển tiền thủ công" : `Tip ${creatorName}`}
// Mới: {manualAddress ? "Chuyển tiền thủ công" : `Tặng cho ${creatorName}`}

// Dialog Description (dòng 118)
// Cũ: "Gửi tiền cryptocurrency để ủng hộ creator"
// Mới: "Thưởng & Tặng cho creator yêu thích"

// Button text (dòng 203-204)
// Cũ: "Gửi tiền"
// Mới: "Tặng ngay"

// Import
import { sendDonation } from "@/lib/donation";
```

### File 2: `src/lib/donation.ts`

**Thay đổi:**
```tsx
// Interface
interface SendDonationParams { ... }

// Function
export const sendDonation = async ({ ... }: SendDonationParams) => {
  // ...
}

// Error message (dòng 32)
// Cũ: "Vui lòng kết nối ví để gửi tiền"
// Mới: "Vui lòng kết nối ví để tặng"
```

### File 3: `src/pages/Watch.tsx`

**Thay đổi:**
```tsx
// Import (dòng 10)
import { DonateModal } from "@/components/Donate/DonateModal";

// State (dòng 62)
const [donateModalOpen, setDonateModalOpen] = useState(false);

// Button onClick (dòng 666)
onClick={() => setDonateModalOpen(true)}

// Button text (dòng 669)
// Cũ: Tip
// Mới: Tặng

// Component usage (dòng 722-727)
<DonateModal
  open={donateModalOpen}
  onOpenChange={setDonateModalOpen}
  ...
/>
```

### File 4: `src/pages/Wallet.tsx`

**Thay đổi:**
```tsx
// Import (dòng 12)
import { sendDonation, getTransactionHistory } from "@/lib/donation";

// Function call (dòng 363)
await sendDonation({ ... });
```

### File 5: `src/components/Web3/SendToFunWalletModal.tsx`

**Thay đổi:**
```tsx
// Import (dòng 9)
import { sendDonation } from "@/lib/donation";

// Function call (dòng 92)
const result = await sendDonation({ ... });
```

---

## 🌐 Bảng Thuật Ngữ Đầy Đủ

| Context | Tiếng Việt | Tiếng Anh |
|---------|------------|-----------|
| Nút chính | Thưởng & Tặng | Reward & Donate |
| Nút trên video | Tặng | Donate |
| Modal title | Tặng cho {name} | Donate to {name} |
| Modal description | Thưởng & Tặng cho creator yêu thích | Reward & Donate to your favorite creator |
| Button confirm | Tặng ngay | Donate Now |
| Toast success | Tặng thành công! | Donation successful! |
| Transaction history | Đã tặng | Donated |
| Receipt | Biên nhận tặng | Donation Receipt |
| Leaderboard | Top Người Tặng | Top Donors |
| Sponsors section | Mạnh Thường Quân | Sponsors |

---

## 📊 Tóm Tắt

| Hạng mục | Số lượng |
|----------|----------|
| Files đổi tên | 2 |
| Files cập nhật nội dung | 5 |
| Từ khóa thay đổi | ~15 vị trí |

**Nguyên tắc:**
- UI hiển thị: Ưu tiên tiếng Việt ("Tặng", "Thưởng & Tặng")
- Code/Variable names: Dùng tiếng Anh ("donate", "donation")
- Không dùng từ "Tip" hay "Tặng thưởng" ở bất kỳ đâu trong UI
