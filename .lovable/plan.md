

## Sua loi hien thi sai dia chi vi FUN PLAY TREASURY + Toi uu hoa

### Nguyen nhan goc

3 loi trong file `src/hooks/useTransactionHistory.ts`:

1. **Dong 304-314**: Claim tu `donation_transactions` hien thi sai dia chi vi `SYSTEM_WALLETS.TREASURY` (`0x1DC2...5998`) thay vi `SYSTEM_WALLETS.AUTO_REWARD` (`0x9848...de4cC`)
2. **Dong 319**: Tat ca `donation_transactions` luon tra ve `"gift"`, ke ca khi `context_type === "claim"`
3. **Dong 476-480**: `donation_transactions` co uu tien cao hon `claim_requests` khi trung `tx_hash`, khien du lieu sai duoc giu lai

### Kiem tra code thua

Da kiem tra toan bo codebase:
- `src/pages/Receipt.tsx` dung `SYSTEM_WALLETS.TREASURY` cho bien nhac claim - day la dung vi Receipt hien thi thong tin chung cua TREASURY, khong can thay doi
- `src/components/Admin/tabs/RewardPoolTab.tsx` dung `SYSTEM_WALLETS.TREASURY` de hien thi dia chi vi admin - dung, khong can thay doi
- Chi co `useTransactionHistory.ts` dong 304-314 la dung sai cho muc dich claim

### Kiem tra UI

`TransactionCard.tsx` **DA CO SAN** logic hien thi dung:
- Label: `"claim"` -> "Rut thuong" (dong 40)
- Mau: `"claim"` -> xanh la `bg-green-500/10 text-green-500` (dong 49)
- Phan biet ro voi `"gift"` (hong) va `"donate"` (tim)

Van de la dong 319 luon tra ve `"gift"` nen UI khong bao gio hien thi "Rut thuong" cho donation_transactions.

### Kiem tra hieu nang

Ham dedup hien tai da chay O(n) - dung `Map` de lookup, 1 vong lap duy nhat. Khong can toi uu them.

### Chi tiet thay doi - 1 file duy nhat

**File: `src/hooks/useTransactionHistory.ts`**

| STT | Dong | Thay doi |
|-----|------|---------|
| 1 | 304-314 | Thay `SYSTEM_WALLETS.TREASURY` bang `SYSTEM_WALLETS.AUTO_REWARD` (6 cho) |
| 2 | 319 | Sua `"gift"` thanh: `d.context_type === "claim" ? "claim" : "gift"` |
| 3 | 476-480 | Dao uu tien: `claim_requests: 1`, `donation_transactions: 2` |

**Thay doi 1 - Dong 304-314:**
```typescript
// TRUOC (sai):
SYSTEM_WALLETS.TREASURY.displayName
SYSTEM_WALLETS.TREASURY.username
...

// SAU (dung):
SYSTEM_WALLETS.AUTO_REWARD.displayName
SYSTEM_WALLETS.AUTO_REWARD.username
...
```

**Thay doi 2 - Dong 319:**
```typescript
// TRUOC (sai - luon "gift"):
const transactionType: TransactionType = 
  (d.context_type === "tip" || d.context_type === "donate") ? "gift" : "gift";

// SAU (dung):
const transactionType: TransactionType = 
  d.context_type === "claim" ? "claim" : "gift";
```

**Thay doi 3 - Dong 476-480:**
```typescript
// TRUOC (sai uu tien):
const SOURCE_PRIORITY = {
  "donation_transactions": 1,  // thang khi trung
  "claim_requests": 2,
  "wallet_transactions": 3,
};

// SAU (dung uu tien):
const SOURCE_PRIORITY = {
  "claim_requests": 1,         // claim co du lieu chinh xac nhat
  "donation_transactions": 2,
  "wallet_transactions": 3,
};
```

### Khong can thay doi

- **TransactionCard.tsx**: Da co label + mau sac cho "claim" (xanh la, "Rut thuong")
- **TransactionExport.tsx**: Da co `getTypeLabel("claim")` -> "Rut thưởng"
- **Receipt.tsx**: Dung TREASURY dung muc dich (thong tin chung)
- **RewardPoolTab.tsx**: Dung TREASURY dung muc dich (admin)
- **Database / Edge Functions**: Khong can thay doi

### Ket qua sau thay doi

| Van de | Truoc | Sau |
|--------|-------|-----|
| Dia chi vi claim | `0x1DC2...5998` (sai) | `0x9848...de4cC` (dung on-chain) |
| Nhan giao dich claim | "Tang thuong" (hong) | "Rut thuong" (xanh la) |
| Trung lap tx_hash | donation_transactions thang (du lieu sai) | claim_requests thang (du lieu dung) |
| Hieu nang dedup | O(n) | O(n) - khong doi |

Tu dong ap dung cho ca Web va Mobile vi dung chung hook `useTransactionHistory`.

