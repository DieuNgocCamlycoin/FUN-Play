

# KẾ HOẠCH TỔNG HỢP TRIỂN KHAI HỆ THỐNG LỊCH SỬ GIAO DỊCH FUN PLAY
## ONCHAIN-FIRST, MINH BẠCH, CÔNG KHAI, TỰ XEM & TÌM KIẾM NGƯỜI KHÁC

---

## I. TÌNH TRẠNG DỰ ÁN

### ✅ Đã Hoàn Thành (Code)
1. **Hook `useTransactionHistory.ts`**: Chuẩn ONCHAIN-FIRST
   - ✅ Filter: `tx_hash != null` + `status = 'success'`
   - ✅ Loại giao dịch: `"gift" | "donate" | "claim"` (normalized)
   - ✅ Fetch: donation_transactions, claim_requests, wallet_transactions
   - ✅ Normalize: Channel name + @username

2. **Components Giao Diện**:
   - ✅ `TransactionCard.tsx` - Hiển thị đầy đủ (avatar, tên, ví, tx hash, explorer)
   - ✅ `TransactionFilters.tsx` - Bộ lọc (token, loại, thời gian)
   - ✅ `TransactionStats.tsx` - Thống kê (tổng GD, giá trị, hôm nay)
   - ✅ `TransactionExport.tsx` - Export CSV/PDF
   - ✅ `UserProfileDisplay.tsx` - Hiển thị người dùng

3. **Pages**:
   - ✅ `/transactions` (Transactions.tsx) - Trang PUBLIC, publicMode=true
   - ✅ `/wallet` (TransactionHistorySection.tsx) - Trang PERSONAL, publicMode=false
   - ✅ Navigation: Sidebar + CollapsibleSidebar + Wallet button

### ❌ Vấn Đề Hiện Tại: RLS Policies Chặn Public Access
- **Nguyên nhân**: RLS policies trên các bảng database hiện chỉ cho phép:
  - `donation_transactions`: Chỉ sender/receiver/admin xem được
  - `claim_requests`: Chỉ user_id owner/admin xem được
  - `wallet_transactions`: Chỉ from_user_id/to_user_id xem được

- **Hệ quả**:
  - Trang `/transactions` (publicMode=true) → Fetch không được data của người khác
  - Trang `/wallet` (publicMode=false) → Chỉ thấy giao dịch CỦA MÌNH (nếu có)
  - User bình thường không xem được lịch sử hệ thống

### ⚙️ Chưa Hoàn Thiện (Search)
- ✅ Search: Username (hiện tại có)
- ❌ Search: Wallet address (chưa)
- ❌ Search: Tx hash (chưa)
- ❌ Placeholder: Cần cập nhật UI để chỉ dẫn search đầy đủ

---

## II. NGUYÊN TẮC THIẾT KẾ

### Minh Bạch & Công Khai (Onchain-First)
```
NGUYÊN TẮC:
1. Tất cả giao dịch ONCHAIN (tx_hash != null, status = success) 
   → CÔNG KHAI cho tất cả user (không login cũng xem được)

2. User có thể:
   - Xem giao dịch HỆ THỐNG (ai gửi cho ai)
   - Xem giao dịch CÁ NHÂN (liên quan ví của mình)
   - Tìm kiếm người khác bằng:
     • Username (@angeldieuingoc)
     • Wallet address (0x1234...5678)
     • Tx hash (0xabc123...)

3. Reward nội bộ (like, comment, view, pending):
   - ❌ KHÔNG hiển thị cho user
   - ✅ CHỈ Admin Dashboard xem để duyệt
   - ✅ Không làm user nhầm lẫn giữa "được thưởng" vs "đã nhận tiền"
```

