

# TRIỂN KHAI TOÀN BỘ HỆ THỐNG LỊCH SỬ GIAO DỊCH FUN PLAY
## ONCHAIN-FIRST, MINH BẠCH, KHÔNG GÂY HIỂU NHẦM

---

## I. TÌNH TRẠNG HIỆN TẠI & VẤN ĐỀ

### Đã Hoàn Thành ✅
1. **Hook `useTransactionHistory.ts`**: Đúng nguyên tắc ONCHAIN
   - ✅ Filter: `tx_hash != null` + `status = 'success'`
   - ✅ Loại giao dịch: `"gift" | "donate" | "claim"` (XÓA "tip", "reward", "transfer")
   - ✅ Fetch claim_requests (thay reward_transactions)
   - ✅ Normalize với channel name + @username

2. **Trang `/transactions`**: Lịch sử hệ thống (Public)
   - ✅ Hiển thị TOÀN BỘ giao dịch ONCHAIN
   - ✅ AI dùng hook `useTransactionHistory` với `publicMode: true`

3. **Component `TransactionCard`**: Hiển thị đầy đủ
   - ✅ Avatar + tên người gửi/nhận
   - ✅ Wallet (rút gọn + copy + explorer)
   - ✅ Tx hash + explorer link
   - ✅ Loại giao dịch đúng

### Chưa Hoàn Thành ❌
1. **Trang `/wallet` - `TransactionHistorySection`**: CHƯA chuẩn hóa
   - ❌ Vẫn fetch `reward_transactions` (nên XÓA)
   - ❌ Không dùng hook `useTransactionHistory` unified
   - ❌ Không hiển thị @username
   - ❌ Không hiển thị chain + tx hash đầy đủ
   - ❌ Giao diện khác `/transactions` (nên GIỐNG 100%)

2. **Logic filter & search**: Chưa đồng bộ
   - ❌ TransactionHistorySection dùng logic cũ
   - ❌ Không filter "onchain-only"
   - ❌ Search không hỗ trợ wallet address, tx hash

---

## II. CẬP NHẬT QUYẾT ĐỊNH: ONCHAIN-FIRST

### Nguyên Tắc Bắt Buộc
```
1. Tất cả lịch sử hiển thị cho user = CHỈ ONCHAIN
   - tx_hash != null
   - status = 'success'

2. Reward nội bộ (like, comment, view, pending):
   - ❌ KHÔNG hiển thị cho user
   - ✅ CHỈ Admin Dashboard xem để duyệt

3. Cả 2 trang lịch sử (system & personal):
   - Hiển thị GIỐNG 100% (cùng format, cùng fields)
   - Chỉ khác: system = all, personal = filter wallet user
```

### Loại Giao Dịch Hợp Lệ (3 loại)
```
1. GIFT (Tặng thưởng)
   - Từ donation_tx (context_type = "tip") 
   - Từ wallet_tx (transfer onchain)
   - Hiển thị: Sender → Receiver + amount + message

2. DONATE (Ủng hộ)
   - Từ donation_tx (context_type = "donate")
   - Hiển thị: Sender → Receiver + amount + message

3. CLAIM (Rút thưởng)
   - Từ claim_requests (status = 'success' + tx_hash)
   - Sender: "FUN PLAY Treasury"
   - Receiver: User
   - Hiển thị: Hệ thống → User + amount
```

---

## III. KẾ HOẠCH TRIỂN KHAI

### GIAI ĐOẠN 1: CẬP NHẬT TransactionHistorySection
**File**: `src/components/Wallet/TransactionHistorySection.tsx`

**Thay Đổi**:
1. **Loại bỏ fetch reward_transactions**
   - Xóa logic fetch reward_transactions (dòng 64-84)
   - Lý do: Reward chưa duyệt không hiển thị, chỉ admin xem

2. **Sử dụng hook `useTransactionHistory`**
   - Thay thế cấu trúc cũ bằng gọi hook
   - `useTransactionHistory({ publicMode: false })` (chỉ user hiện tại)
   - Nhập lại `UnifiedTransaction`, `TransactionFilters`

