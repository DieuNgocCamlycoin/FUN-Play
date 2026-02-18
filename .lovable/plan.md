
# Wallet Detective - Tinh Nang Truy Vet Vi

## Tong Quan
Them mot section moi "Wallet Detective" vao Admin Dashboard, cho phep Admin paste dia chi vi va truy vet tat ca nguoi dung lien quan thong qua cac giao dich on-chain.

## Giao Dien
- Them nav item moi "Wallet Detective" vao sidebar (icon: Search/Fingerprint)
- Trang gom: Input field paste wallet address + nut "Trace"
- Ket qua hien thi dang bang voi cac cot: Username, Email (tu user ID), Wallet Address, Tong So Tien Gui, Ngay Tham Gia
- Dong highlight do neu nhieu User ID dung chung 1 wallet -> ghi chu "Suspected multi-account"
- Dong highlight vang neu user chua cap nhat avatar hoac ten mac dinh -> ghi chu "Unverified account"
- Nut "Ban All Related Users" ben canh ket qua

## Logic Truy Vet
Khi nhan "Trace", query 3 nguon du lieu:
1. `wallet_transactions`: Tim tat ca `from_address` gui den `to_address` = input wallet
2. `donation_transactions`: Tim tat ca donations lien quan (qua `sender_id`/`receiver_id` join profiles)
3. `claim_requests`: Tim tat ca claims tu wallet do
4. Cross-reference `from_address` voi `profiles.wallet_address` de lay thong tin user

## Chi Tiet Ky Thuat

### 1. Database: Tao RPC function `trace_wallet_detective`
- Input: `p_wallet_address text`, `p_admin_id uuid`
- Kiem tra quyen admin truoc
- Query `wallet_transactions` WHERE `LOWER(to_address) = LOWER(input)`, group by `from_address`
- JOIN voi `profiles` ON `LOWER(wallet_address) = LOWER(from_address)` de lay user info
- Tra ve: user_id, username, display_name, avatar_url, avatar_verified, wallet_address, total_amount, tx_count, created_at, banned

### 2. File moi: `src/components/Admin/tabs/WalletDetectiveTab.tsx`
- Input field + "Trace" button (chi query khi click, khong Realtime)
- State: `results`, `loading`, `searchedWallet`
- Goi supabase.rpc("trace_wallet_detective") khi click
- Hien thi bang ket qua voi highlight logic:
  - Do: Nhieu user khac nhau dung chung 1 `from_address`
  - Vang: User co `avatar_url = null` HOAC `username LIKE 'user_%'`
- Nut "Ban All Related Users" goi `banUser` cho tung user trong ket qua
- Responsive cho mobile (cards thay table tren man hinh nho)

### 3. Cap nhat `src/components/Admin/UnifiedAdminLayout.tsx`
- Them AdminSection type: `"wallet-detective"`
- Them nav item: `{ id: "wallet-detective", label: "Wallet Detective", icon: Fingerprint }`

### 4. Cap nhat `src/pages/UnifiedAdminDashboard.tsx`
- Import `WalletDetectiveTab`
- Them case "wallet-detective" trong `renderContent()`
- Them title/description cho section header

### Ket Qua
- Admin co the paste bat ky dia chi vi nao va thay ngay ai da gui tien den do
- Phat hien multi-account tu dong qua highlight
- Ban nhanh tat ca tai khoan lien quan chi voi 1 click
- Khong dung Realtime, chi query khi click -> tiet kiem tai nguyen
