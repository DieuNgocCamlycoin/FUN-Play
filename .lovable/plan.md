

# KẾ HOẠCH TRIỂN KHAI: PHƯƠNG ÁN 1 - CẢNH BÁO KHI KẾT NỐI VÍ KHÁC

---

## I. PHÂN TÍCH VẤN ĐỀ

### Tình huống hiện tại
- Người dùng kết nối ví **A (0x1234...)** trên laptop → lưu vào `profiles.wallet_address`
- Người dùng kết nối ví **B (0x5678...)** trên điện thoại → ghi đè `profiles.wallet_address`
- Dữ liệu DB không đồng bộ → reward có thể gửi sai ví

### Giải pháp
Thêm dialog xác nhận khi phát hiện ví mới khác với ví cũ:
```
[Ví cũ: 0x1234...]
[Ví mới: 0x5678...]
  ↓
[Hiển thị dialog cảnh báo]
  ↓
[Người dùng chọn]:
  • Cập nhật ví mới → ghi đè vào DB
  • Giữ nguyên ví cũ → disconnect ví mới, quay lại
```

---

## II. CHI TIẾT THỰC HIỆN

### PHASE 1: Tạo Component Dialog Cảnh Báo

**File mới: `src/components/Web3/WalletChangeConfirmDialog.tsx`**
- Dialog xác nhận khi ví khác
- Hiển thị: ví cũ (từ DB) vs ví mới (vừa kết nối)
- 2 button: "Cập nhật ví mới" | "Giữ ví cũ"
- Thêm warning icon và thông báo rủi ro
- ~80 dòng code

**Nội dung component:**
```typescript
interface WalletChangeConfirmDialogProps {
  open: boolean;
  oldAddress: string;
  newAddress: string;
  oldWalletType: string;
  newWalletType: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;  // Update wallet
  onCancel: () => Promise<void>;   // Revert to old
}
```

---

### PHASE 2: Cập nhật `src/hooks/useWalletConnection.ts`

**Thêm state và logic kiểm tra:**
- `previousAddress`: lưu ví cũ từ DB khi lần đầu init
- `showWalletChangeDialog`: state hiện/ẩn dialog
- `pendingNewAddress` & `pendingNewWalletType`: lưu ví mới tạm thời
- `handleConfirmWalletChange()`: xác nhận cập nhật ví
- `handleCancelWalletChange()`: hủy và disconnect ví mới

**Logic kiểm tra:**
```typescript
// Trong watchAccount onChange:
if (newAddress !== previousAddress && previousAddress !== null) {
  // Ví khác với ví cũ
  setShowWalletChangeDialog(true);
  setPendingNewAddress(newAddress);
  // Dừng lại, chờ xác nhận từ dialog
} else {
  // Ví mới = ví cũ, hoặc lần đầu kết nối
  await saveWalletToDb(newAddress, type);
}
```

**Hàm xử lý:**
```typescript
const handleConfirmWalletChange = async () => {
  // Cập nhật ví mới vào DB
  await saveWalletToDb(pendingNewAddress, pendingWalletType);
  setShowWalletChangeDialog(false);
  // UI tự động cập nhật
};

const handleCancelWalletChange = async () => {
  // Ngắt kết nối ví mới
  await disconnect(wagmiConfig);
  setShowWalletChangeDialog(false);
  // Quay lại trạng thái cũ
  setAddress(previousAddress);
};
```

---

### PHASE 3: Cập nhật `src/hooks/useWalletConnectionWithRetry.ts`

**Thêm 2 prop mới từ `useWalletConnection`:**
```typescript
return {
  ...walletConnection,
  showWalletChangeDialog,
  walletChangeDetails,
  handleConfirmWalletChange,
  handleCancelWalletChange,
  // ... other returns
};
```

---

### PHASE 4: Tích hợp Dialog vào UI

**Option A: Thêm vào `src/pages/Wallet.tsx`**
```typescript
const {
  showWalletChangeDialog,
  walletChangeDetails,
  handleConfirmWalletChange,
  handleCancelWalletChange
} = useWalletConnectionWithRetry();

return (
  <>
    <MainLayout>{/* ... existing UI */}</MainLayout>
    <WalletChangeConfirmDialog
      open={showWalletChangeDialog}
      oldAddress={walletChangeDetails?.oldAddress}
      newAddress={walletChangeDetails?.newAddress}
      onConfirm={handleConfirmWalletChange}
      onCancel={handleCancelWalletChange}
    />
  </>
);
```

**Option B: Thêm vào `src/App.tsx`** (toàn cục)
- Dialog hiển thị ở bất kỳ route nào khi phát hiện ví khác
- Khuyến cáo hơn vì xử lý ở mọi nơi

---

### PHASE 5: Xử Lý Edge Case

**Case 1: Lần đầu kết nối (previousAddress = null)**
- Không hiển thị dialog
- Trực tiếp lưu vào DB

**Case 2: Ví cùng một địa chỉ nhưng loại khác**
- Ví: 0x1234... (MetaMask) → 0x1234... (Bitget)
- **Hỏi:** Có cần cảnh báo không? Hoặc tự động cập nhật?
- **Khuyến cáo:** Tự động cập nhật (vì cùng địa chỉ)

**Case 3: Người dùng disconnect ví mới trước khi click button**
- Dialog tự động đóng (vì `showWalletChangeDialog` state sẽ reset)

**Case 4: Người dùng không phản hồi lâu**
- Dialog vẫn mở → user tự quyết định
- Có thể thêm timeout 5 phút sau đó tự disconnect (optional)

---

## III. BẢNG TỔNG HỢP THAY ĐỔI

