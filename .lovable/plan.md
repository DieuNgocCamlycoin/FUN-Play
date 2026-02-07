
# Kế Hoạch Đồng Bộ 3 Nút Header

## Tổng Quan

Điều chỉnh 3 nút "Thưởng & Tặng", "MINT FUN MONEY" và "WALLET" để có kích thước đồng nhất, và nút MINT có style vàng kim loại sang trọng giống nút "Thưởng & Tặng".

---

## Phần I: So Sánh Hiện Tại vs Mới

| Thuộc tính | Thưởng & Tặng | MINT (Hiện tại) | MINT (Mới) | WALLET |
|------------|---------------|-----------------|------------|--------|
| **Background** | Vàng kim loại gradient | Cyan-blue opacity 10% | Vàng kim loại gradient ✨ | Cyan-teal-blue |
| **Text Color** | #7C5800 (nâu vàng) | Cyan gradient | #7C5800 (nâu vàng) ✨ | Trắng |
| **Border** | #FFEA00/60 | cyan-400/30 | #FFEA00/60 ✨ | Không |
| **Effect** | Mirror Shimmer | Không | Mirror Shimmer ✨ | Mirror Shimmer |
| **Padding** | px-4 py-2 | px-3 py-2 | px-4 py-2 ✨ | px-5 py-2 |
| **Font Size** | text-base font-extrabold | text-sm font-semibold | text-base font-extrabold ✨ | text-lg font-bold |

---

## Phần II: Layout Mới

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  [🎁 THƯỞNG & TẶNG]   [🪙 MINT]   [💎 WALLET]                                       │
│   ↑ Vàng kim loại      ↑ Vàng kim loại   ↑ Cyan-teal-blue                           │
│   (giữ nguyên)         (ĐỔI MỚI)         (giữ nguyên)                               │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phần III: File Cần Thay Đổi

| File | Hành động |
|------|-----------|
| `src/components/Layout/Header.tsx` | Cập nhật styling nút MINT FUN MONEY |

---

## Phần IV: Chi Tiết Styling Mới Cho MINT Button

### Code mới:

```typescript
{/* MINT FUN MONEY Button */}
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        onClick={() => navigate("/fun-money")}
        className="relative hidden md:flex items-center gap-2 overflow-hidden
                   bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] 
                   text-[#7C5800] font-extrabold rounded-full px-4 py-2
                   shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] 
                   hover:shadow-[0_0_25px_rgba(255,234,0,0.6),0_0_40px_rgba(255,215,0,0.3)] 
                   border border-[#FFEA00]/60 
                   transition-all duration-300 hover:scale-105"
      >
        <img 
          src="/images/fun-money-coin.png" 
          alt="FUN Money" 
          className="h-5 w-5 rounded-full object-cover ring-1 ring-[#7C5800]/30 relative z-10"
        />
        <span className="text-base font-extrabold relative z-10 tracking-wide">
          MINT
        </span>
        {/* Mirror shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Mint FUN Money - PPLP Protocol</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Phần V: Giải Thích Style Vàng Kim Loại

| Thuộc tính | Giá trị | Mục đích |
|------------|---------|----------|
| `bg-gradient-to-b` | `#FFEA00 → #FFD700 → #E5A800` | Gradient vàng từ sáng xuống tối |
| `text-[#7C5800]` | Nâu vàng đậm | Tương phản tốt trên nền vàng |
| `inset shadow top` | `rgba(255,255,255,0.6)` | Hiệu ứng ánh sáng phản chiếu 3D |
| `inset shadow bottom` | `rgba(0,0,0,0.1)` | Chiều sâu |
| `border` | `#FFEA00/60` | Viền vàng nhẹ |
| `animate-mirror-shimmer` | CSS animation | Hiệu ứng gương lấp lánh liên tục |

---

## Phần VI: Kết Quả Mong Đợi

```text
Trước:
[🎁 THƯỞNG & TẶNG]  [🪙 MINT]  [💎 WALLET]
     Vàng            Xanh lạc      Xanh cyan
                     tone ❌

Sau:
[🎁 THƯỞNG & TẶNG]  [🪙 MINT]  [💎 WALLET]
     Vàng            Vàng ✅      Xanh cyan
     Kim loại        Kim loại     Holographic
```

---

## Tóm Tắt

| Bước | Công việc |
|------|-----------|
| 1 | Thay đổi background của MINT từ cyan sang gradient vàng kim loại |
| 2 | Đổi text color sang #7C5800 |
| 3 | Thêm border vàng và shadow inset cho hiệu ứng 3D |
| 4 | Thêm Mirror Shimmer animation |
| 5 | Điều chỉnh padding và font size cho đồng bộ với nút Thưởng & Tặng |

**Thời gian ước tính:** 5-10 phút
