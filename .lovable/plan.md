

# Kế Hoạch Cập Nhật Honor Board Theo Design System "Heavenly Aurora Bliss"

## Tổng Quan

Cập nhật Honor Board để phù hợp với design system chính thức của FUN Play, sử dụng bảng màu Aurora (Cyan/Purple/Magenta/Gold) thay vì màu xanh lá hiện tại.

---

## 1. Phân Tích Vấn Đề Hiện Tại

### Màu sắc hiện tại (không phù hợp)

| Component | Màu hiện tại | Vấn đề |
|-----------|--------------|--------|
| StatPill background | `from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]` (Xanh lá) | Không khớp design system |
| Title gradient | `from-[#2E7D32] to-[#FFD700]` | Chỉ dùng 2 màu, thiếu Aurora gradient |
| Card background | `from-white via-[#E8F5E9] to-[#C8E6C9]` | Xanh lá nhạt, không phải Aurora |
| Border | `border-[#4CAF50]` | Xanh lá đậm |

### Màu sắc theo Design System (cần thay đổi)

| Element | Design System Color | HEX |
|---------|---------------------|-----|
| **Cosmic Cyan** | Primary energy | `#00E7FF` / `#00FFFF` |
| **Cosmic Purple** | Deep accent | `#7A2BFF` / `#1A0D52` |
| **Cosmic Magenta** | Main accent | `#FF00E5` / `#FF00FF` |
| **Cosmic Gold** | Highlight | `#FFD700` |
| **Cosmic Sapphire** | Primary button | `#0066FF` |

---

## 2. Thay Đổi Chi Tiết

### File 1: `src/components/Layout/HonoboardRightSidebar.tsx`

**A) StatPill Component - Cập nhật màu sắc:**

Hiện tại:
```tsx
bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]
```

Mới (Aurora theme):
```tsx
bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
// Text values giữ gold: text-[#FFD700]
// Icon và label: text-white
// Shadow: shadow-[0_4px_15px_rgba(0,231,255,0.3)]
// Hover shadow: shadow-[0_6px_25px_rgba(122,43,255,0.4)]
```

**B) Header Card - Aurora gradient:**

Hiện tại:
```tsx
bg-gradient-to-br from-white via-[#E8F5E9] to-[#C8E6C9]
border-2 border-[#4CAF50]/40
```

Mới:
```tsx
bg-gradient-to-br from-white via-[#F0F9FF] to-[#FDF4FF]
border-2 border-[#00E7FF]/40
shadow-[0_0_25px_rgba(0,231,255,0.2)]
// Hover: border-[#FF00E5]/50
```

**C) Title - Full Aurora gradient:**

Hiện tại:
```tsx
bg-gradient-to-r from-[#2E7D32] to-[#FFD700] bg-clip-text text-transparent
```

Mới:
```tsx
bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700] bg-clip-text text-transparent
```

**D) Sidebar Container:**

Hiện tại:
```tsx
bg-gradient-to-b from-white via-white to-[#E8F5E9]
border-l-2 border-[#4CAF50]/30
shadow-[-10px_0_30px_rgba(76,175,80,0.1)]
```

Mới:
```tsx
bg-gradient-to-b from-white via-white to-[#F0FDFF]
border-l-2 border-[#00E7FF]/30
shadow-[-10px_0_30px_rgba(0,231,255,0.1)]
```

**E) Top 10 Creators Section:**

Hiện tại:
```tsx
bg-gradient-to-br from-[#E8F5E9] via-white to-[#FFF8E1]
border border-[#4CAF50]/25
```

Mới:
```tsx
bg-gradient-to-br from-[#F0FDFF] via-white to-[#FFF8F0]
border border-[#00E7FF]/25
// Top creator text: text-[#7A2BFF] thay vì text-[#1B5E20]
```

**F) Rank 1 Creator:**

