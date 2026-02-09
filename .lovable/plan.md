

# KẾ HOẠCH SỬA DỨT ĐIỂM "LỆCH SỐ" UI vs DB

---

## I. KẾT QUẢ ĐỐI SOÁT SQL

| Nguồn | Count | Sum CAMLY |
|-------|-------|-----------|
| wallet_transactions (completed) | 352 | 108,766,530 |
| donation_transactions (success) | 20 | 1,068,845 |
| claim_requests (success) | 23 | 6,874,000 |
| **TONG** | **395** | **~116,709,375** |
| UI hien thi | 73 | 16,314,935 |

---

## II. NGUYEN NHAN GOC (2 VAN DE CHINH)

### Nguyen nhan 1: Pagination limit cat du lieu
- Trang `/transactions` truyen `limit: 30`
- Hook chay `.range(0, 29)` cho **MOI bang** doc lap
- Ket qua: 30 wallet_txs + 20 donations + 23 claims = **73 records** (dung voi so UI hien thi)
- 322 wallet_transactions bi bo qua hoan toan

### Nguyen nhan 2: Stats tinh client-side tu list da bi cat
- Dong 435-441: `totalCount = allTransactions.length` (chi la 73, khong phai 395)
- `totalValue = reduce(sum)` chi cong 73 records = 16.3M thay vi 116.7M
- Stats PHAI duoc tinh server-side bang RPC, khong the dua vao list dang render

---

## III. GIAI PHAP

### PHASE 1: Tao RPC function tinh stats server-side

Tao PostgreSQL function `get_transaction_stats` de:
- COUNT va SUM tu 3 bang (wallet_transactions, donation_transactions, claim_requests)
- Chi dem onchain completed (status='completed'/'success' + tx_hash NOT NULL)
- Ho tro 2 mode: public (tat ca) va personal (theo wallet_address)
- Tra ve: total_count, total_value, today_count, success_count

```sql
CREATE OR REPLACE FUNCTION get_transaction_stats(p_wallet_address TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'totalCount', 
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR from_address = p_wallet_address OR to_address = p_wallet_address))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address) OR receiver_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address)))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR wallet_address = p_wallet_address)),
    'totalValue',
      COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR from_address = p_wallet_address OR to_address = p_wallet_address)), 0)
      + COALESCE((SELECT SUM(amount) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address) OR receiver_id IN (SELECT id FROM profiles WHERE wallet_address = p_wallet_address))), 0)
      + COALESCE((SELECT SUM(amount) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR wallet_address = p_wallet_address)), 0),
    'todayCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL AND block_timestamp::date = CURRENT_DATE
        AND (p_wallet_address IS NULL OR from_address = p_wallet_address OR to_address = p_wallet_address))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL AND created_at::date = CURRENT_DATE
        AND (p_wallet_address IS NULL))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL AND processed_at::date = CURRENT_DATE
        AND (p_wallet_address IS NULL))
  );
$$;
```

### PHASE 2: Tang limit va sua pagination trong useTransactionHistory

**Van de**: limit 30 per table khien chi lay 30/352 wallet_transactions.

**Giai phap**: 
- Tang default limit len 200 cho wallet_transactions (bang lon nhat)
- Hoac: fetch stats rieng (RPC) va list rieng
- Fetch toan bo wallet_transactions khi public mode (hien ~395 records, duoi 1000 limit cua Supabase)

Cu the trong `useTransactionHistory.ts`:
1. Tach stats ra query rieng bang RPC `get_transaction_stats`
2. Tang limit wallet_transactions len 500 (van duoi 1000 cua Supabase)
3. Stats KHONG tinh tu `allTransactions.length` nua

### PHASE 3: Cap nhat Transactions page

- File `src/pages/Transactions.tsx`: tang `limit: 30` len `limit: 200`
- File `src/components/Wallet/TransactionHistorySection.tsx`: giu `limit: 50` nhung stats tu RPC

### PHASE 4: Cap nhat hook useTransactionHistory.ts

Thay doi chinh:

```typescript
// TRUOC (SAI):
const newStats = {
  totalCount: allTransactions.length,  // chi 73!
  totalValue: allTransactions.reduce(...)  // chi 16.3M!
};

// SAU (DUNG):
// Goi RPC rieng
const { data: serverStats } = await supabase.rpc('get_transaction_stats', {
  p_wallet_address: publicMode ? null : userWalletAddress
});

const newStats = {
  totalCount: serverStats?.totalCount || allTransactions.length,
  totalValue: serverStats?.totalValue || 0,
  todayCount: serverStats?.todayCount || 0,
  successCount: serverStats?.totalCount || 0,  // chi completed
  pendingCount: 0,  // khong hien thi pending
};
```

Tang limit cho wallet_transactions query:
```typescript
// TRUOC:
.range(currentOffset, currentOffset + limit - 1)  // 0-29

// SAU:
.range(currentOffset, currentOffset + Math.max(limit, 200) - 1)  // 0-199
```

---

## IV. BANG TONG HOP THAY DOI

| # | File | Loai | Mo ta |
|---|------|------|-------|
| 1 | Migration SQL | Tao moi | RPC function `get_transaction_stats` |
| 2 | `src/hooks/useTransactionHistory.ts` | Cap nhat | Stats tu RPC, tang limit wallet_txs |
| 3 | `src/pages/Transactions.tsx` | Cap nhat nho | Tang limit tu 30 len 200 |
| 4 | `src/components/Wallet/TransactionHistorySection.tsx` | Cap nhat nho | Tang limit tu 50 len 200 |

---

## V. KET QUA DU KIEN SAU SUA

| Metric | Truoc | Sau |
|--------|-------|-----|
| Tong giao dich (header) | 73 | ~395 |
| Tong gia tri (header) | 16.3M CAMLY | ~116.7M CAMLY |
| List hien thi | 73 records | 395 records (full) |
| Stats source | Client-side (sai) | Server-side RPC (chinh xac) |

---

## VI. LUU Y

1. Tong 395 records van duoi 1000-row limit cua Supabase, nen co the fetch 1 lan
2. Khi du lieu vuot 1000, can chuyen sang pagination server-side that su (giai doan sau)
3. RPC function dung SECURITY DEFINER de bypass RLS va tra ve stats chinh xac cho moi nguoi
4. "Cho xu ly" (pending) se luon = 0 vi chi hien thi onchain completed