### Cấu Trúc Giao Dịch (3 Loại)
```
┌────────────────────────────────────────────────────────┐
│ 1. GIFT (Tặng thưởng)                                 │
│    - Từ: donation_transactions (context_type="tip")   │
│    - Từ: wallet_transactions (transfer onchain)       │
│    - Format: User A → User B + amount + message       │
├────────────────────────────────────────────────────────┤
│ 2. DONATE (Ủng hộ)                                    │
│    - Từ: donation_transactions (context_type="donate")│
│    - Format: User A → User B + amount + message       │
├────────────────────────────────────────────────────────┤
│ 3. CLAIM (Rút thưởng)                                 │
│    - Từ: claim_requests (status='success')            │
│    - Sender: "FUN PLAY Treasury"                      │
│    - Receiver: User                                   │
│    - Format: Hệ thống → User + amount                 │
└────────────────────────────────────────────────────────┘
```

---

## III. KẾ HOẠCH TRIỂN KHAI CHI TIẾT

### PHASE 1: Database Migration (RLS Policies)
**Mục đích**: Cho phép PUBLIC read access cho giao dịch onchain verified

**Files Thay Đổi**: Database (Migration)

**Thay Đổi**:
1. Thêm RLS policy cho `donation_transactions`:
   ```sql
   CREATE POLICY "Public can view onchain donations"
     ON public.donation_transactions
     FOR SELECT
     USING (tx_hash IS NOT NULL AND status = 'success');
   ```

2. Thêm RLS policy cho `claim_requests`:
   ```sql
   CREATE POLICY "Public can view onchain claims"
     ON public.claim_requests
     FOR SELECT
     USING (tx_hash IS NOT NULL AND status = 'success');
   ```

3. Thêm RLS policy cho `wallet_transactions`:
   ```sql
   CREATE POLICY "Public can view onchain wallet transfers"
     ON public.wallet_transactions
     FOR SELECT
     USING (tx_hash IS NOT NULL AND status = 'success');
   ```

**Giải Thích**:
- Chỉ cho phép xem giao dịch ONCHAIN (có tx_hash, status success)
- Giao dịch pending/failed/offchain vẫn được bảo vệ
- Reward nội bộ (reward_transactions) KHÔNG có policy public (vẫn protected)

**Phức Tạp**: ⭐⭐ (Đơn giản - chỉ thêm policies)

**Dòng Code**: ~30 dòng SQL

---

### PHASE 2: Cập Nhật Search & Filter (TransactionFilters)
**Mục đích**: Hỗ trợ search wallet address + tx hash + update UI

**Files Thay Đổi**: `src/components/Transactions/TransactionFilters.tsx`

**Thay Đổi**:
1. **Cập nhật Search Logic** (nếu cần sync):
   - Verify logic đã hỗ trợ: username, wallet_from_full, wallet_to_full, tx_hash
   - (Code đã có sẵn, chỉ cần confirm hoạt động)

2. **Cập nhật UI Placeholder**:
   - OLD: "Tìm theo tên người dùng..."
   - NEW: "Tìm theo tên, ví, tx hash..."

3. **Cập nhật Description** (nếu có):
   - Chỉ dẫn user có thể search bằng:
     • Username: @angeldieuingoc
     • Wallet: 0x1234...5678
     • Tx Hash: 0xabc123...

**Phức Tạp**: ⭐ (Rất đơn giản - chỉ UI text)

**Dòng Code**: ~3-5 dòng thay đổi

---

### PHASE 3: Verification & Consistency Check
**Mục đích**: Đảm bảo hệ thống 100% sync và không có vấn đề

