

# BẢNG KẾ HOẠCH TRIỂN KHAI HỆ THỐNG LỊCH SỬ GIAO DỊCH FUN PLAY
## Phiên Bản Tối Ưu & Đầy Đủ (Đã Điều Chỉnh Toàn Bộ Yêu Cầu)

---

## I. TỔNG QUAN DỰ ÁN (CẬP NHẬT CUỐI CÙNG)

### 1.1. Tầm Nhìn & Mục Tiêu
**Tầm nhìn**: Xây dựng hệ thống lịch sử giao dịch **minh bạch, công khai, truy vết được trên blockchain** theo chuẩn Web3, phục vụ **cộng đồng người dùng toàn thế giới** trên FUN PLAY.

| STT | Mục Tiêu | Mô Tả |
|-----|----------|-------|
| 1 | Minh bạch tài chính | CHỈ hiển thị giao dịch ONCHAIN (có tx_hash, status=success) |
| 2 | Gộp loại giao dịch | "Tặng thưởng" = tip + transfer (cùng ý nghĩa) |
| 3 | Ẩn thưởng chưa duyệt | Reward KHÔNG hiển thị, chỉ trong Admin Dashboard |
| 4 | Hiển thị user đầy đủ | Avatar + Tên kênh + @username |
| 5 | Truy cập công khai | /transactions ai cũng xem được (không cần đăng nhập) |

### 1.2. Nguyên Tắc Quan Trọng (GHI NHỚ HỆ THỐNG)
```
┌──────────────────────────────────────────────────────────────────┐
│                   QUY TẮC HIỂN THỊ GIAO DỊCH                     │
├──────────────────────────────────────────────────────────────────┤
│ CHỈ HIỂN THỊ các giao dịch ONCHAIN & SUCCESS:                   │
│                                                                  │
│ CÓ HIỂN THỊ:                                                     │
│ • Tặng thưởng (Gift): Tip từ donation_tx + wallet_tx (chuyển)  │
│ • Ủng hộ (Donate): Donate từ donation_tx                         │
│ • Rút thưởng (Claim): Claim từ claim_requests (success)          │
│                                                                  │
│ KHÔNG HIỂN THỊ (CHỈ ADMIN XEM):                                  │
│ • Reward (thưởng CAMLY) - chưa duyệt, có thể thay đổi           │
│ • Pending/Failed transactions                                   │
│ • Giao dịch không onchain                                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## II. PHẠM VI GIAO DỊCH (CUỐI CÙNG)

### 2.1. Các Loại Giao Dịch Được Hiển Thị (SAU KHI GỘP)
```
┌─────────────────┬──────────────────────────┬──────────────────┬──────────────┐
│ LOẠI GD         │ MÔ TẢ                    │ BẢNG NGUỒN       │ ĐIỀU KIỆN    │
├─────────────────┼──────────────────────────┼──────────────────┼──────────────┤
| Tặng thưởng     | Chuyển token giữa users  | donation_tx      | context_type │
| (Gift)          | (Tip + Transfer gộp)    | (tip) +          | = "tip"      │
|                 |                          | wallet_tx        | hoặc         │
|                 |                          |                  | wallet_tx    │
├─────────────────┼──────────────────────────┼──────────────────┼──────────────┤
| Ủng hộ          | Ủng hộ dự án/creator     | donation_tx      | context_type │
| (Donate)        |                          | (donate)         | = "donate"   │
├─────────────────┼──────────────────────────┼──────────────────┼──────────────┤
| Rút thưởng      | Rút CAMLY về ví thành    | claim_requests   | status=      │
| (Claim)         | công                     |                  | "success"    │
├─────────────────┼──────────────────────────┼──────────────────┼──────────────┤
│ LOẠI BỎ:        │                          │                  │              │
│ • Reward        | Thưởng CAMLY (chưa ok)   | reward_trans     | CHỈ ADMIN    │
│ • Chuyển tiền   | → GỘP vào "Tặng thưởng" | (DELETED)        | XEM          │
└─────────────────┴──────────────────────────┴──────────────────┴──────────────┘
```

### 2.2. Logic Lọc Dữ Liệu
```typescript
// HIỂN THỊ (Công khai):
1. donation_transactions:
   WHERE status = 'success' AND tx_hash IS NOT NULL
   AND (context_type = 'tip' OR context_type = 'donate')