3. **Cập nhật rendering**
   - Thay thế transaction loop bằng dùng `TransactionCard` component
   - Giữ nguyên filter, search, export logic nhưng cập nhật để match hook

4. **Cập nhật filter & search**
   - Thêm hỗ trợ search: wallet address, tx hash
   - Filter: token, loại giao dịch, thời gian
   - Toggle: "Chỉ onchain" (default: ON, vì hook đã filter)

5. **Cập nhật export**
   - Dùng `TransactionExport` component
   - Hoặc sync logic export giữa hai trang

**Chi tiết code**:
```typescript
// OLD: Fetch reward + donations
// NEW: Dùng hook
const { transactions, loading, error, stats, filteredTransactions, setFilters } 
  = useTransactionHistory({ 
    publicMode: false, 
    limit: 50,
    filters // state từ UI
  });

// OLD: Map transaction types cũ (reward, donation_sent, donation_received)
// NEW: Dùng UnifiedTransaction (gift, donate, claim)

// UI: Thay thế card render bằng <TransactionCard />
```

**Dòng code**: ~150 dòng xóa + ~100 dòng thêm = ~250 dòng thay đổi

**Phức tạp**: ⭐⭐⭐⭐ (Cao - logic phức)

---

### GIAI ĐOẠN 2: Đồng Bộ Cấu Trúc & Giao Diện

**Nội dung**:
1. **Header**: Cập nhật title, subtitle
   - OLD: "Lịch Sử Giao Dịch" (giống /transactions)
   - NEW: "Lịch Sử Giao Dịch Cá Nhân" (phân biệt)
   - Description: "Giao dịch onchain liên quan đến ví của bạn"

2. **Filter & Search**: Đồng bộ với /transactions
   - Search: username, wallet, tx hash
   - Filter: token, loại giao dịch, thời gian
   - Toggle onchain (default ON)

3. **Stats Widget**: Nếu có, cập nhật
   - Hiển thị: Tổng GD, tổng giá trị, hôm nay, thành công
   - Logic: Chỉ từ filtered transactions

4. **Export**: Dùng chung `TransactionExport` component
   - CSV/PDF cho transactions filtered

5. **Card Render**: Dùng `TransactionCard` component
   - Format GIỐNG 100% /transactions
   - Hiển thị: Avatar, @username, wallet, amount, time, tx hash

**Dòng code**: ~80 dòng cập nhật

**Phức tạp**: ⭐⭐⭐ (Trung bình)

---

### GIAI ĐOẠN 3: Đảm Bảo Consistency & Validation

**Checklist Validation**:
1. ✅ Cả 2 trang hiển thị GIỐNG format (cùng TransactionCard)
2. ✅ Cả 2 trang CHỈ hiển thị ONCHAIN (tx_hash != null)
3. ✅ KHÔNG hiển thị reward_transactions ở cả 2
4. ✅ Search hỗ trợ: username, wallet, tx hash
5. ✅ Filter token, loại, thời gian hoạt động
6. ✅ Export CSV/PDF có đầy đủ thông tin
7. ✅ @username hiển thị chuẩn (từ channel name)
8. ✅ Wallet explorer link đúng (BSC, ETH, v.v.)
9. ✅ Admin Dashboard vẫn xem được reward_transactions để duyệt
10. ✅ Mobile responsive (cả system & personal)

**Dòng code**: Test + minor fixes ~50 dòng

**Phức tạp**: ⭐⭐ (Đơn giản - chỉ verify)

---

## IV. TỔNG THỐNG KẾ

