# 🎨 FUN PLAY - Button & Chip Design Specifications
## Version 1.0 | February 2026

---

## 🎁 NÚT "CLAIM REWARDS"

### Màu Sắc Chính

| Thuộc tính | Tailwind CSS | CSS Native | HEX |
|------------|--------------|------------|-----|
| Gradient Start | `from-yellow-500` | `#EAB308` | Yellow-500 |
| Gradient End | `to-cyan-500` | `#06B6D4` | Cyan-500 |
| Hover Start | `from-yellow-600` | `#CA8A04` | Yellow-600 |
| Hover End | `to-cyan-600` | `#0891B2` | Cyan-600 |
| Text Color | `text-white` | `#FFFFFF` | White |

### CSS Code

```css
.claim-rewards-button {
  /* Background Gradient */
  background: linear-gradient(to right, #EAB308, #06B6D4);
  
  /* Text */
  color: #FFFFFF;
  font-weight: 700;
  
  /* Shadow */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Border Radius */
  border-radius: 6px;
  
  /* Transition */
  transition: all 0.3s ease;
}

.claim-rewards-button:hover {
  background: linear-gradient(to right, #CA8A04, #0891B2);
  transform: scale(1.02);
}
```

### Tailwind CSS Code

```html
<button class="bg-gradient-to-r from-yellow-500 to-cyan-500 
               hover:from-yellow-600 hover:to-cyan-600 
               text-white font-bold shadow-lg rounded-md 
               px-6 py-2 transition-all duration-300">
  Claim Rewards
</button>
```

---

## ✨ HIỆU ỨNG GLOW ANIMATION

### Keyframes

```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(64, 224, 208, 0.5);
  }
}

.claim-rewards-button {
  animation: glow-pulse 1.5s ease-in-out infinite;
}
```

### Màu Glow

| Màu | RGBA | Mô tả |
|-----|------|-------|
| Gold Glow | `rgba(255, 215, 0, 0.5)` | Ánh vàng kim |
| Turquoise Glow | `rgba(64, 224, 208, 0.5)` | Ánh xanh ngọc |

---

## 🪙 HIỆU ỨNG ICON COIN (Lắc Lư)

```css
@keyframes coin-wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(15deg);
  }
  75% {
    transform: rotate(-15deg);
  }
}

.coin-icon {
  animation: coin-wiggle 1s ease-in-out infinite;
}
```

---

## ⭐ HIỆU ỨNG SPARKLE (Ngôi Sao)

```css
@keyframes sparkle-spin {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.3) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

.sparkle-icon {
  animation: sparkle-spin 2s ease-in-out infinite;
  color: #FACC15; /* Yellow-400 */
}
```

---

## 🏷️ CHIP "TẤT CẢ" (Category Chip)

### Trạng Thái Đã Chọn (Selected)

| Thuộc tính | Tailwind CSS | CSS Native | HEX/Value |
|------------|--------------|------------|-----------|
| Background | `bg-white` | `#FFFFFF` | White |
| Text Color | `text-sky-700` | `#0369A1` | Sky-700 |
| Border | `border-sky-200` | `#BAE6FD` | Sky-200 |
| Shadow | `shadow-md` | Standard | - |
| Border Radius | `rounded-full` | `9999px` | Pill shape |

### CSS Code (Selected)

```css
.category-chip-selected {
  /* Background */
  background-color: #FFFFFF;
  
  /* Text */
  color: #0369A1;
  font-size: 14px;
  font-weight: 500;
  
  /* Border */
  border: 1px solid #BAE6FD;
  border-radius: 9999px;
  
  /* Shadow */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  /* Sizing */
  padding: 0 16px;
  height: 32px;
  
  /* Transition */
  transition: all 0.2s ease;
}
```

### Trạng Thái Chưa Chọn (Unselected)

| Thuộc tính | Tailwind CSS | CSS Native | HEX/Value |
|------------|--------------|------------|-----------|
| Background | `bg-white/80` | `rgba(255,255,255,0.8)` | Semi-transparent |
| Text Color | `text-sky-600` | `#0284C7` | Sky-600 |
| Border | `border-gray-200` | `#E5E7EB` | Gray-200 |