2. wallet_transactions:
   WHERE status = 'success' AND tx_hash IS NOT NULL
   → Tất cả gộp vào "Gift" (Tặng thưởng)

3. claim_requests:
   WHERE status = 'success' AND tx_hash IS NOT NULL

// KHÔNG FETCH:
• reward_transactions (trừ Admin Dashboard)
• Pending/Failed transactions
```

---

## III. HIỂN THỊ THÔNG TIN NGƯỜI DÙNG (NÂNG CẤP)

### 3.1. Format Hiển Thị User
```
[AVATAR]  Tên Kênh Đã Đăng Ký
          @username (chuẩn hóa từ tên kênh)
          0x1234...5678 [📋] [🔗]
```

### 3.2. Lôgic Lấy & Normalize Tên User
```typescript
// src/lib/userUtils.ts (CẬP NHẬT)

interface UserDisplayInfo {
  displayName: string;     // Tên kênh (ưu tiên)
  username: string;        // @username (từ tên kênh)
  avatarUrl: string | null;
  walletAddress: string | null;
  channelName: string;     // Tên kênh chính thức
}

function getUserDisplayInfo(
  profile: Profile,
  channel: Channel | null
): UserDisplayInfo {
  // Ưu tiên tên kênh từ bảng channels
  const displayName = channel?.name || profile.display_name || profile.username || "Ẩn danh";
  
  // Tạo @username: chuyển tên kênh thành format @username
  const username = "@" + displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // Bỏ dấu (é → e)
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "")         // Chỉ giữ chữ + số
    .slice(0, 20);
    
  return {
    displayName,
    username,
    avatarUrl: profile.avatar_url,
    walletAddress: profile.wallet_address,
    channelName: channel?.name || displayName,
  };
}
```

### 3.3. Ví Dụ
```
Kênh: "Angel Diệu Ngọc"      → @angeldieuingoc
Kênh: "FUN PLAY Official"    → @funplayofficial
Kênh: "Ngọc Hân TV"          → @ngochanTV (bỏ dấu)
```

---

## IV. KIẾN TRÚC HỆ THỐNG

### 4.1. Sơ Đồ Dữ Liệu
```
donation_transactions (tip)  +  wallet_transactions  →  GỘP: Gift
         │                              │
donation_transactions (donate)          │
         │                              │
    DONATE                              │
                                        │
                          claim_requests → CLAIM

                              ↓
                useTransactionHistory.ts
                   (Unified Hook)
                              ↓
            ┌─────────────────────────────────┐
            │  SHARED COMPONENTS              │
            │  • TransactionCard              │
            │  • TransactionFilters           │
            │  • TransactionStats             │
            │  • TransactionExport            │
            │  • WalletAddressDisplay         │
            │  • UserProfileDisplay (NEW)     │
            └─────────────────────────────────┘
```

### 4.2. Cấu Trúc Dữ Liệu (UnifiedTransaction) - CẬP NHẬT
```typescript
interface UnifiedTransaction {
  // Người gửi (CẬP NHẬT: thêm username + channelName)
  sender_user_id: string | null;
  sender_display_name: string;        // Tên kênh
  sender_username: string;            // @username
  sender_avatar_url: string | null;
  sender_channel_name: string;        // Tên kênh chính
  wallet_from: string;
  wallet_from_full: string | null;
  