Hiện tại:
```tsx
border-[#FFD700] ring-2 ring-[rgba(255,215,0,0.3)] shadow-[0_0_10px_rgba(255,215,0,0.4)]
```

Mới (thêm Aurora glow):
```tsx
border-[#FFD700] ring-2 ring-[rgba(255,215,0,0.3)] 
shadow-[0_0_15px_rgba(255,215,0,0.5),0_0_25px_rgba(0,231,255,0.3)]
```

---

### File 2: `src/components/Layout/MobileHonoboardCard.tsx`

**A) MiniPill Component:**

Hiện tại:
```tsx
bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]
```

Mới:
```tsx
bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
```

**B) Card Container:**

Hiện tại:
```tsx
bg-gradient-to-r from-white via-[#E8F5E9] to-[#FFF8E1]
border border-[#4CAF50]/40
shadow-[0_0_20px_rgba(76,175,80,0.15)]
hover:shadow-[0_0_25px_rgba(76,175,80,0.25)]
hover:border-[#FFD700]/50
```

Mới:
```tsx
bg-gradient-to-r from-white via-[#F0FDFF] to-[#FFF8F0]
border border-[#00E7FF]/40
shadow-[0_0_20px_rgba(0,231,255,0.15)]
hover:shadow-[0_0_25px_rgba(122,43,255,0.25)]
hover:border-[#FF00E5]/50
```

**C) Title gradient:**

Hiện tại:
```tsx
bg-gradient-to-r from-[#2E7D32] to-[#FFD700]
```

Mới:
```tsx
bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FFD700]
```

**D) Top Creator Text:**

Hiện tại:
```tsx
text-[#1B5E20]
```

Mới:
```tsx
text-[#7A2BFF]
```

**E) Border divider:**

Hiện tại:
```tsx
border-t border-[#4CAF50]/20
```

Mới:
```tsx
border-t border-[#00E7FF]/20
```

---

### File 3: `src/components/Layout/HonobarDetailModal.tsx`

**A) StatPill - Aurora gradient:**

Cập nhật giống `HonoboardRightSidebar.tsx`:
```tsx
bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
```

**B) Sheet/Dialog styling:**

Hiện tại (Sheet):
```tsx
bg-gradient-to-b from-white to-[#E8F5E9] border-t-2 border-[#4CAF50]/50
```

Mới:
```tsx
bg-gradient-to-b from-white to-[#F0FDFF] border-t-2 border-[#00E7FF]/50
```

Hiện tại (Dialog):
```tsx
bg-gradient-to-br from-white via-[#E8F5E9] to-[#FFF8E1]
border-2 border-[#4CAF50]/50
shadow-[0_0_40px_rgba(76,175,80,0.3),0_0_80px_rgba(255,215,0,0.2)]
```

Mới:
```tsx
bg-gradient-to-br from-white via-[#F0FDFF] to-[#FFF8F0]
border-2 border-[#00E7FF]/50
shadow-[0_0_40px_rgba(0,231,255,0.3),0_0_80px_rgba(122,43,255,0.2)]
```

**C) Section borders và text:**

Thay tất cả:
- `border-[#4CAF50]` → `border-[#00E7FF]`
- `text-[#4CAF50]` → `text-[#00E7FF]`
- `text-[#1B5E20]` → `text-[#7A2BFF]`

**D) Extended Details cards:**

Hiện tại:
```tsx
bg-gradient-to-r from-[#E8F5E9] to-[#FFF8E1]
```

Mới:
```tsx
bg-gradient-to-r from-[#F0FDFF] to-[#FFF8F0]
// Hoặc glassmorphism: bg-white/80 backdrop-blur-sm border border-[#00E7FF]/20
```

---

## 3. Color Palette Reference

### Thay thế hoàn toàn