### CSS Code (Unselected)

```css
.category-chip-unselected {
  /* Background */
  background-color: rgba(255, 255, 255, 0.8);
  
  /* Text */
  color: #0284C7;
  font-size: 14px;
  font-weight: 500;
  
  /* Border */
  border: 1px solid #E5E7EB;
  border-radius: 9999px;
  
  /* Sizing */
  padding: 0 16px;
  height: 32px;
  
  /* Transition */
  transition: all 0.2s ease;
}

.category-chip-unselected:hover {
  background-color: #FFFFFF;
  color: #0369A1;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

### Tailwind CSS Code

```html
<!-- Selected State -->
<button class="bg-white text-sky-700 shadow-md border border-sky-200 
               rounded-full px-4 h-8 text-sm font-medium">
  Tất cả
</button>

<!-- Unselected State -->
<button class="bg-white/80 text-sky-600 border border-gray-200 
               hover:bg-white hover:text-sky-700 hover:shadow-sm 
               rounded-full px-4 h-8 text-sm font-medium transition-all">
  Âm nhạc
</button>
```

---

## 📋 BẢNG MÃ MÀU TỔNG HỢP

| Tên Màu | HEX | RGB | HSL |
|---------|-----|-----|-----|
| Yellow-400 | `#FACC15` | `250, 204, 21` | `48, 96%, 53%` |
| Yellow-500 | `#EAB308` | `234, 179, 8` | `48, 96%, 47%` |
| Yellow-600 | `#CA8A04` | `202, 138, 4` | `45, 93%, 40%` |
| Cyan-500 | `#06B6D4` | `6, 182, 212` | `186, 91%, 43%` |
| Cyan-600 | `#0891B2` | `8, 145, 178` | `186, 93%, 37%` |
| Sky-600 | `#0284C7` | `2, 132, 199` | `200, 98%, 39%` |
| Sky-700 | `#0369A1` | `3, 105, 161` | `201, 96%, 32%` |
| Sky-200 | `#BAE6FD` | `186, 230, 253` | `201, 94%, 86%` |
| Gray-200 | `#E5E7EB` | `229, 231, 235` | `220, 13%, 91%` |
| White | `#FFFFFF` | `255, 255, 255` | `0, 0%, 100%` |
| Gold (Glow) | `#FFD700` | `255, 215, 0` | `51, 100%, 50%` |
| Turquoise (Glow) | `#40E0D0` | `64, 224, 208` | `174, 72%, 56%` |

---

## 🔧 REACT + FRAMER MOTION COMPONENT

```tsx
import { motion } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";

export const ClaimRewardsButton = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative bg-gradient-to-r from-yellow-500 to-cyan-500 
                 hover:from-yellow-600 hover:to-cyan-600 
                 text-white font-bold shadow-lg rounded-md px-6 py-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Coin Icon with Wiggle */}
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="inline-block mr-2"
      >
        <Coins className="h-5 w-5" />
      </motion.div>
      
      Claim Rewards
      
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-md pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 10px rgba(255, 215, 0, 0.5)",
            "0 0 20px rgba(64, 224, 208, 0.5)",
            "0 0 10px rgba(255, 215, 0, 0.5)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Sparkle Decoration */}
      <motion.div
        className="absolute -top-1 -right-1"
        animate={{ 
          scale: [1, 1.3, 1], 
          rotate: [0, 180, 360] 
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="h-4 w-4 text-yellow-400" />
      </motion.div>
    </motion.button>
  );
};
```

---

## 📱 RESPONSIVE NOTES

- **Desktop**: Full button với text và icons
- **Mobile (compact)**: Icon only với badge count
- **Tablet**: Có thể dùng cả hai phiên bản

---

## 📄 LICENSE

Tài liệu này thuộc về FUN PLAY Platform.
Được phép sử dụng cho mục đích cá nhân và thương mại.

---

*Tạo bởi FUN PLAY Design System | February 2026*