  // Người nhận (CẬP NHẬT: thêm username + channelName)
  receiver_user_id: string | null;
  receiver_display_name: string;
  receiver_username: string;
  receiver_avatar_url: string | null;
  receiver_channel_name: string;
  wallet_to: string;
  wallet_to_full: string | null;
  
  // Giao dịch (CẬP NHẬT: TransactionType)
  transaction_type: "gift" | "donate" | "claim";  // XÓA tip/reward/transfer
  token_symbol: string;
  amount: number;
  message: string | null;
  
  // Blockchain (BẮT BUỘC onchain)
  is_onchain: boolean;        // Luôn true
  chain: string | null;
  tx_hash: string | null;     // BẮT BUỘC != null
  explorer_url: string | null;
  
  status: "success" | "pending" | "failed";  // Chỉ success
  created_at: string;
}
```

---

## V. QUYỀN TRUY CẬP & BẢO MẬT

### 5.1. Phân Quyền
```
TRANG /transactions (HỆ THỐNG - PUBLIC):
┌──────────────────────────────────────────┐
│ • Ai cũng xem được (Public)              │
│ • Kể cả CHƯA ĐĂNG KÝ tài khoản           │
│ • Không cần đăng nhập                    │
│ • Hiển thị TẤT CẢ giao dịch onchain      │
└──────────────────────────────────────────┘

TRANG /wallet (CÁ NHÂN):
┌──────────────────────────────────────────┐
│ • User xem CỦA MÌNH                      │
│ • Admin xem TẤT CẢ                       │
│ • Yêu cầu đăng nhập                      │
│ • Hiển thị GIỐNG /transactions           │
└──────────────────────────────────────────┘

ADMIN DASHBOARD:
┌──────────────────────────────────────────┐
│ • CHỈ ADMIN xem                          │
│ • Hiển thị reward_transactions           │
│ • Duyệt & xác thực thưởng                │
└──────────────────────────────────────────┘
```

---

## VI. THAY ĐỔI CODE - CHI TIẾT TỪ TÍNH NĂNG ĐẾN HIỂN THỊ

### 6.1. File: src/hooks/useTransactionHistory.ts (CHÍNH)

**Thay đổi:**
1. **TransactionType**: Đổi từ `"tip" | "donate" | "reward" | "claim" | "transfer"` → `"gift" | "donate" | "claim"`
2. **UnifiedTransaction Interface**: Thêm `sender_username`, `sender_channel_name`, `receiver_username`, `receiver_channel_name`
3. **Fetch Logic**:
   - Xóa fetch `reward_transactions` (không hiển thị công khai)
   - Thêm fetch `claim_requests` (thay reward)
   - Thêm fetch `channels` (lấy tên kênh)
   - Filter: CHỈ lấy `tx_hash != null` và `status = 'success'`
4. **Normalize donation_transactions**:
   - `context_type = 'tip'` → `transaction_type = 'gift'`
   - `context_type = 'donate'` → `transaction_type = 'donate'`
   - Thêm tên kênh + @username
5. **Normalize wallet_transactions**: 
   - Đổi `transaction_type = 'transfer'` → `'gift'`
   - Thêm tên kênh + @username
6. **Normalize claim_requests** (thay reward):
   - `transaction_type = 'claim'`
   - Sender: "FUN PLAY Treasury"
   - Token: "CAMLY"

**Phức tạp**: ⭐⭐⭐⭐⭐ (Cao nhất - logic chính)
**Dòng code**: ~60 dòng thay đổi

---

### 6.2. File: src/lib/userUtils.ts (UTILITY)

**Thay đổi:**
1. Thêm function `getUserDisplayInfo(profile, channel)` → trả về `UserDisplayInfo`
2. Thêm logic normalize @username từ tên kênh

**Phức tạp**: ⭐⭐ (Đơn giản)
**Dòng code**: ~30 dòng thêm

---

### 6.3. File: src/components/Transactions/UserProfileDisplay.tsx (MỚI)

**Tạo mới** component để hiển thị:
```
[Avatar]  Tên Kênh
          @username
          Wallet [copy] [explorer]
