
# Kế Hoạch Thiết Kế Lại Trang Chủ FUN Play

## Tổng Quan

Thiết kế lại layout trang chủ theo mô hình 3 cột (desktop) giống YouTube 2025:
- **Cột trái**: Sidebar thu gọn/mở rộng với FUN ECOSYSTEM luôn cố định
- **Cột giữa**: Grid 2 cột hiển thị video  
- **Cột phải**: Honor Board với thông tin chi tiết

---

## 1. Kiến Trúc Layout Mới

### Desktop (≥1024px)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                           HEADER (fixed)                               │
├──────────┬─────────────────────────────────────────┬───────────────────┤
│          │                                         │                   │
│  SIDEBAR │           VIDEO GRID (2 cột)            │   HONOR BOARD     │
│  (240px) │           (flex-grow)                   │     (280px)       │
│          │                                         │                   │
│  ───────────                                       │   ┌───────────┐   │
│  FUN ECOSYSTEM                                     │   │ 👑 HONOR  │   │
│  (luôn hiển thị)                                   │   │   BOARD   │   │
│  ───────────                                       │   ├───────────┤   │
│  [≡] Toggle                                        │   │ Users: 150│   │
│  ───────────                                       │   │ Videos: 85│   │
│  Home                                              │   │ Views: 10K│   │
│  Shorts                                            │   │ Pool: 50M │   │
│  Subscriptions                                     │   ├───────────┤   │
│  ...                                               │   │TOP CREATORS│  │
│                                                    │   │ 1. User A │   │
│                                                    │   │ 2. User B │   │
│                                                    │   │ 3. User C │   │
│                                                    │   │ ...       │   │
│                                                    │   └───────────┘   │
├──────────┴─────────────────────────────────────────┴───────────────────┤
```

### Mobile (<1024px)

```text
┌─────────────────────────┐
│      MOBILE HEADER      │
├─────────────────────────┤
│    CATEGORY CHIPS       │
├─────────────────────────┤
│   HONOR BOARD (card)    │  ← Hiển thị compact, tap để mở detail
├─────────────────────────┤
│                         │
│    VIDEO GRID (1 cột)   │
│                         │
│    ┌─────────────────┐  │
│    │   Video Card    │  │
│    └─────────────────┘  │
│    ┌─────────────────┐  │
│    │   Video Card    │  │
│    └─────────────────┘  │
│                         │
├─────────────────────────┤
│    BOTTOM NAV BAR       │
└─────────────────────────┘
```

---

## 2. Cột Trái: Sidebar Thu Gọn/Mở Rộng

### Tính Năng Mới

| Tính năng | Mô tả |
|-----------|-------|
| **FUN ECOSYSTEM cố định** | Section này LUÔN hiển thị dù sidebar thu gọn hay mở rộng |
| **Toggle collapse** | Nhấn menu icon gần logo header để ẩn/hiện các sections còn lại |
| **Mini mode** | Khi thu gọn: chỉ hiển thị icons (64px width) |
| **Full mode** | Khi mở rộng: hiển thị icons + text (240px width) |

### State Management

```typescript
// Trong Index.tsx hoặc Context
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

// Toggle khi click menu button
const handleMenuClick = () => {
  setIsSidebarCollapsed(!isSidebarCollapsed);
};
```

### Sidebar Modes

**Thu gọn (Mini mode - 64px):**
- Chỉ icons, không text
- FUN ECOSYSTEM vẫn hiển thị đầy đủ
- Tooltip khi hover icon

**Mở rộng (Full mode - 240px):**
- Icons + labels
- Tất cả sections hiển thị

---

## 3. Cột Phải: Honor Board Sidebar

### Component Mới: `HonoboardRightSidebar.tsx`

Đây là phiên bản đầy đủ của Honor Board hiển thị bên phải màn hình.

### Nội Dung Hiển Thị

```text
┌─────────────────────────────┐
│  👑 HONOR BOARD 👑          │
│  ─────────────────          │
│  📊 THỐNG KÊ NỀN TẢNG       │
│  ├─ 👥 Users: 150           │
│  ├─ 🎬 Videos: 85           │
│  ├─ 👁 Views: 10,234        │
│  ├─ 💬 Comments: 892        │
│  ├─ 💰 CAMLY Pool: 50M      │
│  └─ 📡 Subscriptions: 1.2K  │
│  ─────────────────          │
│  🏆 TOP 10 CREATORS         │
│  ┌─────────────────────┐    │
│  │ 1. 🥇 UserName      │    │
│  │    📹 25 videos     │    │
│  │    👁 12.5K views   │    │
│  ├─────────────────────┤    │
│  │ 2. 🥈 UserName2     │    │
│  │    📹 18 videos     │    │
│  │    👁 8.2K views    │    │
│  ├─────────────────────┤    │
│  │ 3. 🥉 UserName3     │    │
│  │    ...              │    │
│  └─────────────────────┘    │
│  ─────────────────          │
│  ⚡ Realtime Updates ●      │
└─────────────────────────────┘
```

### Props Interface

```typescript
interface HonoboardRightSidebarProps {
  className?: string;
}
```

---

## 4. Cột Giữa: Video Grid 2 Cột

### Thay Đổi Grid

**Hiện tại:**
```typescript
// 1 → 2 → 3 → 4 cột responsive
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

