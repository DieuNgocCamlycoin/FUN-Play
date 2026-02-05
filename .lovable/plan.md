
# Kế Hoạch Thay Đổi Kích Thước và Layout 2 Cột Cho Claim Modal

## Mục Tiêu

1. **Mở rộng popup** từ `sm:max-w-md` (448px) lên `sm:max-w-2xl` (672px) hoặc `sm:max-w-3xl` (768px)
2. **Chia layout thành 2 cột** trên desktop để tận dụng không gian rộng hơn
3. **Giữ layout 1 cột trên mobile** để đảm bảo trải nghiệm tối ưu cho màn hình nhỏ

---

## Thiết Kế Layout Mới

### Desktop (>= 768px) - Layout 2 Cột

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  🎁 Claim CAMLY Rewards ✨                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐    ┌───────────────────────────────────┐ │
│  │  📊 TỔNG QUAN             │    │  ✅ CÓ THỂ CLAIM NGAY            │ │
│  │  ┌─────────┬─────────┐    │    │  ─────────────────────────────    │ │
│  │  │Có thể   │Chờ duyệt│    │    │      💰 250,000 CAMLY            │ │
│  │  │ 250,000 │  50,000 │    │    │  ─────────────────────────────    │ │
│  │  └─────────┴─────────┘    │    │  🎉 Đủ điều kiện claim!          │ │
│  │  ─────────────────────    │    │  ─────────────────────────────    │ │
│  │  TỔNG: 300,000 CAMLY      │    │  [Ví nhận: 0x1234...5678]        │ │
│  │  ─────────────────────    │    │  ─────────────────────────────    │ │
│  │  ⏳ Chi tiết chờ duyệt    │    │  ┌─────────────────────────────┐  │ │
│  │  • View (10x): +30,000    │    │  │  🚀 Claim 250,000 CAMLY     │  │ │
│  │  • Like (5x): +20,000     │    │  └─────────────────────────────┘  │ │
│  └───────────────────────────┘    └───────────────────────────────────┘ │
│  ─────────────────────────────────────────────────────────────────────  │
│        ✨ Angel says: "Rich Rich Rich rewards waiting for you!" ✨      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px) - Layout 1 Cột (Giữ Nguyên Như Hiện Tại)

```text
┌───────────────────────────────┐
│  🎁 Claim CAMLY Rewards ✨    │
├───────────────────────────────┤
│  📊 TỔNG QUAN PHẦN THƯỞNG    │
│  [Có thể claim] [Chờ duyệt]  │
│  ─────────────────────────    │
│  TỔNG: 300,000 CAMLY          │
├───────────────────────────────┤
│  ✅ CÓ THỂ CLAIM NGAY        │
│  💰 250,000 CAMLY             │
├───────────────────────────────┤
│  🎉 Đủ điều kiện claim!       │
├───────────────────────────────┤
│  [Ví nhận: 0x1234...5678]     │
│  ┌───────────────────────┐    │
│  │ 🚀 Claim 250,000 CAMLY│    │
│  └───────────────────────┘    │
├───────────────────────────────┤
│  ⏳ Phần thưởng chờ duyệt     │
│  • View (10x): +30,000        │
│  • Like (5x): +20,000         │
├───────────────────────────────┤
│        ✨ Angel says... ✨     │
└───────────────────────────────┘
```

---

## Chi Tiết Thay Đổi

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

**1. Import thêm useIsMobile hook:**
```typescript
import { useIsMobile } from "@/hooks/use-mobile";
```

**2. Thêm responsive breakpoint check:**
```typescript
const isMobileLayout = useIsMobile();
```

**3. Thay đổi DialogContent class:**
```typescript
// Từ:
className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5 border-primary/20"

// Thành:
className="sm:max-w-md md:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 max-h-[90vh] overflow-y-auto"
```

**4. Tạo layout container 2 cột cho desktop:**
```typescript
{/* Main content wrapper - 2 columns on desktop */}
<div className={cn(
  "space-y-6 py-4",
  !isMobileLayout && "md:grid md:grid-cols-2 md:gap-6 md:space-y-0"
)}>
  {/* CỘT TRÁI - Tổng quan & Pending */}
  <div className="space-y-4">
    {/* Summary Card */}
    {/* Pending rewards Alert */}
    {/* Pending breakdown list */}
  </div>

  {/* CỘT PHẢI - Claimable & Action */}
  <div className="space-y-4">
    {/* Total Unclaimed Card */}
    {/* Threshold Alert (đủ/chưa đủ điều kiện) */}
    {/* Approved breakdown list */}
    {/* Wallet Connection / Claim Button */}
  </div>
</div>

{/* Angel hint - Full width at bottom */}
<motion.p className="text-center ...">
  ✨ Angel says...
</motion.p>
```

**5. Điều chỉnh các component cho layout mới:**

- **Summary Card**: Giữ grid 2 cols bên trong, nhưng đặt trong cột trái
- **Total Unclaimed Card**: Đặt trong cột phải, giảm padding cho phù hợp
- **Breakdown lists**: Giữ nguyên style nhưng tối ưu max-height
- **Wallet/Claim section**: Đặt ở cuối cột phải

**6. Thêm ScrollArea cho mobile để tránh overflow:**
```typescript
import { ScrollArea } from "@/components/ui/scroll-area";

// Wrap content trong ScrollArea trên mobile
{isMobileLayout ? (
  <ScrollArea className="max-h-[70vh]">
    {/* Content */}
  </ScrollArea>
) : (
  /* Content without ScrollArea */
)}
```

---

## Responsive Breakpoints

| Breakpoint | Kích thước Modal | Layout |
|------------|------------------|--------|
| < 640px (Mobile) | Full width - 16px padding | 1 cột, scroll nếu cần |
| 640px - 768px (Tablet) | max-w-md (448px) | 1 cột |
| 768px - 1024px (Small Desktop) | max-w-2xl (672px) | 2 cột |
| >= 1024px (Desktop) | max-w-3xl (768px) | 2 cột |

---

## Tóm Tắt Files Thay Đổi

| File | Thay Đổi |
|------|----------|
| `src/components/Rewards/ClaimRewardsModal.tsx` | Mở rộng modal, thêm layout 2 cột responsive, tối ưu UX mobile |

---

## Kết Quả Mong Đợi

1. **Desktop**: Modal rộng hơn với 2 cột - cột trái hiển thị tổng quan + pending, cột phải hiển thị claimable + action buttons
2. **Mobile**: Giữ layout 1 cột cuộn dọc như cũ, nhưng thêm ScrollArea để không bị overflow
3. **Transition mượt**: Sử dụng Tailwind responsive classes để chuyển đổi layout tự động
4. **Touch-friendly**: Tất cả buttons vẫn >= 48px trên mobile

---

## Technical Notes

- Sử dụng `useIsMobile()` hook đã có sẵn để detect mobile
- Sử dụng Tailwind `md:grid md:grid-cols-2` cho 2 cột
- Thêm `max-h-[90vh] overflow-y-auto` để đảm bảo modal không vượt quá viewport
- Sử dụng `cn()` utility để conditional classes
