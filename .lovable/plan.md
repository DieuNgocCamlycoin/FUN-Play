
# Áp Dụng Hiệu Ứng Mirror Shimmer Liên Tục Cho Tất Cả Nút Vàng Kim Loại

## Tổng Quan

Thêm hiệu ứng vệt trắng sáng chạy qua chạy lại LIÊN TỤC (không chỉ khi hover) trên tất cả nút vàng kim loại "Thưởng & Tặng" trên nền tảng.

---

## Thay Đổi Cần Thực Hiện

### 1. Thêm CSS Animation Mới (src/index.css)

Thêm animation `mirror-shimmer` chạy liên tục:

```css
/* Mirror shimmer effect - Continuous back and forth */
@keyframes mirror-shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.animate-mirror-shimmer {
  animation: mirror-shimmer 3s ease-in-out infinite;
}
```

---

### 2. Cập Nhật GlobalDonateButton.tsx (Header)

**Desktop variant (dòng 69-70):**
- Thay shimmer hover thành liên tục

Trước:
```tsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
```

Sau:
```tsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
```

**Mobile variant (dòng 34-45):**
- Thêm shimmer layer liên tục

Thêm vào trong Button:
```tsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer rounded-full" />
```

---

### 3. Cập Nhật ProfileInfo.tsx (Trang Cá Nhân)

**Nút "Tặng thưởng" (dòng 146-148):**

Trước:
```tsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
```

Sau:
```tsx
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
```

---

### 4. Thêm Nút "Thưởng & Tặng" Vào VideoActionsBar.tsx

**Thêm import:**
```tsx
import { Gift } from "lucide-react";
import { EnhancedDonateModal } from "@/components/Donate/EnhancedDonateModal";
```

**Thêm state:**
```tsx
const [donateModalOpen, setDonateModalOpen] = useState(false);
```

**Thêm nút sau nút Share (dòng 232):**
```tsx
{/* Donate button - Premium Gold */}
<Button
  onClick={() => { lightTap(); setDonateModalOpen(true); }}
  className="relative overflow-hidden rounded-full bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] 
             text-[#7C5800] font-bold h-10 px-4 gap-1.5 shrink-0
             shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]
             hover:shadow-[0_0_25px_rgba(255,234,0,0.7)] 
             border border-[#FFEA00]/60 transition-all duration-300"
>
  <Gift className="h-5 w-5" />
  <span className="text-sm font-bold">Tặng</span>
  {/* Mirror shimmer effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
</Button>
```

**Thêm modal ở cuối component (trước closing tag của TooltipProvider):**
```tsx
<EnhancedDonateModal
  open={donateModalOpen}
  onOpenChange={setDonateModalOpen}
  defaultReceiverId={channelId}
  defaultReceiverName={channelName}
/>
```

---

## Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/index.css` | Thêm animation `mirror-shimmer` và class `.animate-mirror-shimmer` |
| `src/components/Donate/GlobalDonateButton.tsx` | Đổi shimmer từ hover sang liên tục (cả desktop + mobile) |
| `src/components/Profile/ProfileInfo.tsx` | Đổi shimmer từ hover sang liên tục |
| `src/components/Video/Mobile/VideoActionsBar.tsx` | Thêm nút "Thưởng & Tặng" với shimmer liên tục |

---

## Kết Quả Mong Đợi

- Vệt trắng sáng chạy qua chạy lại LIÊN TỤC trên tất cả nút vàng kim loại
- Animation mượt mà 3 giây mỗi chu kỳ
- Hiệu ứng tráng gương sang trọng, thu hút sự chú ý
- Áp dụng đồng bộ trên Header, Profile, và Video

---

## Testing

- [ ] Nút "Thưởng & Tặng" trên Header có shimmer chạy liên tục
- [ ] Nút "Tặng thưởng" trên Profile có shimmer chạy liên tục  
- [ ] Nút "Tặng" dưới video có shimmer chạy liên tục
- [ ] Click nút mở modal tặng tiền hoạt động đúng
- [ ] Animation mượt mà, không giật