```

**Phức tạp**: ⭐⭐ (Đơn giản)
**Dòng code**: ~80 dòng (tập trung hiển thị)

---

### 6.4. File: src/components/Transactions/TransactionCard.tsx (HIỂN THỊ)

**Thay đổi:**
1. `getTypeLabel()`: 
   - "tip" → "Tặng thưởng" (`case "gift"`)
   - Xóa `case "reward"`
   - Xóa `case "transfer"`
   - Giữ "donate" → "Ủng hộ"
   - Giữ "claim" → "Rút thưởng"

2. `getTypeBadgeColor()`: 
   - "gift" → Pink (giống cũ tip)
   - Xóa "reward", "transfer" cases
   - Giữ "donate", "claim"

3. Hiển thị user: Dùng `UserProfileDisplay` component (avatar + tên kênh + @username)

4. Hiển thị ví: Giữ nguyên (copy + explorer)

**Phức tạp**: ⭐⭐⭐ (Trung bình)
**Dòng code**: ~15 dòng thay đổi

---

### 6.5. File: src/components/Transactions/TransactionFilters.tsx (BỘ LỌC)

**Thay đổi:**
1. `typeOptions` array:
   ```typescript
   const typeOptions = [
     { value: "all", label: "Tất cả loại" },
     { value: "gift", label: "Tặng thưởng" },      // ĐỔI từ "tip"
     { value: "donate", label: "Ủng hộ" },
     // { value: "reward", label: "Thưởng" },      // XÓA
     { value: "claim", label: "Rút thưởng" },
     // { value: "transfer", label: "Chuyển tiền" }, // XÓA (gộp vào gift)
   ];
   ```

2. Xóa logic filter cho "reward" và "transfer" (vì không có)

**Phức tạp**: ⭐⭐ (Đơn giản)
**Dòng code**: ~5 dòng thay đổi

---

### 6.6. File: src/components/Layout/Sidebar.tsx (NAVIGATION)

**Thay đổi:**
1. Import `Globe` icon từ lucide-react
2. Thêm button "Lịch Sử Giao Dịch" sau "Lịch Sử Phần Thưởng" (dòng ~225)

```typescript
<Button
  variant="ghost"
  onClick={() => handleNavigation("/transactions")}
  className={cn(
    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
    location.pathname === "/transactions" && "bg-primary/10 text-primary font-semibold"
  )}
>
  <Globe className="h-5 w-5 text-[#004eac]" />
  <span className="text-[#004eac]">Lịch Sử Giao Dịch</span>
</Button>
```

**Phức tạp**: ⭐ (Rất đơn giản)
**Dòng code**: ~12 dòng thêm

---

### 6.7. File: src/components/Layout/CollapsibleSidebar.tsx (MOBILE NAVIGATION)

**Thay đổi:**
1. Import `Globe` icon
2. Thêm item vào `rewardItems` array (dòng ~66):

```typescript
const rewardItems: NavItem[] = [
  { icon: Trophy, label: "Bảng Xếp Hạng", href: "/leaderboard" },
  { icon: Coins, label: "Lịch Sử Phần Thưởng", href: "/reward-history" },
  { icon: Globe, label: "Lịch Sử Giao Dịch", href: "/transactions" }, // THÊM
  { 
    customIcon: '/images/fun-money-coin.png',
    label: "FUN Money", 
    href: "/fun-money",
    isFunMoney: true
  },
  // ... rest
];
```

**Phức tạp**: ⭐ (Rất đơn giản)
**Dòng code**: ~2 dòng thay đổi + 1 dòng import

---

### 6.8. File: src/components/Wallet/TransactionHistorySection.tsx (CÁ NHÂN)

**Thay đổi:**
1. Import `Link2` icon + `useNavigate`
2. Thêm button "Xem Tất Cả" trong CardHeader:

```typescript
<Button 
  variant="outline" 
  size="sm" 
  onClick={() => navigate("/transactions")}
  className="gap-2"
