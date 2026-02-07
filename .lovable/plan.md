
# FUN PLAY WALLET - Hợp Nhất Trung Tâm Tài Chính

## Tổng Quan

Refactor và hợp nhất 3 components riêng lẻ trên Header (Kết nối ví, Giá CAMLY, Claim) thành 1 nút **"WALLET"** duy nhất, dẫn đến trang **FUN PLAY WALLET** - Trung tâm Tài chính cho toàn bộ hệ sinh thái FUN PLAY.

---

## 1. Thay Đổi Header

### 1.1 Xóa/Thay Thế Components

| Hiện Tại | Sau Khi Refactor |
|----------|------------------|
| `<FunWalletMiniWidget />` | ❌ Xóa |
| `<CAMLYMiniWidget />` | ❌ Xóa |
| `<UnifiedClaimButton />` | ❌ Xóa |
| (không có) | ✅ `<WalletButton />` mới |

### 1.2 WalletButton Component Mới

- **Icon**: Sử dụng ảnh FUN Wallet được cung cấp (sẽ copy vào `public/images/fun-play-wallet-icon.png`)
- **Label**: "WALLET"
- **Style**: Giữ nguyên vị trí, gradient pastel, glow effect như nút Claim hiện tại
- **Logic**:
  - Nếu chưa đăng nhập → Redirect `/auth`
  - Nếu đã đăng nhập → Navigate `/wallet`
  - Hiển thị badge số pending rewards (nếu có)

---

## 2. Trang FUN PLAY WALLET (`/wallet`)

### Layout Tổng Thể

```text
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: FUN PLAY WALLET                    [Kết nối ví] [Back] │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 1: TỔNG QUAN & GIÁ CAMLY                               │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Giá: $0.00000123  (+5.2% 24h)  [DexScreener] [BSCScan]    │  │
│ │ Chart với timeframe: 5p | 15p | 1h | 1d                   │  │
│ └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 2: CLAIM REWARDS                                        │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│ │ Tổng CAMLY      │ │ Có thể Claim    │ │ Đang chờ duyệt │    │
│ │ 391,000         │ │ 214,000 ✅      │ │ 177,000 ⏳     │    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│ [==========Threshold Progress 200K==========]                   │
│ [                  CLAIM CAMLY                   ]              │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 3: TOP SPONSOR (MẠNH THƯỜNG QUÂN)                      │
│ Avatar | Username | Total Donated | Token                       │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 4: LỊCH SỬ GIAO DỊCH                                   │
│ Filter: [Token ▾] [Thời gian ▾] [Gửi/Nhận ▾] [Search]          │
│ Table: Thời gian | Gửi | Nhận | Token | Số tiền | Trạng thái  │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 5: EXPORT                                               │
│ [Export CSV] [Export PDF]                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Chi Tiết Các Section

### Section 1: Giá CAMLY & Chart

- **Data Source**: 
  - Giá CAMLY từ `useCryptoPrices` hook
  - Chart: Embed DexScreener iframe hoặc fetch từ API
- **Contract**: `0x0910320181889fefde0bb1ca63962b0a8882e413`
- **Buttons**:
  - "View on DexScreener" → `https://dexscreener.com/bsc/0x0910320181889fefde0bb1ca63962b0a8882e413`
  - "View on BSCScan" → `https://bscscan.com/token/0x0910320181889fefde0bb1ca63962b0a8882e413`
- **Timeframes**: 5p, 15p, 1h, 1d tabs

### Section 2: Claim Rewards

- **Cards**:
  1. **Tổng CAMLY đang có**: Tổng từ `profiles.total_camly_rewards`
  2. **Có thể Claim (đã duyệt)**: Từ `profiles.approved_reward`
  3. **Đang chờ duyệt**: Từ `profiles.pending_rewards`
  4. **Đã Claim**: Tổng từ `claim_requests` where status = 'success'
- **Progress Bar**: Hiển thị tiến độ đến ngưỡng 200,000 CAMLY
- **Claim Button**: Logic từ `ClaimRewardsModal` component, mở modal khi click
- **Wallet Connection**: Nếu chưa kết nối ví → Hiển thị nút "Kết nối ví để claim"

### Section 3: Top Sponsor

- **Data**: Từ `useTopSponsors` hook (đã có sẵn)
- **Display**: Avatar, Username (link profile), Tổng đã donate, Token
- **Style**: Glassmorphism cards

### Section 4: Lịch Sử Giao Dịch

- **Data Sources**:
  - `reward_transactions` (rewards nhận được)
  - `donation_transactions` (donations gửi/nhận)
  - `wallet_transactions` (on-chain transactions)
- **Columns**:
  - Thời gian
  - Người gửi (username + avatar, link profile)
  - Người nhận (username + avatar, link profile)
  - Token (CAMLY, FUN MONEY, etc.)
  - Số tiền
  - Trạng thái (badge: Thành công, Đang xử lý, Thất bại)
  - Link BSC (nếu có tx_hash)