**Checklist Validation**:
```
Database:
  ☐ RLS policies đã thêm cho 3 bảng (donation, claim, wallet)
  ☐ Policy chỉ allow SELECT khi tx_hash != null AND status = 'success'

Code - useTransactionHistory Hook:
  ☐ publicMode: true → Fetch TẤT CẢ giao dịch onchain
  ☐ publicMode: false → Fetch CHỈ GD liên quan ví user
  ☐ Filter: CHỈ tx_hash != null + status = 'success'
  ☐ Normalize: Channel name + @username đầy đủ
  ☐ Mapping context_type: 'tip'/'donate'/'global' → 'gift'/'donate'

UI Components:
  ☐ TransactionCard: Avatar + tên + ví + tx hash + explorer link
  ☐ TransactionFilters: Search (username, wallet, tx hash)
  ☐ TransactionStats: Stats từ filtered transactions
  ☐ TransactionExport: CSV/PDF có đầy đủ thông tin

Pages:
  ☐ /transactions: PUBLIC (publicMode=true) → Xem tất cả onchain
  ☐ /wallet: PERSONAL (publicMode=false) → Xem của mình + search người khác
  ☐ Navigation: Sidebar + CollapsibleSidebar + Wallet button

User Experience:
  ☐ User bình thường vào /transactions → Thấy tất cả GD hệ thống
  ☐ User search wallet/username → Thấy GD của người khác
  ☐ User xem /wallet → Thấy GD của mình, có thể search people
  ☐ Admin: Cả 2 trang + Admin Dashboard để duyệt reward
  ☐ Không hiển thị reward_transactions cho user (chỉ admin)

Mobile:
  ☐ Responsive trên mobile (TransactionCard, filters, export)
  ☐ Search field hoạt động trên mobile
```

**Phức Tạp**: ⭐⭐ (Đơn giản - chỉ verify)

**Dòng Code**: 0 (chỉ verify/test)

---

## IV. BẢNG TỔNG HỢP

### Files Thay Đổi & Chi Tiết

| # | File | Phase | Loại | Phức Tạp | Dòng | Mô Tả |
|---|------|-------|------|----------|------|-------|
| 1 | Database (Migration) | 1 | Create RLS | ⭐⭐ | ~30 | Thêm 3 RLS policies cho public read onchain |
| 2 | TransactionFilters.tsx | 2 | Update UI | ⭐ | ~5 | Update placeholder + description |
| 3 | (Verify) useTransactionHistory.ts | 3 | Check | ⭐ | 0 | Confirm hook logic đúng |
| 4 | (Verify) TransactionCard.tsx | 3 | Check | ⭐ | 0 | Confirm render đầy đủ |
| 5 | (Verify) Transactions.tsx | 3 | Check | ⭐ | 0 | Confirm page public mode |
| 6 | (Verify) TransactionHistorySection.tsx | 3 | Check | ⭐ | 0 | Confirm page personal mode |

**Tổng Quy Mô**:
- **Database Migration**: 3 RLS policies (~30 dòng SQL)
- **Code Changes**: 1 file, ~5 dòng (TransactionFilters)
- **Verification**: 4 files (không thay đổi, chỉ verify)
- **Tổng dòng**: ~35 dòng
- **Độ phức tạp**: ⭐⭐ (Trung bình thấp - logic đã sẵn)
- **Thời gian ước tính**: 30-45 phút

---

## V. KỲ VỌNG SAU TRIỂN KHAI

### Hệ Thống Hoàn Chỉnh
```
✅ CÔNG KHAI - MINH BẠCH - WEB3 STANDARD:

✅ /transactions (PUBLIC)
   - Ai cũng xem được (không cần login)
   - Toàn bộ giao dịch ONCHAIN từ TẤT CẢ user
   - Hiển thị: gift (tặng thưởng) | donate (ủng hộ) | claim (rút thưởng)
   - Search: username, wallet, tx hash
   - Export: CSV/PDF

✅ /wallet → TransactionHistorySection (PERSONAL)
   - User xem giao dịch CỦA MÌNH
   - Admin xem tất cả
   - Hiển thị GIỐNG 100% /transactions (cùng TransactionCard)
   - Search: tìm người khác theo ví/username
   - Export: CSV/PDF

✅ Admin Dashboard (INTERNAL)
   - Xem reward_transactions chưa duyệt
   - Duyệt, phê duyệt, từ chối thưởng
   - KHÔNG hiển thị cho user (protected)

✅ Data Integrity
   - CHỈ hiển thị ONCHAIN (tx_hash != null, status = success)
   - Reward nội bộ KHÔNG hiển thị (chỉ admin)
   - User KHÔNG nhầm lẫn: "Được thưởng" ≠ "Đã nhận tiền"

✅ User Experience
   - User bình thường: Vào /transactions → Xem TẤT CẢ GD
   - User tìm kiếm: Search ví/username → Xem GD của người khác
   - User cá nhân: Vào /wallet → Xem GD của mình
   - Mobile: Responsive 100%
```

