# FUN PLAY DESIGN SYSTEM v1.0
## Tài Liệu Thiết Kế Chính Thức - "Heavenly Aurora Bliss Theme"

---

## 1. TRIẾT LÝ THIẾT KẾ

**Tên chủ đề**: Heavenly Aurora Bliss (Cực Quang Thiên Đường)

**Tinh thần**: 5D Light Economy - Ánh sáng, Tích cực, Vui vẻ, Nâng đỡ nhau

**Phong cách**: 
- Cosmic (Vũ trụ) + Divine (Thần thánh)
- Glassmorphism (Hiệu ứng kính mờ)
- Aurora Gradient (Gradient cực quang 4 màu)
- Glow Effects (Hiệu ứng phát sáng)

---

## 2. BẢNG MÀU (COLOR PALETTE)

### 2.1. Cosmic Colors (Màu Vũ Trụ Chính)

| Tên | CSS Variable | HSL | HEX | RGB | Mô tả |
|-----|--------------|-----|-----|-----|-------|
| **Cosmic Cyan** | `--cosmic-cyan` | `hsl(180 100% 50%)` | `#00FFFF` | `rgb(0, 255, 255)` | Xanh cyan rực rỡ - Màu năng lượng |
| **Cosmic Purple** | `--cosmic-purple` | `hsl(253 81% 20%)` | `#1A0D52` | `rgb(26, 13, 82)` | Tím đậm vũ trụ - Màu nền sâu |
| **Cosmic Magenta** | `--cosmic-magenta` | `hsl(291 100% 50%)` | `#FF00FF` | `rgb(255, 0, 255)` | Hồng magenta - Màu accent chính |
| **Cosmic Gold** | `--cosmic-gold` | `hsl(51 100% 50%)` | `#FFD700` | `rgb(255, 215, 0)` | Vàng kim - Màu highlight |
| **Cosmic Sapphire** | `--cosmic-sapphire` | `hsl(216 100% 50%)` | `#0066FF` | `rgb(0, 102, 255)` | Xanh sapphire - Màu primary |

### 2.2. Divine Colors (Màu Thần Thánh)

| Tên | CSS Variable | HSL | HEX | Mô tả |
|-----|--------------|-----|-----|-------|
| **Divine Pink** | `--divine-pink` | `hsl(308 100% 86%)` | `#FFB7F6` | Hồng pastel thiên thần |
| **Divine Rose Gold** | `--divine-rose-gold` | `hsl(308 100% 86%)` | `#FFB7F6` | Vàng hồng nhẹ nhàng |
| **Divine Lavender** | `--divine-lavender` | `hsl(270 80% 85%)` | `#D8B3FF` | Tím lavender nhẹ |

### 2.3. Glow Colors (Màu Phát Sáng)

| Tên | CSS Variable | HSL | Sử dụng |
|-----|--------------|-----|---------|
| **Glow Gold** | `--glow-gold` | `hsl(51 100% 50%)` | Hiệu ứng vàng phát sáng |
| **Glow Cyan** | `--glow-cyan` | `hsl(180 100% 50%)` | Hiệu ứng xanh phát sáng |
| **Glow Magenta** | `--glow-magenta` | `hsl(291 100% 50%)` | Hiệu ứng hồng phát sáng |
| **Glow Sapphire** | `--glow-sapphire` | `hsl(216 100% 50%)` | Hiệu ứng xanh biển phát sáng |
| **Glow White** | `--glow-white` | `hsl(0 0% 100%)` | Hiệu ứng trắng thuần khiết |

### 2.4. UI Colors (Màu Giao Diện)

**Light Mode:**

| Tên | CSS Variable | HSL | Sử dụng |
|-----|--------------|-----|---------|
| Background | `--background` | `hsl(0 0% 100%)` | Nền trắng tinh khiết |
| Foreground | `--foreground` | `hsl(222 47% 11%)` | Chữ tối |
| Primary | `--primary` | `hsl(186 100% 50%)` | Nút chính |
| Secondary | `--secondary` | `hsl(200 100% 95%)` | Nút phụ |
| Muted | `--muted` | `hsl(200 100% 98%)` | Nền mờ |
| Border | `--border` | `hsl(200 100% 90%)` | Viền nhẹ |
| Ring | `--ring` | `hsl(186 100% 50%)` | Focus ring |

**Dark Mode:**

