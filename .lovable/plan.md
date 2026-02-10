

# Sửa lỗi hiển thị giao dịch trùng lặp trong Lịch sử giao dịch

## Nguyên nhân

Khi người dùng thực hiện 1 lệnh tặng thưởng/ủng hộ, hệ thống ghi nhận vào **2 bảng cùng lúc**:
1. `donation_transactions` — lưu thông tin tặng thưởng (có lời nhắn, chủ đề, biên nhận)
2. `wallet_transactions` — lưu giao dịch blockchain (đồng bộ từ on-chain)

Cả hai bản ghi có **cùng `tx_hash`**, nhưng hook `useTransactionHistory` gộp cả 2 vào danh sách --> hiển thị 2 dòng cho 1 giao dịch.

## Giải pháp

Thêm bước **loại bỏ trùng lặp theo `tx_hash`** sau khi gộp 3 nguồn dữ liệu. Ưu tiên giữ bản ghi từ `donation_transactions` (vì có nhiều thông tin hơn: lời nhắn, chủ đề, biên nhận).

## Chi tiết kỹ thuật

### File: `src/hooks/useTransactionHistory.ts`

Thêm logic deduplicate sau bước gộp (sau dòng 427, trước bước sắp xếp ở dòng 429):

```typescript
// Loại bỏ trùng lặp theo tx_hash
// Ưu tiên: donation_transactions > claim_requests > wallet_transactions
const SOURCE_PRIORITY: Record<string, number> = {
  "donation_transactions": 1,
  "claim_requests": 2,
  "wallet_transactions": 3,
};

const txHashMap = new Map<string, number>();
const deduped: UnifiedTransaction[] = [];

for (let i = 0; i < allTransactions.length; i++) {
  const tx = allTransactions[i];
  if (!tx.tx_hash) {
    deduped.push(tx);
    continue;
  }
  const existing = txHashMap.get(tx.tx_hash);
  if (existing === undefined) {
    txHashMap.set(tx.tx_hash, deduped.length);
    deduped.push(tx);
  } else {
    // Giữ bản ghi có source_table ưu tiên cao hơn (số nhỏ hơn)
    const existingPriority = SOURCE_PRIORITY[deduped[existing].source_table] || 99;
    const currentPriority = SOURCE_PRIORITY[tx.source_table] || 99;
    if (currentPriority < existingPriority) {
      deduped[existing] = tx; // Thay thế bằng bản ghi ưu tiên hơn
    }
  }
}
```

Sau đó dùng `deduped` thay cho `allTransactions` trong bước sắp xếp và các bước tiếp theo.

Thêm nữa: cả "tặng thưởng" (tip) và "ủng hộ" (donate) từ `donation_transactions` đều sẽ hiển thị dưới nhãn **"Tặng thưởng"** (gift) -- cập nhật dòng 290 để cả `tip` và `donate` context_type đều map thành `"gift"`.

### Tóm tắt thay đổi

| File | Thay doi |
|---|---|
| `src/hooks/useTransactionHistory.ts` | Thêm deduplicate theo tx_hash; gộp tip + donate thanh "gift" |

Chỉ 1 file thay đổi, không ảnh hưởng giao diện hay các component khác.