| # | File | Loại | Mô Tả | Dòng |
|---|------|------|-------|------|
| 1 | `src/components/Web3/WalletChangeConfirmDialog.tsx` | **Tạo mới** | Dialog xác nhận đổi ví | ~80 |
| 2 | `src/hooks/useWalletConnection.ts` | Cập nhật | Thêm state + logic kiểm tra ví | ~80 thêm |
| 3 | `src/hooks/useWalletConnectionWithRetry.ts` | Cập nhật nhỏ | Expose dialog state + handler | ~10 thêm |
| 4 | `src/pages/Wallet.tsx` | Cập nhật | Thêm `<WalletChangeConfirmDialog />` | ~20 thêm |
| 5 | `src/App.tsx` | Cập nhật (optional) | Toàn cục dialog nếu chọn Option B | ~20 thêm |

---

## IV. FLOW UX ĐẦY ĐỦ

```
[Scenario: User kết nối ví khác]

[Trên Laptop - User đã kết nối ví A]
   wallet_address = "0x1234...5678"
   
[Trên Điện thoại - User kết nối ví B]
   account.address = "0x9abc...def0"
   
[watchAccount bắt sự kiện]
   ↓
[Kiểm tra: 0x9abc != 0x1234? → YES]
   ↓
[setShowWalletChangeDialog(true)]
[setPendingNewAddress("0x9abc...")]
   ↓
[Dialog xuất hiện]
┌─────────────────────────────────┐
│ ⚠️ Thay Đổi Ví Kết Nối          │
├─────────────────────────────────┤
│ Bạn đang cố kết nối ví khác      │
│                                  │
│ Ví cũ: 0x1234...5678           │
│ Ví mới: 0x9abc...def0           │
│                                  │
│ ⚠️ Lưu ý: Reward CAMLY sẽ gửi  │
│    đến ví mới. Chắc chắn không? │
│                                  │
│ [Giữ ví cũ] [Cập nhật ví mới]   │
└─────────────────────────────────┘
   
[User chọn "Cập nhật ví mới"]
   ↓
[handleConfirmWalletChange()]
   ↓
[await saveWalletToDb("0x9abc...", "metamask")]
   ↓
[setShowWalletChangeDialog(false)]
   ↓
[setAddress("0x9abc...")]
[setIsConnected(true)]
   ↓
[UI cập nhật → Hiển thị ví mới]
   ↓
[setConnectionStep("connected")] ✅

---

[User chọn "Giữ ví cũ"]
   ↓
[handleCancelWalletChange()]
   ↓
[await disconnect(wagmiConfig)]
   ↓
[setShowWalletChangeDialog(false)]
   ↓
[setAddress("0x1234...")]
[setIsConnected(false)] 
   ↓
[UI quay lại trạng thái cũ]
   ↓
[Toast: "Đã hủy kết nối ví mới"]
```

---

## V. CODE PATTERN DÙNG TRONG DỰ ÁN

**Dialog pattern:** Từ `src/components/Web3/WalletSelectionModal.tsx`
- Dùng `Dialog` từ shadcn/ui
- Header + Content + Footer layout
- Dialog props: `open`, `onOpenChange`

**Hook pattern:** Từ `src/hooks/useWalletConnection.ts`
- State management với `useState`
- Callback với `useCallback`
- Effect với `useEffect`
- Supabase update: `supabase.from('profiles').update({...})`

**Toast pattern:** Từ `useToast()` hook
- Success: title + description
- Error: variant="destructive"

**Address format:** `formatAddress()` từ Wallet.tsx
- `addr.slice(0, 6) + "..." + addr.slice(-4)`

---

## VI. LƯU Ý QUAN TRỌNG

1. **Không ghi đè DB trước khi xác nhận** → Dùng state tạm `pendingNewAddress`
2. **Disconnect đúng cách** → Gọi `disconnect(wagmiConfig)` từ wagmi
3. **previousAddress lấy ở đâu?**
   - Init lần đầu từ `getAccount(wagmiConfig)` hoặc query DB
   - Lưu thành state `previousAddress`
4. **Mobile case:** Dialog hiển thị bình thường trên mobile (fullscreen)
5. **Khóa nút khi đang xử lý** → `isLoading` prop của dialog

---

## VII. THỨ TỰ TRIỂN KHAI

```
[1] Tạo WalletChangeConfirmDialog.tsx
       ↓
[2] Cập nhật useWalletConnection.ts (add state + logic)
       ↓
[3] Cập nhật useWalletConnectionWithRetry.ts (expose props)
       ↓
[4] Cập nhật Wallet.tsx (thêm dialog)
       ↓
[5] Test trên Desktop + Mobile
       ↓
[6] Deploy lên production
```

---

## VIII. KIỂM TRA SAU KHI HOÀN THÀNH

**Test case 1: Lần đầu kết nối**
- [ ] Kết nối ví A lần đầu → không hiển thị dialog
- [ ] Lưu vào DB thành công

**Test case 2: Kết nối ví khác**
- [ ] Kết nối ví B khác ví A → dialog hiển thị
- [ ] Hiển thị đúng địa chỉ cũ + mới
- [ ] Chọn "Giữ ví cũ" → disconnect ví B, quay lại ví A
- [ ] Chọn "Cập nhật ví mới" → ghi đè vào DB, UI cập nhật

**Test case 3: Cùng địa chỉ, loại ví khác**
- [ ] 0x1234 MetaMask → 0x1234 Bitget
- [ ] Hành động: Tự động cập nhật (không hiển thị dialog)

**Test case 4: Mobile flow**
- [ ] Dialog responsive trên mobile (fullscreen)
- [ ] Deep link MetaMask → kết nối thành công
- [ ] Kiểm tra dialog hiển thị đúng

