

# KẾ HOẠCH BACKFILL & HOÀN THIỆN LỊCH SỬ GIAO DỊCH ONCHAIN FUN PLAY

---

## I. PHÂN TÍCH VẤN ĐỀ HIỆN TẠI

### Dữ Liệu Database Hiện Có
| Bảng | Số GD Onchain | Tổng CAMLY | Ghi Chú |
|------|---------------|------------|---------|
| `donation_transactions` | 20 | 1,068,845 | status = 'success' |
| `claim_requests` | 23 | 6,874,000 | status = 'success' |
| `wallet_transactions` | 97 | 6,931,360 | status = '**completed**' (KHÔNG PHẢI 'success') |
| **TỔNG HIỆN TẠI** | **140** | **~14.87M** | |
| **HIỂN THỊ THỰC TẾ** | **43** | **~7.94M** | Do lỗi RLS + Hook |

### 3 Vấn Đề Cần Sửa Ngay

**VẤN ĐỀ 1: RLS Policy sai cho `wallet_transactions`**
- RLS policy: `status = 'success'`
- Dữ liệu thực tế: `status = 'completed'`
- Kết quả: 97 giao dịch bị ẩn!

**VẤN ĐỀ 2: Hook `useTransactionHistory.ts` cũng sai**
- Dòng 200, 209: `eq("status", "success")`
- Cần đổi thành: `eq("status", "completed")`

**VẤN ĐỀ 3: Thiếu giao dịch lịch sử onchain (Backfill)**
- Database chỉ có từ 25/11/2025 (wallet_tx) và 02/01/2026 (claim)
- User nói: đã chuyển **>60M CAMLY** nhưng DB chỉ có ~14.87M
- **Cần backfill từ blockchain** để lấy đủ lịch sử

---

## II. THÔNG TIN 2 VÍ HỆ THỐNG

| # | Tên Hiển Thị | Địa Chỉ | Vai Trò |
|---|-------------|---------|---------|
| 1 | **FUN PLAY TẶNG & THƯỞNG** | `0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8` | Ví tặng thưởng CAMLY |
| 2 | **FUN PLAY TREASURY** | `0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998` | Ví Treasury (claim) |

**Avatar**: `/images/fun-play-wallet-icon.png`
**Token CAMLY**: `0x0910320181889fefde0bb1ca63962b0a8882e413` (BSC Mainnet)

---

## III. KẾ HOẠCH TRIỂN KHAI

### PHASE 1: SỬA LỖI RLS POLICY (KHẨN CẤP)

**File**: Database Migration

```sql
-- Drop policy cũ (sai status)
DROP POLICY IF EXISTS "Public can view onchain wallet transfers" 
  ON public.wallet_transactions;

-- Tạo policy mới với status = 'completed'
CREATE POLICY "Public can view onchain wallet transfers"
  ON public.wallet_transactions
  FOR SELECT
  USING (tx_hash IS NOT NULL AND status = 'completed');
```

**Kết quả**: Unlock thêm 97 giao dịch = +6.93M CAMLY

---

### PHASE 2: SỬA HOOK useTransactionHistory.ts

**File**: `src/hooks/useTransactionHistory.ts`

**Thay đổi dòng 200 và 209**:
- OLD: `.eq("status", "success")`
- NEW: `.eq("status", "completed")`

```typescript
// Dòng 196-213: Sửa wallet_transactions query
const walletQuery = publicMode
  ? supabase
      .from("wallet_transactions")
      .select("*")
      .eq("status", "completed")  // ✅ SỬA: success → completed
      .not("tx_hash", "is", null)
      ...
  : user?.id
    ? supabase
        .from("wallet_transactions")
        ...
        .eq("status", "completed")  // ✅ SỬA: success → completed
        ...
```

**Thay đổi dòng 416** (khi normalize wallet_transactions):
- OLD: `status: w.status as TransactionStatus`
- NEW: Map 'completed' → 'success' cho consistency

```typescript
status: w.status === 'completed' ? 'success' : w.status as TransactionStatus,
```

**Kết quả**: Hook sẽ fetch đúng 97 giao dịch wallet

---

### PHASE 3: TẠO EDGE FUNCTION BACKFILL BLOCKCHAIN

**File mới**: `supabase/functions/backfill-blockchain-history/index.ts`

**Mục đích**: Quét lịch sử giao dịch CAMLY từ BSCScan API cho 2 ví hệ thống

**Logic**:
1. Gọi BSCScan API lấy token transfers của CAMLY từ/đến 2 ví hệ thống
2. Filter: chỉ lấy giao dịch CAMLY (contract `0x0910...e413`)
3. Với mỗi giao dịch:
   - Check tx_hash đã tồn tại trong DB chưa
   - Nếu chưa → Insert vào `wallet_transactions`
4. Map wallet address → user_id qua bảng `profiles.wallet_address`