| Tên | CSS Variable | HSL | Sử dụng |
|-----|--------------|-----|---------|
| Background | `--background` | `hsl(228 63% 11%)` | Nền tối vũ trụ |
| Foreground | `--foreground` | `hsl(0 0% 100%)` | Chữ trắng |
| Primary | `--primary` | `hsl(216 100% 50%)` | Nút chính sapphire |
| Secondary | `--secondary` | `hsl(291 100% 50%)` | Nút phụ magenta |
| Card | `--card` | `hsl(253 81% 20%)` | Nền card tím |
| Border | `--border` | `hsl(291 100% 50%)` | Viền magenta |

---

## 3. GRADIENT (CÁC DẢI MÀU)

### 3.1. Aurora Gradient (Gradient Chính)

**CSS:**
```css
background: linear-gradient(135deg, #00E7FF 0%, #7A2BFF 33%, #FF00E5 66%, #FFD700 100%);
```

**Tailwind:**
```html
bg-gradient-to-br from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700]
```

**Sử dụng**: Viền card, nút CTA chính, tiêu đề lớn

### 3.2. Cosmic Background Gradient (Light Mode)

**CSS:**
```css
background: linear-gradient(135deg, #FFFFFF 0%, #F8F4FF 50%, #FFFFFF 100%);
```

**Sử dụng**: Nền trang chính

### 3.3. Cosmic Background Gradient (Dark Mode)

**CSS:**
```css
background: 
  radial-gradient(ellipse at center, hsl(216 100% 30% / 0.3), transparent 50%),
  radial-gradient(ellipse at top right, hsl(291 100% 30% / 0.2), transparent 50%),
  radial-gradient(ellipse at bottom left, hsl(180 100% 30% / 0.2), transparent 50%);
```

**Sử dụng**: Nền trang dark mode

### 3.4. Button Gradients

**Primary Button:**
```css
background: linear-gradient(to right, 
  hsl(216 100% 50%),  /* Sapphire */
  hsl(180 100% 50%),  /* Cyan */
  hsl(291 100% 50%)   /* Magenta */
);
```

**Secondary Button:**
```css
background: linear-gradient(to right, 
  hsl(291 100% 50%),  /* Magenta */
  hsl(308 100% 86%)   /* Divine Pink */
);
```

---

## 4. TYPOGRAPHY (CHỮ VIẾT)

### 4.1. Font Family

**Primary Font**: Inter
```css
font-family: 'Inter', sans-serif;
```

**Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### 4.2. Gradient Text

**CSS:**
```css
.gradient-text {
  background: linear-gradient(to right, #00E7FF, #7A2BFF, #FF00E5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Tailwind:**
```html
bg-gradient-to-r from-cosmic-cyan via-cosmic-magenta to-cosmic-gold bg-clip-text text-transparent
```

---

## 5. SHADOWS & GLOWS (BÓNG & ÁNH SÁNG)

### 5.1. Divine Shadow (Bóng Thần Thánh)

**CSS:**
```css
box-shadow: 
  0 0 60px rgba(0, 102, 255, 0.8),   /* Sapphire glow */
  0 0 100px rgba(217, 0, 255, 0.6),  /* Magenta glow */
  0 0 140px rgba(0, 255, 255, 0.4),  /* Cyan glow */
  0 8px 32px rgba(0, 0, 0, 0.5);     /* Base shadow */
```

**CSS Variable:** `var(--shadow-divine)`

### 5.2. Card Glow (Glow cho Card)

**CSS:**
```css
box-shadow: 
  0 0 40px rgba(0, 102, 255, 0.5),
  0 0 60px rgba(217, 0, 255, 0.3),
  inset 0 0 80px rgba(255, 183, 246, 0.1);
```

**CSS Variable:** `var(--shadow-card-glow)`

### 5.3. Hover Sparkle (Glow khi Hover)

**CSS:**
```css
box-shadow: 
  0 0 80px rgba(0, 255, 255, 1),
  0 0 120px rgba(217, 0, 255, 0.8),
  0 0 160px rgba(255, 215, 0, 0.6),
  0 0 200px rgba(255, 183, 246, 0.5);
