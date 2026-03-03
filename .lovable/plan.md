

## Phân tích: Tại sao số liệu vẫn không khớp

### Nguyên nhân gốc

Có **2 lỗi logic** trong `useLightActivity.ts`:

**Lỗi 1: `alreadyMintedFun` tính từ ALL platforms, nhưng `totalMultipliedReward` chỉ tính FUN_PLAY**

```text
alreadyMintedFun  → mint_requests WHERE user_id=X AND status != 'rejected'  (ALL platforms)
totalMultipliedReward → chỉ tính từ 5 action types của FUN_PLAY (views, likes, comments, shares, uploads)

→ Nếu có mint_requests từ platform khác, alreadyMintedFun > phần FUN_PLAY → số liệu lệch
```

**Lỗi 2: `alreadyMintedFun` dùng giá trị lịch sử (`calculated_amount_formatted`), nhưng `totalMultipliedReward` tính lại real-time với multipliers hiện tại**

Khi multipliers thay đổi theo thời gian (streak tăng, riskScore thay đổi), `totalMultipliedReward` sẽ khác so với tổng các `calculated_amount_formatted` đã lưu trong DB.

### Giải pháp

Sửa `useLightActivity.ts` để `alreadyMintedFun` chỉ tính mint_requests của **FUN_PLAY** (cùng scope với `totalMultipliedReward`):

```diff
// Line 264-269: Thay đổi query
- // Total FUN already minted (all platforms, non-rejected)
- (supabase as any)
-   .from('mint_requests')
-   .select('calculated_amount_formatted, status')
-   .eq('user_id', userId)
-   .neq('status', 'rejected')
+ // Total FUN already minted (FUN_PLAY only, non-rejected)
+ (supabase as any)
+   .from('mint_requests')
+   .select('calculated_amount_formatted, status')
+   .eq('user_id', userId)
+   .eq('platform_id', 'FUN_PLAY')
+   .neq('status', 'rejected')
```

Thêm vào đó, cần đảm bảo hiển thị nhất quán: cả 3 giá trị trong grid phải cùng đơn vị và độ chính xác:

- **Tổng FUN**: `totalMultipliedReward.toFixed(2)` (thay vì `toLocaleString()` mất precision)
- **Đã Mint**: `alreadyMintedFun.toFixed(2)`
- **Mintable**: đã đúng (`mintableFun` = `toFixed(2)`)

### Files sửa
- **`src/hooks/useLightActivity.ts`**: Filter `alreadyMintedFun` query thêm `.eq('platform_id', 'FUN_PLAY')`
- **`src/components/FunMoney/MintableCard.tsx`**: Format `toFixed(2)` cho Tổng FUN và Đã Mint để nhất quán