>
  <Link2 className="h-4 w-4" />
  Xem Tất Cả
</Button>
```

**Phức tạp**: ⭐⭐ (Đơn giản)
**Dòng code**: ~8 dòng thêm

---

### 6.9. File: src/pages/Transactions.tsx (TRANG HỆ THỐNG)

**Thay đổi:**
1. Cập nhật description: "Mọi giao dịch công khai trên nền tảng (ai cũng có thể xem)"

**Phức tạp**: ⭐ (Rất đơn giản)
**Dòng code**: ~1 dòng thay đổi

---

## VII. TỔNG HỢP THAY ĐỔI

### 7.1. Checklist Chi Tiết (Theo Thứ Tự Phù Hợp)

```
═══════════════════════════════════════════════════════════
GIAI ĐOẠN 1: UTILITY & DATA (Cơ sở)
═══════════════════════════════════════════════════════════
☐ 1.1. Cập nhật src/lib/userUtils.ts
       • Thêm getUserDisplayInfo() function
       • Thêm logic normalize @username
       
GIAI ĐOẠN 2: HOOK CHÍNH (Logic dữ liệu)
═══════════════════════════════════════════════════════════
☐ 2.1. Cập nhật src/hooks/useTransactionHistory.ts
       • Đổi TransactionType: "tip","reward","transfer" → "gift"
       • Xóa fetch reward_transactions
       • Thêm fetch claim_requests
       • Thêm fetch channels
       • Filter: CHỈ tx_hash != null + status=success
       • Normalize donation (tip → gift, thêm username/channel)
       • Normalize wallet (→ gift, thêm username/channel)
       • Normalize claim_requests (thay reward)
       • Cập nhật UnifiedTransaction interface
       
GIAI ĐOẠN 3: COMPONENT MỚI (Hiển thị user)
═══════════════════════════════════════════════════════════
☐ 3.1. Tạo src/components/Transactions/UserProfileDisplay.tsx
       • Component hiển thị avatar + tên kênh + @username + ví
       
GIAI ĐOẠN 4: COMPONENT HIỂN THỊ (UI)
═══════════════════════════════════════════════════════════
☐ 4.1. Cập nhật src/components/Transactions/TransactionCard.tsx
       • Đổi "tip" → "Tặng thưởng" (gift)
       • Xóa "reward" case
       • Xóa "transfer" case
       • Dùng UserProfileDisplay cho sender/receiver
       
☐ 4.2. Cập nhật src/components/Transactions/TransactionFilters.tsx
       • Đổi "tip" → "gift" trong typeOptions
       • Xóa "reward" option
       • Xóa "transfer" option
       
GIAI ĐOẠN 5: NAVIGATION (Điều hướng)
═══════════════════════════════════════════════════════════
☐ 5.1. Cập nhật src/components/Layout/Sidebar.tsx
       • Import Globe icon
       • Thêm button "Lịch Sử Giao Dịch" (sau Phần Thưởng)
       
☐ 5.2. Cập nhật src/components/Layout/CollapsibleSidebar.tsx
       • Import Globe icon
       • Thêm item "Lịch Sử Giao Dịch" vào rewardItems
       
☐ 5.3. Cập nhật src/components/Wallet/TransactionHistorySection.tsx
       • Thêm button "Xem Tất Cả" → /transactions
       
GIAI ĐOẠN 6: PAGES (Trang)
═══════════════════════════════════════════════════════════
☐ 6.1. Cập nhật src/pages/Transactions.tsx
       • Cập nhật description (public access)