```typescript
// Pseudo-code
const BSCSCAN_API = "https://api.bscscan.com/api";
const CAMLY_TOKEN = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const SYSTEM_WALLETS = [
  "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8", // TẶNG & THƯỞNG
  "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998"  // TREASURY
];

// Fetch token transfers từ BSCScan
for (const wallet of SYSTEM_WALLETS) {
  const transfers = await fetch(
    `${BSCSCAN_API}?module=account&action=tokentx` +
    `&contractaddress=${CAMLY_TOKEN}` +
    `&address=${wallet}` +
    `&startblock=0&endblock=99999999` +
    `&sort=asc` +
    `&apikey=${BSCSCAN_API_KEY}`
  );
  
  for (const tx of transfers.result) {
    // Check duplicate
    const existing = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("tx_hash", tx.hash)
      .single();
    
    if (!existing) {
      // Insert new transaction
      await supabase.from("wallet_transactions").insert({
        from_address: tx.from,
        to_address: tx.to,
        amount: Number(tx.value) / 1e18,
        token_type: "CAMLY",
        tx_hash: tx.hash,
        status: "completed",
        created_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        // Map user IDs if possible
      });
    }
  }
}
```

**Yêu cầu**: Cần BSCScan API Key (sẽ request qua `add_secret`)

---

### PHASE 4: THÊM BSCSCAN API KEY

Cần request user cung cấp BSCScan API Key để:
- Không bị rate limit (5 calls/sec miễn phí)
- Fetch được toàn bộ lịch sử không giới hạn

**Lấy tại**: https://bscscan.com/myapikey (miễn phí)

---

### PHASE 5: NÂNG CAP PAGINATION & STATS

**File**: `src/hooks/useTransactionHistory.ts`

**Thay đổi**:
1. Tăng limit mặc định: 50 → 100
2. Sửa `hasMore` logic để không bị dừng sớm
3. Stats tính đúng với tổng số giao dịch thực

---

## IV. BẢNG TỔNG HỢP THAY ĐỔI

| # | File/Resource | Loại | Phức Tạp | Mô Tả |
|---|---------------|------|----------|-------|
| 1 | Database Migration | Update RLS | ⭐⭐ | Fix status 'completed' cho wallet_transactions |
| 2 | `useTransactionHistory.ts` | Edit Hook | ⭐⭐ | Fix query status + map status |
| 3 | `backfill-blockchain-history/index.ts` | New Edge Function | ⭐⭐⭐⭐ | Quét lịch sử từ BSCScan |
| 4 | Secret: BSCSCAN_API_KEY | Add Secret | ⭐ | Cần user cung cấp |

---

## V. KẾT QUẢ SAU TRIỂN KHAI

### Trước (Hiện tại)
```
❌ Hiển thị: 43 giao dịch = ~7.94M CAMLY
❌ Thiếu: wallet_transactions (status = 'completed' bị ẩn)
❌ Thiếu: Lịch sử onchain cũ chưa được backfill
```

### Sau Phase 1+2 (Fix RLS + Hook)
```
✅ Hiển thị: 140 giao dịch = ~14.87M CAMLY
✅ wallet_transactions hiển thị đầy đủ
```

### Sau Phase 3+4 (Backfill Blockchain)
```
✅ Hiển thị: TẤT CẢ giao dịch CAMLY onchain
✅ >60M CAMLY được phản ánh đúng
✅ Minh bạch 100% dòng tiền từ lúc bắt đầu dự án
```

---

## VI. THỨ TỰ TRIỂN KHAI

```
[1] Fix RLS Policy (Database Migration)
         ↓
[2] Fix Hook useTransactionHistory.ts
         ↓
[3] Request BSCScan API Key từ user
         ↓
[4] Tạo Edge Function backfill-blockchain-history
         ↓
[5] Chạy backfill + verify kết quả
         ↓
[6] Kiểm tra trang /transactions hiển thị đầy đủ
```

---

## VII. LƯU Ý BẢO MẬT

| Dữ Liệu | Hiển Thị | Lý Do |
|---------|----------|-------|
| Tất cả giao dịch CAMLY onchain | ✅ PUBLIC | Web3 transparency |
| 2 ví hệ thống | ✅ PUBLIC với branding FUN PLAY | Official wallets |
| Pending/Failed transactions | ❌ PRIVATE | Chưa xác nhận |
| Reward nội bộ | ❌ PRIVATE | Chỉ admin xem |

---

## VIII. YÊU CẦU TỪ USER

Để hoàn thành Phase 3-4 (Backfill), cần:

1. **BSCScan API Key**: Lấy miễn phí tại https://bscscan.com/myapikey
2. **Xác nhận**: Có muốn backfill toàn bộ lịch sử từ block đầu tiên không?

Nếu chưa có API Key, tôi sẽ thực hiện Phase 1-2 trước (fix ngay 97 giao dịch bị ẩn).