**Mới:**
```typescript
// Fixed 2 cột trên desktop (khi có right sidebar)
grid grid-cols-1 sm:grid-cols-2

// Khi không có right sidebar (màn hình nhỏ hơn)
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

### Responsive Breakpoints

| Kích thước | Layout |
|------------|--------|
| < 640px (mobile) | 1 cột video, sidebar drawer, no right panel |
| 640-1023px (tablet) | 2 cột video, sidebar drawer, no right panel |
| ≥1024px (desktop) | Left sidebar + 2 cột video + Right Honor Board |

---

## 5. Mobile Responsive

### Thay Đổi Chính

1. **Honor Board Mobile Card**: Compact card nằm dưới category chips, tap để mở Sheet detail
2. **Video Grid**: 1 cột trên mobile
3. **Sidebar**: Sử dụng MobileDrawer như hiện tại

### Honor Board Mobile Card

```typescript
// Compact card hiển thị 3 stats chính
<div className="mx-4 mb-4">
  <MobileHonoboardCard onClick={() => setShowHonobarDetail(true)} />
</div>
```

---

## 6. Files Cần Thay Đổi/Tạo Mới

| File | Thao Tác | Mô Tả |
|------|----------|-------|
| `src/components/Layout/HonoboardRightSidebar.tsx` | **TẠO MỚI** | Component Honor Board cột phải |
| `src/components/Layout/MobileHonoboardCard.tsx` | **TẠO MỚI** | Honor Board card cho mobile |
| `src/components/Layout/CollapsibleSidebar.tsx` | **TẠO MỚI** | Sidebar mới với tính năng thu gọn |
| `src/pages/Index.tsx` | **SỬA** | Tích hợp layout 3 cột mới |
| `src/components/Layout/Sidebar.tsx` | **SỬA** | Thêm collapsed state, FUN ECOSYSTEM fixed |
| `src/hooks/useHonobarStats.tsx` | **SỬA** | Thêm topCreators array (Top 10) |

---

## 7. Chi Tiết Kỹ Thuật

### A) HonoboardRightSidebar Component

```typescript
// Tính năng:
// - Fixed position bên phải
// - Scroll riêng biệt (ScrollArea)
// - Real-time updates với useHonobarStats
// - Top 10 Creators với avatar, video count, views
// - Animations với framer-motion
```

### B) Collapsible Sidebar Logic

```typescript
// FUN ECOSYSTEM section
<div className="sticky top-0 z-10 bg-background">
  <FunEcosystemSection /> {/* Luôn hiển thị */}
</div>

{!isCollapsed && (
  <div className="animate-in slide-in-from-left">
    {/* Các sections còn lại */}
    <MainNavSection />
    <LibrarySection />
    <RewardSection />
    <ManageSection />
  </div>
)}
```

### C) useHonobarStats Enhancement

```typescript
// Thêm vào interface
interface HonobarStats {
  // ...existing fields
  topCreators: Array<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    videoCount: number;
    totalViews: number;
  }>;
}
```

---

## 8. Visual Design

### Honor Board Right Sidebar

- **Border**: 2px gradient border (cyan → gold)
- **Background**: Glassmorphism white/95 with blur
- **Shadow**: Soft glow effect matching brand colors
- **Animations**:
  - Entry: Slide in from right
  - Stats: Counter animation
  - Shimmer: Subtle background shimmer
  - Realtime indicator: Pulsing green dot

### Top Creators List

- **Rank badges**: 🥇🥈🥉 for top 3, numbers for rest
- **Avatar**: 32x32px rounded with ring
- **Stats**: Video count + Total views
- **Hover**: Scale + glow effect

---

## 9. Kết Quả Mong Đợi

1. **Desktop**: Layout 3 cột cân đối, Honor Board luôn hiển thị bên phải
2. **Tablet**: 2 cột video, sidebar thu gọn, Honor Board ẩn (có thể tap để mở modal)
3. **Mobile**: 1 cột video, Honor Board card compact, tap mở detail sheet
4. **Sidebar Toggle**: FUN ECOSYSTEM luôn cố định, các mục khác ẩn/hiện mượt mà
5. **Real-time**: Tất cả stats tự động cập nhật khi có thay đổi
6. **YouTube-like**: Trải nghiệm giống YouTube 2025

---

## 10. Thứ Tự Triển Khai

1. **Cập nhật useHonobarStats** - Thêm topCreators array
2. **Tạo HonoboardRightSidebar** - Component cột phải mới
3. **Tạo MobileHonoboardCard** - Card compact cho mobile
4. **Sửa Sidebar** - Thêm collapsed logic, FUN ECOSYSTEM fixed
5. **Sửa Index.tsx** - Tích hợp layout 3 cột
6. **Test responsive** - Kiểm tra tất cả breakpoints
