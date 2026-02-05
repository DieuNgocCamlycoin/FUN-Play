
# Kế Hoạch Thêm Thông Báo Ngưỡng 200,000 CAMLY

## Mục Tiêu

Thêm thông báo rõ ràng cho người dùng trong modal Claim Rewards:
- Nếu đạt **≥ 200,000 CAMLY đã duyệt** → Có thể claim tự động
- Nếu chưa đạt → Hiển thị tiến độ và số CAMLY còn cần để claim

---

## Thiết Kế UI Mới

### Trường Hợp 1: Đủ ngưỡng (≥ 200,000 CAMLY)

```text
┌────────────────────────────────────────────────────┐
│  🎉 ĐỦ ĐIỀU KIỆN CLAIM!                           │
│  ─────────────────────────────────────────────    │
│  Bạn có 250,000 CAMLY đã duyệt.                  │
│  Nhấn nút bên dưới để claim tự động về ví!       │
└────────────────────────────────────────────────────┘
```

### Trường Hợp 2: Chưa đủ ngưỡng (< 200,000 CAMLY)

```text
┌────────────────────────────────────────────────────┐
│  📊 TIẾN ĐỘ CLAIM                                 │
│  ─────────────────────────────────────────────    │
│  Hiện có: 50,000 / 200,000 CAMLY                 │
│  ████████░░░░░░░░░░░░░░░░░░░░  25%               │
│  ─────────────────────────────────────────────    │
│  Còn cần: 150,000 CAMLY để claim tự động        │
│  💡 Tiếp tục xem video, like, comment để tích   │
│  lũy thêm phần thưởng!                           │
└────────────────────────────────────────────────────┘
```

---

## Chi Tiết Thay Đổi

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

**1. Thêm constant cho ngưỡng claim:**
```typescript
const MIN_CLAIM_THRESHOLD = 200000; // 200,000 CAMLY
```

**2. Tính toán logic ngưỡng:**
```typescript
const canClaim = totalUnclaimed >= MIN_CLAIM_THRESHOLD;
const progressPercent = Math.min((totalUnclaimed / MIN_CLAIM_THRESHOLD) * 100, 100);
const amountNeeded = Math.max(MIN_CLAIM_THRESHOLD - totalUnclaimed, 0);
```

**3. Thêm component thông báo ngưỡng claim (sau phần Total Unclaimed):**

Nếu đủ ngưỡng:
```typescript
{totalUnclaimed >= MIN_CLAIM_THRESHOLD && (
  <Alert className="border-green-500/30 bg-green-500/10">
    <CheckCircle className="h-4 w-4 text-green-500" />
    <AlertTitle className="text-green-600 font-semibold">
      🎉 Đủ điều kiện claim!
    </AlertTitle>
    <AlertDescription className="text-sm text-muted-foreground">
      Bạn có thể claim {formatNumber(totalUnclaimed)} CAMLY về ví ngay bây giờ!
    </AlertDescription>
  </Alert>
)}
```

Nếu chưa đủ ngưỡng (có phần thưởng nhưng dưới 200k):
```typescript
{totalUnclaimed > 0 && totalUnclaimed < MIN_CLAIM_THRESHOLD && (
  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
    <div className="flex items-center gap-2">
      <Info className="h-4 w-4 text-blue-500" />
      <span className="font-medium text-blue-600">Tiến độ đến ngưỡng claim</span>
    </div>
    
    {/* Progress bar */}
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatNumber(totalUnclaimed)} CAMLY</span>
        <span>{formatNumber(MIN_CLAIM_THRESHOLD)} CAMLY</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
      <p className="text-xs text-center text-muted-foreground">
        {progressPercent.toFixed(0)}% hoàn thành
      </p>
    </div>
    
    {/* Còn bao nhiêu */}
    <p className="text-sm text-muted-foreground">
      Còn cần thêm <span className="font-bold text-blue-500">{formatNumber(amountNeeded)}</span> CAMLY để claim tự động.
    </p>
    
    {/* Gợi ý */}
    <p className="text-xs text-muted-foreground italic">
      💡 Tiếp tục xem video, like, comment để tích lũy thêm phần thưởng!
    </p>
  </div>
)}
```

**4. Cập nhật điều kiện nút Claim:**
```typescript
// Thay đổi từ:
disabled={claiming || totalUnclaimed <= 0}

// Thành:
disabled={claiming || totalUnclaimed < MIN_CLAIM_THRESHOLD}

// Và thay đổi text nút:
{totalUnclaimed < MIN_CLAIM_THRESHOLD ? (
  `Cần ${formatNumber(MIN_CLAIM_THRESHOLD - totalUnclaimed)} CAMLY nữa`
) : (
  <>
    <Coins className="h-5 w-5 mr-2" />
    Claim {formatNumber(totalUnclaimed)} CAMLY
  </>
)}
```

---

## Cập Nhật Cho Mobile

Component này được sử dụng chung cho cả Desktop và Mobile (thông qua `UnifiedClaimButton`), nên các thay đổi sẽ tự động áp dụng cho mobile.

**Responsive adjustments:**
- Progress bar hiển thị đầy đủ trên mobile
- Text size phù hợp với màn hình nhỏ
- Các Alert/Card có padding phù hợp

---

## Import Cần Thêm

```typescript
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
```

---

## Tóm Tắt Thay Đổi

| File | Thay Đổi |
|------|----------|
| `src/components/Rewards/ClaimRewardsModal.tsx` | Thêm thông báo ngưỡng 200,000 CAMLY với progress bar, cập nhật điều kiện nút Claim |

---

## Kết Quả Mong Đợi

1. **Người dùng đủ ngưỡng**: Thấy thông báo xanh "Đủ điều kiện claim!" và có thể nhấn nút claim ngay
2. **Người dùng chưa đủ ngưỡng**: Thấy progress bar với phần trăm, biết còn cần bao nhiêu CAMLY, và được gợi ý cách kiếm thêm
3. **Cập nhật real-time**: Khi Admin duyệt thêm rewards, progress bar sẽ tự động cập nhật (dựa trên realtime subscription đã có)
4. **Mobile friendly**: Giao diện responsive, dễ đọc trên điện thoại

