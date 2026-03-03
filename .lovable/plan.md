

## Plan: Chuyển Mint Epoch từ Weekly sang Monthly

Hiện tại `scoring-config-v1.ts` đã ghi `epoch_type: 'monthly'` (đúng), nhưng `mint-epoch-engine` edge function đang tính epoch theo **tuần** (weekly). Cần sửa engine để khớp với config monthly.

### Thay đổi

**1. `supabase/functions/mint-epoch-engine/index.ts`** — Chuyển logic epoch từ weekly sang monthly:

- Đổi `DEFAULT_WEEKLY_POOL` → `DEFAULT_MONTHLY_POOL` (giữ 5,000,000 FUN nhưng đổi tên cho rõ ngữ nghĩa, hoặc tăng pool nếu cần — giữ 5M vì đây là pool per epoch)
- Comment/docs: "Creates **monthly** epochs"
- Logic tính `period_start` / `period_end`: thay vì tính weekStart/weekEnd, tính **đầu tháng → cuối tháng** hiện tại:
  ```
  periodStart = ngày 1 của tháng hiện tại
  periodEnd = ngày cuối cùng của tháng hiện tại
  ```
- Đổi tên biến `weekStart`/`weekEnd` → `monthStart`/`monthEnd`

**2. `src/lib/fun-money/scoring-config-v1.ts`** — Giữ nguyên `epoch_type: 'monthly'` (đã đúng)

**3. `.lovable/plan.md`** — Cập nhật tài liệu phản ánh chu kỳ monthly

### Chi tiết kỹ thuật

Thay đổi chính trong `mint-epoch-engine/index.ts` (lines 138-150):

```typescript
// Before (weekly):
const dayOfWeek = now.getUTCDay();
const weekStart = new Date(now);
weekStart.setUTCDate(now.getUTCDate() - dayOfWeek);
const weekEnd = new Date(weekStart);
weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

// After (monthly):
const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
```

Pool amount giữ nguyên 5,000,000 FUN per epoch (monthly). Nếu muốn tăng pool vì chu kỳ dài hơn, có thể điều chỉnh sau.