```

### 7.2. Bảng Tóm Tắt Files

| # | File | Loại | Phức Tạp | Dòng | Priority |
|---|------|------|----------|------|----------|
| 1 | userUtils.ts | Utility | ⭐⭐ | +30 | P1 |
| 2 | useTransactionHistory.ts | Hook | ⭐⭐⭐⭐⭐ | ~60 | P1 |
| 3 | UserProfileDisplay.tsx | Component | ⭐⭐ | +80 | P2 |
| 4 | TransactionCard.tsx | UI | ⭐⭐⭐ | ~15 | P2 |
| 5 | TransactionFilters.tsx | Filter | ⭐⭐ | ~5 | P2 |
| 6 | Sidebar.tsx | Nav | ⭐ | +12 | P3 |
| 7 | CollapsibleSidebar.tsx | Nav | ⭐ | +2 | P3 |
| 8 | TransactionHistorySection.tsx | Section | ⭐⭐ | +8 | P3 |
| 9 | Transactions.tsx | Page | ⭐ | ~1 | P4 |
| **TỔNG** | **9 files** | - | **⭐⭐⭐⭐** | **~213** | - |

---

## VIII. GIAO DIỆN & UX

### 8.1. TransactionCard - Hiển Thị Người Dùng
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│ [👤]  Angel Diệu Ngọc         →        [👤]  Trần B   │
│       @angeldieuingoc                    @tranthib     │
│       0x1234...5678 [📋][🔗]      0xABCD...EFGH [📋][🔗]│
│                                                        │
│ [Tặng thưởng] [Onchain]                    +5.000 CAMLY│
│ "Ủng hộ nội dung hay"                                  │
│                                                        │
│ ✓ Thành công • 09/02/2026 19:45 • BSC                 │
│ TX: 0xabc123... [📋] [🔗 BscScan]                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 8.2. Bộ Lọc Loại Giao Dịch (CẬP NHẬT)
```
[Tất cả loại] [Tặng thưởng] [Ủng hộ] [Rút thưởng]
(Xóa: "Thưởng", "Chuyển tiền")
```

### 8.3. Navigation (CẬP NHẬT)
```
SIDEBAR:
  Bảng Xếp Hạng
  Lịch Sử Phần Thưởng
  🌍 Lịch Sử Giao Dịch ← THÊM MỚI
  FUN Money
  Giới Thiệu Bạn Bè
  Build & Bounty
```

---

## IX. DATA FLOW (LUỒNG DỮ LIỆU)

```
┌─────────────────────────────────────────────────────────┐
│                   NGƯỜI DÙNG TRUY CẬP                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Cách 1: Sidebar → "Lịch Sử Giao Dịch" (Globe icon)   │
│  Cách 2: CollapsibleSidebar → rewardItems → item      │
│  Cách 3: /wallet → TransactionHistorySection           │
│          → Button "Xem Tất Cả"                         │
│  Cách 4: Direct URL: /transactions                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          useTransactionHistory Hook                     │
│          (publicMode: true/false)                       │
└─────────────────────────────────────────────────────────┘
                           ↓
    ┌──────────────────┬───────────────┬──────────────┐
    ↓                  ↓               ↓              ↓
donation_tx       wallet_tx      claim_requests    channels
(tip/donate)                                         (fetch)
    │                  │               │              │
    └──────────────────┴───────────────┴──────────────┘
                           ↓
              Filter: ONLY tx_hash != null
                   + status = 'success'
                           ↓
              Normalize → UnifiedTransaction
              (gift, donate, claim)
                           ↓
    ┌──────────────────────────────────────┐
    │   Shared Components                  │
    │   • UserProfileDisplay (avatar+name)  │
    │   • TransactionCard (hiển thị GD)     │
    │   • TransactionFilters (bộ lọc)      │
    │   • TransactionStats (thống kê)      │
    │   • TransactionExport (CSV/PDF)      │
    │   • WalletAddressDisplay (ví)        │
    └──────────────────────────────────────┘
                           ↓
    ┌──────────────────────────────────────┐
    │   Trang Hiển Thị                     │
    │   • /transactions (PUBLIC)            │
    │   • /wallet → TransactionHistory     │
    └──────────────────────────────────────┘