- **Filters**:
  - Token dropdown
  - Thời gian (7d, 30d, All)
  - Gửi/Nhận toggle
- **Search**: By username, address, tx_hash

### Section 5: Export

- **CSV Export**: Logic đã có trong Wallet.tsx hiện tại
- **PDF Export**: Sử dụng jsPDF + autoTable
- **Data Included**: Thời gian, Gửi, Nhận, Token, Số tiền, Trạng thái, Tx hash, Link BSC, Link Profile

---

## 4. Files Cần Tạo/Sửa

| File | Thay Đổi |
|------|----------|
| **Mới** `public/images/fun-play-wallet-icon.png` | Copy từ user-uploads://3.png |
| **Mới** `src/components/Wallet/WalletButton.tsx` | Nút WALLET mới cho header |
| **Mới** `src/components/Wallet/WalletPageHeader.tsx` | Header cho trang Wallet |
| **Mới** `src/components/Wallet/CAMLYPriceSection.tsx` | Section 1: Giá & Chart |
| **Mới** `src/components/Wallet/ClaimRewardsSection.tsx` | Section 2: Claim |
| **Mới** `src/components/Wallet/TopSponsorsSection.tsx` | Section 3: Top Sponsors |
| **Mới** `src/components/Wallet/TransactionHistorySection.tsx` | Section 4: Lịch sử |
| **Mới** `src/components/Wallet/ExportSection.tsx` | Section 5: Export |
| **Mới** `src/hooks/useWalletTransactions.ts` | Hook tổng hợp giao dịch |
| **Sửa** `src/pages/Wallet.tsx` | **Refactor hoàn toàn** - Layout mới với 5 sections |
| **Sửa** `src/components/Layout/Header.tsx` | Thay thế 3 widgets bằng WalletButton |
| **Sửa** `src/components/Layout/MobileHeader.tsx` | Thay thế widgets bằng WalletButton |
| **Giữ** `src/components/Rewards/ClaimRewardsModal.tsx` | Vẫn dùng làm modal khi click Claim |
| **Giữ** `src/hooks/useTopSponsors.ts` | Dùng cho Section 3 |
| **Giữ** `src/hooks/useCryptoPrices.tsx` | Dùng cho giá CAMLY |

---

## 5. Responsive Design

### Desktop (lg+)

- 2 cột layout cho Section 2 (Claim + Stats)
- Full-width chart
- Table với đầy đủ columns

### Tablet (md)

- 2 cột cho claim stats
- Table responsive

### Mobile

- Stack layout
- Horizontal scroll cho table
- Bottom sheet cho filters

---

## 6. Realtime Updates

- **Rewards**: Subscribe `reward_transactions`, `profiles`
- **Donations**: Subscribe `donation_transactions`
- **Wallet**: Subscribe `wallet_transactions`
- **Prices**: Polling mỗi 30s từ `useCryptoPrices`

---

## 7. Styling - Design System FUN PLAY

- **Background**: Glassmorphism với gradient cyan-purple-pink
- **Cards**: `bg-white/90 backdrop-blur-xl border border-white/20`
- **Glow Effects**: `shadow-[0_0_30px_rgba(0,231,255,0.3)]`
- **Buttons**: Gradient pastel với shimmer animation
- **Badge Colors**:
  - Thành công: Green gradient
  - Đang xử lý: Yellow/Amber
  - Thất bại: Red

---

## 8. Testing Checklist

- [ ] Click nút WALLET trên header → Navigate đến `/wallet`
- [ ] Trang Wallet hiển thị đầy đủ 5 sections
- [ ] Giá CAMLY hiển thị realtime với % thay đổi 24h
- [ ] Chart hoạt động với các timeframe
- [ ] Claim section hiển thị đúng số liệu từ profile
- [ ] Click "Claim" → Mở modal claim (nếu đủ ngưỡng)
- [ ] Top Sponsors hiển thị đúng ranking
- [ ] Lịch sử giao dịch load đầy đủ với filters
- [ ] Click username → Navigate đến profile
- [ ] Click tx hash → Mở BSCScan
- [ ] Export CSV/PDF hoạt động
- [ ] Responsive trên mobile
- [ ] Badge số rewards hiển thị trên nút WALLET
- [ ] Header desktop không còn 3 widgets cũ
- [ ] Header mobile không còn 3 widgets cũ

---

## 9. Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| 3 widgets riêng lẻ (FunWallet, CAMLY, Claim) | 1 nút WALLET duy nhất |
| Trang Wallet cũ với nhiều tabs | Trang Wallet mới với 5 sections rõ ràng |
| Phải navigate nhiều nơi | Tất cả trong 1 trang |
| Không có Top Sponsors | Có bảng Top Sponsor |
| Export cơ bản | Export đầy đủ với profile links |
| Không embed DexScreener | Có chart với timeframes |