### Files Thay Đổi
| File | Loại | Phức Tạp | Dòng | Notes |
|------|------|----------|------|-------|
| TransactionHistorySection.tsx | Update | ⭐⭐⭐⭐ | ~250 | Main refactor |
| (Possibly) TransactionFilters.tsx | Update | ⭐⭐ | ~20 | Sync filters |
| (Possibly) TransactionExport.tsx | Verify | ⭐ | 0 | Check reusability |
| useTransactionHistory.ts | Verify | ⭐ | 0 | Already correct |
| TransactionCard.tsx | Verify | ⭐ | 0 | Already correct |

### Tổng Quy Mô
- **Tổng files**: 5 (chủ yếu 1)
- **Tổng dòng code**: ~320 dòng
- **Thời gian**: 1-2 giờ
- **Độ phức tạp**: ⭐⭐⭐⭐ (Trung-Cao)

---

## V. KỲ VỌNG SAU TRIỂN KHAI

### Hệ Thống Hoàn Chỉnh
```
✅ /transactions (PUBLIC)
   - Ai cũng xem được
   - Toàn bộ ONCHAIN
   - Hiển thị: gift | donate | claim

✅ /wallet → TransactionHistorySection (PERSONAL)
   - User xem của mình + Admin xem tất cả
   - Chỉ giao dịch liên quan ví
   - Hiển thị GIỐNG /transactions

✅ Admin Dashboard (INTERNAL)
   - Xem reward_transactions chưa duyệt
   - Xét duyệt, phê duyệt
   - Không hiển thị cho user
```

### Lợi Ích
1. **Minh bạch**: User chỉ thấy giao dịch onchain real
2. **Không nhầm lẫn**: Reward nội bộ ≠ tiền nhận
3. **Consistency**: 2 trang lịch sử đồng bộ 100%
4. **Web3 chuẩn**: Liên kết wallet → tx → explorer
5. **Trust**: FUN PLAY là sổ cái onchain công khai

---

## VI. HƯỚNG DẪN TRIỂN KHAI CHI TIẾT

### Bước 1: Cấu Trúc mới cho TransactionHistorySection
```
OLD: 
  - Fetch reward_transactions
  - Fetch donation_transactions
  - Map to old Transaction interface
  - Render custom layout

NEW:
  - Import useTransactionHistory hook
  - Import UnifiedTransaction type
  - Call hook({ publicMode: false })
  - Render using TransactionCard component
  - Reuse filters, search, export logic
```

### Bước 2: Cập nhật Logic Fetch
```typescript
const { 
  transactions, 
  loading, 
  error, 
  stats, 
  hasMore,
  loadMore,
  filteredTransactions,
  setFilters
} = useTransactionHistory({ 
  publicMode: false, // User mode
  limit: 30,
  filters // Từ state
});
```

### Bước 3: Cập nhật Filter & Search
```
- Search field: supports username, wallet, tx hash
- Token filter: all coins
- Type filter: gift, donate, claim
- Time filter: all, 7d, 30d, custom
- Remove "reward" type (vì hook đã filter)
```

### Bước 4: Render Cards
```
Thay vì custom map, dùng:
<TransactionCard 
  transaction={tx}
  currentUserId={user?.id}
  showFullDetails={true}
/>
```

### Bước 5: Export
```
Dùng TransactionExport component:
<TransactionExport 
  transactions={filteredTransactions}
  filename="FUN_Play_Personal_Transactions"
/>
```

---

## VII. VALIDATION & QA

### Checklist
- [ ] Trang /wallet không hiển thị reward nội bộ
- [ ] Hiển thị đầy đủ: avatar, @username, wallet, tx hash, explorer
- [ ] Search hoạt động: username, wallet, tx hash
- [ ] Filter hoạt động: token, loại, thời gian
- [ ] Export CSV/PDF có đầy đủ thông tin
- [ ] Mobile responsive
- [ ] Admin Dashboard vẫn xem reward_transactions
- [ ] Format 100% giống /transactions

---

## VIII. BACKLOG (Tương Lai)

1. Backfill toàn bộ lịch sử ONCHAIN từ trước
2. Caching strategy cho large datasets
3. Pagination optimization
4. Real-time updates (Supabase Realtime)
5. Advanced analytics dashboard