```

---

## X. KỲ VỌNG SAU TRIỂN KHAI

### 10.1. Giá Trị Mang Lại
| Giá Trị | Mô Tả |
|---------|-------|
| ✅ Minh bạch | CHỈ hiển thị giao dịch onchain (có tx_hash) |
| ✅ Rõ ràng | Xóa "Thưởng" chưa duyệt khỏi công khai |
| ✅ Gộp logic | "Tặng thưởng" = tip + transfer (cùng ý nghĩa) |
| ✅ Hiển thị user | Avatar + Tên kênh + @username đầy đủ |
| ✅ Truy cập dễ | 4 cách vào /transactions |
| ✅ Web3 chuẩn | Liên kết profile ↔ ví ↔ tx hash ↔ explorer |

### 10.2. Metrics
| Metric | Mục Tiêu |
|--------|----------|
| Thời gian load | < 2 giây |
| First Paint | < 1 giây |
| Export CSV | < 3 giây (100 GD) |
| API calls | Optimize batch (parallel Promise.all) |

---

## XI. GHI NHỚ HỆ THỐNG (FINAL)

```
┌──────────────────────────────────────────────────────────────┐
│             GHI NHỚ: TRANSACTION HISTORY SYSTEM              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ LOẠI GIAO DỊCH (3 loại):                                    │
│ • Gift (Tặng thưởng) = tip + wallet transfer (GỘP)         │
│ • Donate (Ủng hộ) = donation campaign                       │
│ • Claim (Rút thưởng) = withdraw rewards to wallet           │
│                                                              │
│ ĐIỀU KIỆN HIỂN THỊ:                                         │
│ • CHỈ onchain: tx_hash != null                              │
│ • CHỈ thành công: status = 'success'                        │
│ • XÓA chưa duyệt: reward_transactions (admin only)          │
│                                                              │
│ HIỂN THỊ USER:                                              │
│ • Avatar + Tên kênh + @username (chuẩn hóa)                │
│ • Click avatar → Profile                                    │
│ • Click ví → Copy + Explorer                                │
│                                                              │
│ QUYỀN TRUY CẬP:                                             │
│ • /transactions: PUBLIC (ai cũng xem, không login)          │
│ • /wallet: User xem của mình + Admin xem tất cả             │
│                                                              │
│ NAVIGATION:                                                 │
│ • Sidebar + CollapsibleSidebar (Globe icon)                 │
│ • /wallet → Button "Xem Tất Cả" → /transactions             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## XII. TỔNG KẾT

### 12.1. Số Liệu Triển Khai
- **Tổng files**: 9 (6 modify + 1 new + 2 pages)
- **Tổng dòng code**: ~213 dòng
- **Thời gian ước tính**: 2-3 giờ
- **Độ phức tạp**: ⭐⭐⭐⭐ (Trung-Cao)
- **Dependencies**: Không có external (chỉ dùng existing components)

### 12.2. Thứ Tự Triển Khai Khuyên Cáo
1. **Phase 1 (Data)**: userUtils.ts → useTransactionHistory.ts
2. **Phase 2 (UI)**: UserProfileDisplay.tsx → TransactionCard.tsx → TransactionFilters.tsx
3. **Phase 3 (Nav)**: Sidebar.tsx → CollapsibleSidebar.tsx → TransactionHistorySection.tsx
4. **Phase 4 (Polish)**: Transactions.tsx → Testing

### 12.3. Testing Points
- ✅ /transactions (public) - không login → xem được
- ✅ /wallet (private) - login → xem được, admin xem all
- ✅ Bộ lọc: gift/donate/claim (không có reward/transfer)
- ✅ Hiển thị user: avatar + @username + ví
- ✅ Navigation: 4 entry points
- ✅ Export: CSV/PDF
- ✅ Mobile responsive

