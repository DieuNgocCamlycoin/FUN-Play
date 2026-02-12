

# Sửa Thống Kê Giao Dịch Cá Nhân Hiển Thị 0

## Nguyên nhân lỗi

Hàm RPC `get_transaction_stats` so sánh địa chỉ ví **phân biệt hoa thường** (`from_address = p_wallet_address`), nhưng:
- Địa chỉ trong database lưu dạng checksummed: `0xa2e24F18Fd2664E1DbD2431504dbf3f166BfCC59`
- Địa chỉ truyền vào từ app dạng lowercase: `0xa2e24f18fd2664e1dbd2431504dbf3f166bfcc59`

Kết quả: **không khớp bất kỳ giao dịch nào**, tất cả stats hiển thị 0.

Ngoài ra, hàm RPC hiện tại thiếu 2 trường `successCount` và `pendingCount` mà giao diện cần hiển thị.

## Giải pháp

### 1. Cập nhật hàm RPC `get_transaction_stats` (Database migration)

Thêm `LOWER()` cho tất cả phép so sánh địa chỉ ví và bổ sung `successCount`, `pendingCount`:

```sql
CREATE OR REPLACE FUNCTION public.get_transaction_stats(p_wallet_address text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'totalCount', 
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))),
    'totalValue',
      COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address))), 0)
      + COALESCE((SELECT SUM(amount) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)))), 0)
      + COALESCE((SELECT SUM(amount) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))), 0),
    'todayCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL AND block_timestamp::date=CURRENT_DATE
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL AND created_at::date=CURRENT_DATE
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL AND processed_at::date=CURRENT_DATE
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))),
    'successCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='completed' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='success' AND tx_hash IS NOT NULL
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address))),
    'pendingCount',
      (SELECT COUNT(*) FROM wallet_transactions WHERE status='pending'
        AND (p_wallet_address IS NULL OR LOWER(from_address)=LOWER(p_wallet_address) OR LOWER(to_address)=LOWER(p_wallet_address)))
      + (SELECT COUNT(*) FROM donation_transactions WHERE status='pending'
        AND (p_wallet_address IS NULL OR sender_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address)) OR receiver_id IN (SELECT id FROM profiles WHERE LOWER(wallet_address)=LOWER(p_wallet_address))))
      + (SELECT COUNT(*) FROM claim_requests WHERE status='pending'
        AND (p_wallet_address IS NULL OR LOWER(wallet_address)=LOWER(p_wallet_address)))
  );
$$;
```

### 2. Cập nhật `src/hooks/useTransactionHistory.ts`

Cập nhật phần đọc stats từ RPC để sử dụng đầy đủ `successCount` và `pendingCount` từ server thay vì hardcode:

```typescript
const newStats: TransactionStats = {
  totalCount: (serverStats as any)?.totalCount ?? deduped.length,
  totalValue: (serverStats as any)?.totalValue ?? 0,
  todayCount: (serverStats as any)?.todayCount ?? 0,
  successCount: (serverStats as any)?.successCount ?? deduped.length,
  pendingCount: (serverStats as any)?.pendingCount ?? 0,
};
```

## Tác động

- Thống kê cá nhân sẽ hiển thị **chính xác** số giao dịch, tổng giá trị CAMLY, giao dịch hôm nay, thành công và chờ xử lý
- Thống kê toàn hệ thống (public mode) cũng được cải thiện với thêm `successCount` và `pendingCount`
- Cập nhật realtime vẫn hoạt động bình thường vì hook đã có cơ chế refresh

## File cần thay đổi

| File | Thay đổi |
|------|----------|
| Database migration | Cập nhật RPC `get_transaction_stats` thêm `LOWER()` và 2 trường mới |
| `src/hooks/useTransactionHistory.ts` | Dòng 511-516: đọc `successCount` và `pendingCount` từ RPC |