| Màu cũ (Green) | Màu mới (Aurora) | Sử dụng |
|----------------|------------------|---------|
| `#1B5E20` | `#00E7FF` | Gradient start |
| `#2E7D32` | `#7A2BFF` | Gradient middle |
| `#4CAF50` | `#FF00E5` | Gradient end |
| `#E8F5E9` | `#F0FDFF` | Light cyan background |
| `#C8E6C9` | `#FDF4FF` | Light purple background |

### Giữ nguyên

| Màu | HEX | Lý do |
|-----|-----|-------|
| Gold | `#FFD700` | Vẫn phù hợp design system |
| White | `#FFFFFF` | Background chính |
| Muted text | System | Không thay đổi |

---

## 4. Visual Preview

### StatPill mới

```text
┌────────────────────────────────────────────────────┐
│  [Cyan ━━━━ Purple ━━━━ Magenta gradient]          │
│  👥 TOTAL USERS                              150   │ ← Gold value
│  [Glow: cyan/purple shadow]                        │
└────────────────────────────────────────────────────┘
```

### Card Container mới

```text
┌─────────────────────────────────────────────────────┐
│  Background: White → Light Cyan → Light Purple      │
│  Border: 2px solid rgba(0,231,255,0.4)              │
│  Shadow: 0 0 25px rgba(0,231,255,0.2)               │
│                                                     │
│      👑 HONOR BOARD 👑                              │ ← Aurora gradient text
│         ⚡ Realtime                                 │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ [Aurora Pill] TOTAL USERS              150    │  │
│  │ [Aurora Pill] TOTAL COMMENTS          1.2K    │  │
│  │ [Aurora Pill] TOTAL VIEWS             25K     │  │
│  │ [Aurora Pill] TOTAL VIDEOS             85     │  │
│  │ [Aurora Pill] CAMLY POOL              50M     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  🏆 TOP 10 CREATORS                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🥇 [Avatar] Creator Name  [Purple text]       │  │
│  │     📹 25   👁 12.5K  [Gold glow for #1]      │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Powered by FUN Play [Aurora gradient text]         │
└─────────────────────────────────────────────────────┘
```

---

## 5. Mobile Responsive

### MobileHonoboardCard

- **Background**: White → Light Cyan → Light Orange (subtle)
- **Border**: Cyan với hover chuyển thành Magenta
- **Mini Pills**: Aurora gradient thay vì Green gradient
- **Title**: Full Aurora gradient (Cyan → Purple → Gold)
- **Glow effects**: Cyan/Purple thay vì Green

---

## 6. Files Cần Thay Đổi

| File | Thay Đổi |
|------|----------|
| `HonoboardRightSidebar.tsx` | Toàn bộ color scheme sang Aurora |
| `MobileHonoboardCard.tsx` | Cập nhật MiniPill và card colors |
| `HonobarDetailModal.tsx` | StatPill, dialog/sheet styling, section colors |

---

## 7. Thứ Tự Triển Khai

1. **HonoboardRightSidebar.tsx** - Desktop Honor Board
   - StatPill gradient colors
   - Header card background và border
   - Title Aurora gradient
   - Container border và shadow
   - Top Creators section

2. **MobileHonoboardCard.tsx** - Mobile compact card
   - MiniPill Aurora gradient
   - Card container colors
   - Title gradient
   - Divider và text colors

3. **HonobarDetailModal.tsx** - Detail modal/sheet
   - StatPill matching desktop
   - Sheet/Dialog backgrounds
   - All section borders và text

---

## 8. Kết Quả Mong Đợi

| Tính năng | Mô tả |
|-----------|-------|
| Aurora Theme | Cyan → Purple → Magenta gradient cho pills |
| Glassmorphism | White backgrounds với subtle cyan/purple tints |
| Gold Highlights | Values và rank #1 vẫn dùng gold |
| Cosmic Glow | Shadows dùng cyan/purple thay vì green |
| Consistent | Desktop, Mobile Card, Modal đều cùng color scheme |
| Real-time | Giữ nguyên realtime indicator (green dot) |