### Giá Trị Mang Lại
| Giá Trị | Mô Tả |
|---------|-------|
| **Minh Bạch** | Tất cả GD ONCHAIN đều công khai, ai cũng xem được |
| **Không Nhầm Lẫn** | Reward nội bộ ≠ tiền nhận (chỉ admin xem) |
| **Tìm Kiếm Dễ** | Search theo tên, ví, tx hash |
| **Web3 Chuẩn** | Liên kết profile ↔ ví ↔ tx hash ↔ explorer |
| **Trust** | FUN PLAY là sổ cái onchain công khai |
| **Compliance** | DeFi standard (on-chain transparency) |

---

## VI. FLOW TRIỂN KHAI CHI TIẾT

### Bước 1: Database Migration (CRITICAL)
```
☐ Tạo migration file: add-public-onchain-policies.sql
☐ Thêm 3 RLS policies cho:
  • donation_transactions (public view onchain)
  • claim_requests (public view onchain)
  • wallet_transactions (public view onchain)
☐ Deploy migration
☐ Verify: Check RLS policies đã thêm
```

**SQL Code**:
```sql
-- Policy 1: Donation Transactions
CREATE POLICY "Public can view onchain donations"
  ON public.donation_transactions
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'success');

-- Policy 2: Claim Requests
CREATE POLICY "Public can view onchain claims"
  ON public.claim_requests
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'success');

-- Policy 3: Wallet Transactions
CREATE POLICY "Public can view onchain wallet transfers"
  ON public.wallet_transactions
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'success');
```

---

### Bước 2: Code Update (QUICK)
```
☐ File: src/components/Transactions/TransactionFilters.tsx
☐ Update placeholder text: "Tìm theo tên, ví, tx hash..."
☐ Verify search logic hỗ trợ 3 loại search
☐ Test: Search username, wallet, tx hash
```

---

### Bước 3: Verification (QA)
```
☐ Test /transactions:
  - Vào trang (không login) → Thấy tất cả GD onchain
  - Search username → Lọc kết quả
  - Search wallet → Lọc kết quả
  - Search tx hash → Lọc kết quả
  - Export CSV/PDF → File đúng định dạng

☐ Test /wallet:
  - Login → Xem GD của user
  - Search người khác → Xem GD của họ
  - Mobile responsive

☐ Test Admin Dashboard:
  - Vẫn xem được reward_transactions (chưa duyệt)
  - Duyệt reward hoạt động
```

---

## VII. BACKLOG (Tương Lai)

1. **Backfill Lịch Sử**: Import toàn bộ GD onchain từ trước
2. **Caching**: Strategy cache cho large datasets
3. **Pagination**: Optimize pagination logic
4. **Real-time**: Supabase Realtime cho GD mới
5. **Analytics**: Advanced dashboard (volume, token distribution)
6. **Smart Search**: Auto-detect wallet vs username
7. **Favorites**: User theo dõi tài khoản/người dùng
8. **Export Advanced**: Filter → Export ngay

---

## VIII. NGUYÊN TẮC BẢO MẬT

| Dữ Liệu | Hiển Thị | Người | Lý Do |
|---------|---------|-------|-------|
| Onchain donations (success) | ✅ PUBLIC | Tất cả | Đã verify blockchain |
| Onchain claims (success) | ✅ PUBLIC | Tất cả | Đã verify blockchain |
| Onchain transfers (success) | ✅ PUBLIC | Tất cả | Đã verify blockchain |
| Pending transactions | ❌ PRIVATE | User + Admin | Chưa xác nhận |
| Failed transactions | ❌ PRIVATE | User + Admin | Không hợp lệ |
| Reward nội bộ | ❌ PRIVATE | Admin Only | Chưa duyệt, có thể thay đổi |
| User profile | ✅ PUBLIC | Tất cả | Transparency |
| Wallet address | ✅ PUBLIC | Tất cả | Web3 standard |