```

**CSS Variable:** `var(--shadow-hover-sparkle)`

### 5.4. Button Shadows

**Default Button:**
```css
box-shadow: 0 0 40px rgba(0, 102, 255, 0.8);
/* Hover: */
box-shadow: 0 0 80px rgba(0, 255, 255, 1);
```

**Secondary Button:**
```css
box-shadow: 0 0 30px rgba(217, 0, 255, 0.7);
/* Hover: */
box-shadow: 0 0 60px rgba(255, 183, 246, 0.9);
```

---

## 6. COMPONENTS (CÁC THÀNH PHẦN)

### 6.1. Button Variants

**Default (Primary) Button:**
```css
.btn-default {
  background: linear-gradient(to right, 
    hsl(216 100% 50%), 
    hsl(180 100% 50%), 
    hsl(291 100% 50%)
  );
  color: white;
  border: 2px solid rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 40px rgba(0, 102, 255, 0.8);
  transition: all 0.5s ease;
}

.btn-default:hover {
  box-shadow: 0 0 80px rgba(0, 255, 255, 1);
  transform: scale(1.05);
}
```

**Tailwind:**
```html
<button class="bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta text-white border-2 border-glow-cyan/60 shadow-[0_0_40px_rgba(0,102,255,0.8)] hover:shadow-[0_0_80px_rgba(0,255,255,1)] hover:scale-105 transition-all duration-500">
  Button Text
</button>
```

**Secondary Button:**
```css
.btn-secondary {
  background: linear-gradient(to right, 
    hsl(291 100% 50%), 
    hsl(308 100% 86%)
  );
  box-shadow: 0 0 30px rgba(217, 0, 255, 0.7);
}
```

**Outline Button:**
```css
.btn-outline {
  border: 2px solid rgba(217, 0, 255, 0.7);
  background: transparent;
}

.btn-outline:hover {
  background: rgba(217, 0, 255, 0.2);
  box-shadow: 0 0 50px rgba(217, 0, 255, 0.9);
}
```

**Ghost Button:**
```css
.btn-ghost {
  background: transparent;
}

.btn-ghost:hover {
  background: rgba(0, 102, 255, 0.2);
  box-shadow: 0 0 35px rgba(0, 255, 255, 0.6);
}
```

### 6.2. Glass Card (Glassmorphism)

**CSS:**
```css
.glass-card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9), 
    rgba(248, 244, 255, 0.8)
  );
  backdrop-filter: blur(20px) saturate(180%);
  border: 2px solid transparent;
  background-image: 
    linear-gradient(white, white),
    linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5, #FFD700);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  border-radius: 16px;
  box-shadow: 
    0 0 20px rgba(0, 102, 255, 0.3),
    0 0 40px rgba(217, 0, 255, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95), 
    rgba(248, 244, 255, 0.9)
  );
  box-shadow: 
    0 0 40px rgba(0, 255, 255, 0.6),
    0 0 60px rgba(217, 0, 255, 0.5),
    0 0 80px rgba(255, 215, 0, 0.4),
    0 0 100px rgba(255, 183, 246, 0.3);
  transform: translateY(-4px);
  animation: rainbow-border 3s linear infinite;
}
```

### 6.3. Category Chips

**Selected State:**
```css
.chip-selected {
  background: white;
  color: hsl(199 89% 40%); /* sky-700 */
  border: 1px solid hsl(199 89% 80%); /* sky-200 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  font-weight: 500;
}
```

**Default State:**
```css
.chip-default {
  background: rgba(255, 255, 255, 0.8);
  color: hsl(199 89% 48%); /* sky-600 */
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 9999px;
}

