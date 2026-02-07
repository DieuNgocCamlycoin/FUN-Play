
# Kế Hoạch Nâng Cấp TokenLifecyclePanel

## Tổng Quan

Nâng cấp TokenLifecyclePanel để cung cấp giao diện trực quan và đầy đủ tính năng hơn cho users quản lý trạng thái tokens LOCKED/ACTIVATED/FLOWING. Tích hợp logo FUN Money và CAMLY Coin mà bạn đã gửi.

---

## Phần I: Files Sẽ Thay Đổi

| File | Hành động | Mô tả |
|------|-----------|-------|
| `public/images/fun-money-coin.png` | **Tạo mới** | Copy logo FUN Money từ user-uploads |
| `src/components/FunMoney/TokenLifecyclePanel.tsx` | **Nâng cấp** | Thêm logo, animation, detailed stats |
| `src/components/FunMoney/index.ts` | Giữ nguyên | Đã export đầy đủ |

---

## Phần II: Thiết Kế UI Mới

### 2.1. Header Section (Với Logo)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [FUN Money Logo]  Token Lifecycle                                       │
│                    Trạng thái FUN tokens của bạn          [150 FUN đã mint] │
├─────────────────────────────────────────────────────────────────────────┤
│  Tiến trình mint                                                 45%    │
│  [████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Lifecycle States (3 Columns với Animation)

```text
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│      🔒 LOCKED        │───>│      ⚡ ACTIVATED     │───>│      🌊 FLOWING       │
│                       │    │                       │    │                       │
│  ┌─────────────────┐  │    │  ┌─────────────────┐  │    │  ┌─────────────────┐  │
│  │   [Coin Icon]   │  │    │  │   [Coin Icon]   │  │    │  │   [Coin Icon]   │  │
│  │    glowing      │  │    │  │    pulsing      │  │    │  │    flowing      │  │
│  └─────────────────┘  │    │  └─────────────────┘  │    │  └─────────────────┘  │
│                       │    │                       │    │                       │
│      2 requests       │    │      1 request        │    │      5 requests       │
│      150 FUN          │    │      75 FUN           │    │      500 FUN          │
│                       │    │                       │    │                       │
│   Đang chờ Admin      │    │   Sẵn sàng mint       │    │   Đã nhận on-chain    │
│       review          │    │                       │    │                       │
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

### 2.3. Detailed Stats Section

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Total Value               Light Score (Avg)       Unity Score (Avg)    │
│  [FUN Logo] 725 FUN        ⭐ 78.5                 🤝 65.2               │
├─────────────────────────────────────────────────────────────────────────┤
│  [View All Requests]  [Refresh]                    BSCScan: 5 tx ↗      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phần III: Tính Năng Mới

### 3.1. Visual Enhancements

| Tính năng | Mô tả |
|-----------|-------|
| **FUN Money Logo** | Hiển thị logo coin trong header và mỗi state |
| **Coin Animation** | Animation khác nhau cho mỗi trạng thái |
| **Progress Gradient** | Gradient đẹp cho progress bar |
| **Glow Effects** | Hiệu ứng sáng theo Design System |
| **Status Indicators** | Ring animation cho state có items |

### 3.2. Interactive Features

| Tính năng | Mô tả |
|-----------|-------|
| **Click to Filter** | Click vào state để filter danh sách |
| **Hover Details** | Tooltip hiện chi tiết khi hover |
| **Quick Actions** | Nút View All và Refresh |
| **BSCScan Link** | Link trực tiếp đến BSCScan |

### 3.3. Statistics

| Metric | Mô tả |
|--------|-------|
| **Total Value** | Tổng giá trị FUN tokens |
| **Average Light Score** | Điểm Light trung bình |
| **Average Unity Score** | Điểm Unity trung bình |
| **Mint Success Rate** | Tỷ lệ mint thành công |
| **Transaction Count** | Số giao dịch on-chain |

---

## Phần IV: Animation Specifications

### 4.1. LOCKED State Animation

```css
/* Coin có hiệu ứng "locked/chained" */
@keyframes locked-pulse {
  0%, 100% { 
    filter: grayscale(30%) brightness(0.9);
    transform: scale(1);
  }
  50% { 
    filter: grayscale(30%) brightness(1);
    transform: scale(1.02);
  }
}
```

### 4.2. ACTIVATED State Animation

```css
/* Coin có hiệu ứng "ready/energized" */
@keyframes activated-glow {
  0%, 100% { 
    filter: drop-shadow(0 0 10px #3B82F6);
    transform: scale(1) rotate(0deg);
  }
  50% { 
    filter: drop-shadow(0 0 20px #60A5FA);
    transform: scale(1.05) rotate(2deg);
  }
}
```

### 4.3. FLOWING State Animation

```css
/* Coin có hiệu ứng "flowing/success" */
@keyframes flowing-shine {
  0% { 
    filter: drop-shadow(0 0 15px #22C55E);
    transform: translateY(0);
  }
  25% {
    transform: translateY(-5px);
  }
  50% { 
    filter: drop-shadow(0 0 25px #4ADE80);
    transform: translateY(0);
  }
  75% {
    transform: translateY(-3px);
  }
  100% { 
    filter: drop-shadow(0 0 15px #22C55E);
    transform: translateY(0);
  }
}
```

---

## Phần V: Props Interface

```typescript
interface TokenLifecyclePanelProps {
  requests: MintRequest[];
  className?: string;
  // NEW Props
  onStateClick?: (state: 'locked' | 'activated' | 'flowing') => void;
  onViewAll?: () => void;
  onRefresh?: () => void;
  showDetailedStats?: boolean;
  compactMode?: boolean;
}
```

---

## Phần VI: Chi Tiết Triển Khai

### Bước 1: Copy Logo vào Project

```bash
# Copy FUN Money logo
lov-copy user-uploads://1.png public/images/fun-money-coin.png

# Note: CAMLY logo đã có tại src/assets/camly-coin-logo.png
```

### Bước 2: Nâng Cấp TokenLifecyclePanel

**Thay đổi chính:**

1. **Header với Logo:**
   - Thêm FUN Money coin image
   - Gradient title matching Premium 5D style
   - Badge với coin icon

2. **Enhanced State Cards:**
   - Mỗi card có coin icon với animation riêng
   - Larger, more prominent numbers
   - Better color coding
   - Ring animation khi có items

3. **Progress Bar với Gradient:**
   - Aurora gradient cho progress
   - Animated shimmer effect
   - Percentage label cải thiện

4. **Summary Stats Row:**
   - Total value với coin icon
   - Average scores
   - Action buttons

5. **Responsive Design:**
   - Desktop: 3 columns ngang
   - Mobile: Stack vertically với smaller coins

---

## Phần VII: Color Palette

| State | Primary Color | Gradient | Glow |
|-------|--------------|----------|------|
| LOCKED | `#EAB308` (Yellow) | Yellow-500 → Amber-500 | `0 0 20px rgba(234,179,8,0.5)` |
| ACTIVATED | `#3B82F6` (Blue) | Blue-500 → Cyan-500 | `0 0 20px rgba(59,130,246,0.5)` |
| FLOWING | `#22C55E` (Green) | Green-500 → Emerald-500 | `0 0 20px rgba(34,197,94,0.5)` |

---

## Phần VIII: Premium 5D Styling Integration

Theo Design System, áp dụng cho panel:

```css
/* Gold metallic gradient cho wealth elements */
.fun-coin-badge {
  background: linear-gradient(180deg, #FFEA00 0%, #E5A800 100%);
  color: #7C5800;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}

/* Mirror shimmer animation */
@keyframes mirror-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

---

## Tóm Tắt

Nâng cấp này sẽ biến TokenLifecyclePanel từ một visualization đơn giản thành một dashboard tương tác hoàn chỉnh với:

1. **Logo FUN Money** được hiển thị đẹp với animation
2. **3 trạng thái** với visual distinction rõ ràng
3. **Thống kê chi tiết** để users theo dõi performance
4. **Actions** để navigate và refresh data
5. **Premium styling** theo Design System 5D

Thời gian triển khai ước tính: **1.5-2 giờ**