.chip-default:hover {
  background: white;
  color: hsl(199 89% 40%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
```

---

## 7. ANIMATIONS (HIỆU ỨNG CHUYỂN ĐỘNG)

### 7.1. Rainbow Border Animation

**CSS:**
```css
@keyframes rainbow-border {
  0% { 
    border-color: hsl(216 100% 50%); /* Sapphire */
    box-shadow: 0 0 40px hsl(216 100% 50%); 
  }
  25% { 
    border-color: hsl(180 100% 50%); /* Cyan */
    box-shadow: 0 0 40px hsl(180 100% 50%); 
  }
  50% { 
    border-color: hsl(291 100% 50%); /* Magenta */
    box-shadow: 0 0 40px hsl(291 100% 50%); 
  }
  75% { 
    border-color: hsl(51 100% 50%); /* Gold */
    box-shadow: 0 0 40px hsl(51 100% 50%); 
  }
  100% { 
    border-color: hsl(216 100% 50%); /* Sapphire */
    box-shadow: 0 0 40px hsl(216 100% 50%); 
  }
}

.rainbow-border {
  animation: rainbow-border 3s linear infinite;
}
```

### 7.2. Float Animation (Hiệu ứng Bay)

**CSS:**
```css
@keyframes float {
  0%, 100% { 
    transform: translateY(0px) translateX(0px); 
  }
  50% { 
    transform: translateY(-20px) translateX(10px); 
  }
}

.float {
  animation: float 6s ease-in-out infinite;
}
```

### 7.3. Pulse Glow Animation

**CSS:**
```css
@keyframes pulse-glow {
  0%, 100% { 
    filter: brightness(1) drop-shadow(0 0 10px currentColor); 
  }
  50% { 
    filter: brightness(1.3) drop-shadow(0 0 20px currentColor); 
  }
}

.pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}
```

### 7.4. Shimmer Animation (Hiệu ứng Lấp Lánh)

**CSS:**
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.shimmer {
  animation: shimmer 6s ease-in-out infinite;
}
```

### 7.5. Sparkle Animation

**CSS:**
```css
@keyframes sparkle {
  0%, 100% { 
    opacity: 0; 
    transform: scale(0) rotate(0deg); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1) rotate(180deg); 
  }
}

.sparkle {
  animation: sparkle 2s ease-in-out infinite;
}
```

### 7.6. Pulse Halo Animation

**CSS:**
```css
@keyframes pulse-halo {
  0%, 100% { 
    opacity: 0.5; 
    transform: scale(1); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1.1); 
  }
}

.halo::after {
  animation: pulse-halo 2s ease-in-out infinite;
}
```

### 7.7. Rainbow Glow Animation

**CSS:**
```css
@keyframes rainbow-glow {
  0% { filter: drop-shadow(0 0 12px rgba(255, 0, 0, 0.9)); }
  16% { filter: drop-shadow(0 0 12px rgba(255, 255, 0, 0.9)); }
  33% { filter: drop-shadow(0 0 12px rgba(0, 255, 0, 0.9)); }
  50% { filter: drop-shadow(0 0 12px rgba(0, 255, 255, 0.9)); }
  66% { filter: drop-shadow(0 0 12px rgba(0, 0, 255, 0.9)); }
  83% { filter: drop-shadow(0 0 12px rgba(255, 0, 255, 0.9)); }
  100% { filter: drop-shadow(0 0 12px rgba(255, 0, 0, 0.9)); }
}

.rainbow-glow {
  animation: rainbow-glow 3s linear infinite;
}
```

---

## 8. SPECIAL EFFECTS (HIỆU ỨNG ĐẶC BIỆT)

### 8.1. Holographic Effect

**CSS:**
```css
.holographic {
  background: linear-gradient(135deg, 
    rgba(0, 231, 255, 0.3), 
    rgba(122, 43, 255, 0.3), 
    rgba(255, 0, 229, 0.3), 
    rgba(255, 215, 0, 0.3)
  );
  background-size: 400% 400%;
  animation: shimmer 6s ease-in-out infinite;
}
```

### 8.2. Divine Glow Effect

**CSS:**
```css
.divine-glow {
  box-shadow: 
    0 0 60px rgba(0, 102, 255, 0.8),
    0 0 100px rgba(217, 0, 255, 0.6),
    0 0 140px rgba(0, 255, 255, 0.4),
    0 8px 32px rgba(0, 0, 0, 0.5);
  animation: pulse-glow 3s ease-in-out infinite;
}
```

### 8.3. Rainbow Sparkle Effect

**CSS:**
```css
.rainbow-sparkle {
  position: relative;
  overflow: hidden;
}

.rainbow-sparkle::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(0, 231, 255, 0.5) 40%,
    rgba(122, 43, 255, 0.5) 50%,
    rgba(255, 0, 229, 0.5) 60%,
    rgba(255, 215, 0, 0.5) 70%,
    transparent 80%
  );
  transform: rotate(45deg);
  animation: sparkle-sweep 3s linear infinite;
}

@keyframes sparkle-sweep {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}
```

### 8.4. Halo Effect

**CSS:**
```css
.halo {
  position: relative;
}

.halo::after {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.3) 0%,
    rgba(255, 0, 229, 0.2) 25%,
    rgba(122, 43, 255, 0.1) 50%,
    transparent 70%
  );
  border-radius: inherit;
  z-index: -1;
  animation: pulse-halo 2s ease-in-out infinite;
}
```

---

## 9. TRANSITIONS (CHUYỂN TIẾP)

### 9.1. Smooth Transition

**CSS:**
```css
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

**CSS Variable:** `var(--transition-smooth)`

### 9.2. Glow Transition

**CSS:**
```css
transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

**CSS Variable:** `var(--transition-glow)`

---

## 10. SPACING & SIZING

### 10.1. Border Radius

| Size | Value | CSS Variable |
|------|-------|--------------|
| Small | 12px | `calc(var(--radius) - 4px)` |
| Medium | 14px | `calc(var(--radius) - 2px)` |
| Large | 16px | `var(--radius)` |
| Full | 9999px | `rounded-full` |

**Default Radius:** `--radius: 1rem` (16px)

### 10.2. Button Sizes

| Size | Height | Padding |
|------|--------|---------|
| Small | 36px (h-9) | px-4 |
| Default | 44px (h-11) | px-6 py-2 |
| Large | 52px (h-13) | px-10 |
| Icon | 44x44px (h-11 w-11) | - |

---

## 11. UTILITY CLASSES (LỚP TIỆN ÍCH)

### Tailwind Custom Classes

```css
/* Glass Card */
.glass-card { /* see Section 6.2 */ }

/* Holographic */
.holographic { /* see Section 8.1 */ }

/* Divine Glow */
.divine-glow { /* see Section 8.2 */ }

/* Floating Particles */
.particle { animation: float 6s ease-in-out infinite; }

/* Rainbow Sparkle */
.rainbow-sparkle { /* see Section 8.3 */ }

/* Halo Effect */
.halo { /* see Section 8.4 */ }
```

---

## 12. TAILWIND CONFIG COLORS

```javascript
// tailwind.config.ts
colors: {
  cosmic: {
    cyan: "hsl(var(--cosmic-cyan))",
    purple: "hsl(var(--cosmic-purple))",
    magenta: "hsl(var(--cosmic-magenta))",
    gold: "hsl(var(--cosmic-gold))",
    sapphire: "hsl(var(--cosmic-sapphire))",
  },
  divine: {
    pink: "hsl(var(--divine-pink))",
    "rose-gold": "hsl(var(--divine-rose-gold))",
    lavender: "hsl(var(--divine-lavender))",
  },
  glow: {
    gold: "hsl(var(--glow-gold))",
    cyan: "hsl(var(--glow-cyan))",
    magenta: "hsl(var(--glow-magenta))",
    sapphire: "hsl(var(--glow-sapphire))",
    white: "hsl(var(--glow-white))",
  },
  fun: {
    yellow: "hsl(var(--cosmic-gold))",
    blue: "hsl(var(--cosmic-sapphire))",
  },
}
```

---

## 13. QUICK REFERENCE CHEAT SHEET

### Màu Thường Dùng (Copy-Paste)

| Mục đích | CSS/Tailwind |
|----------|--------------|
| **Nền gradient Aurora** | `bg-gradient-to-br from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700]` |
| **Chữ gradient** | `bg-gradient-to-r from-cosmic-cyan via-cosmic-magenta to-cosmic-gold bg-clip-text text-transparent` |
| **Viền cầu vồng** | `border-2 border-transparent` + `animation: rainbow-border 3s linear infinite` |
| **Shadow phát sáng** | `shadow-[0_0_40px_rgba(0,102,255,0.8)]` |
| **Glass card** | class="glass-card" |
| **Nút Primary** | `bg-gradient-to-r from-cosmic-sapphire via-cosmic-cyan to-cosmic-magenta` |

### HEX Colors (Figma/Photoshop)

| Tên | HEX |
|-----|-----|
| Cyan | #00FFFF |
| Sapphire | #0066FF |
| Magenta | #FF00FF |
| Gold | #FFD700 |
| Purple Dark | #1A0D52 |
| Divine Pink | #FFB7F6 |
| Lavender | #D8B3FF |

---

## 14. FILE REFERENCES

Các file chứa Design System trong project:

| File | Nội dung |
|------|----------|
| `src/index.css` | CSS Variables, Animations, Utility Classes |
| `tailwind.config.ts` | Tailwind color config, keyframes |
| `src/components/ui/button.tsx` | Button variants |

---

**FUN PLAY Design System v1.0**  
*Heavenly Aurora Bliss Theme*  
*5D Light Economy - Chia sẻ ánh sáng, Nâng đỡ nhau*

---

© 2024 FUN ECOSYSTEM - All Rights Reserved
