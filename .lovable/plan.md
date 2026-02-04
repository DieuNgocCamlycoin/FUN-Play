
# Kế Hoạch Thiết Kế Honor Board Mới cho FUN PLAY

## 1. Phân Tích Hiện Trạng

### Hệ Thống Admin & CAMLY Claim Tự Động

| Thành Phần | Trạng Thái | Chi Tiết |
|------------|------------|----------|
| Unified Admin Dashboard | ✅ Hoàn chỉnh | `/admin` với 6 sections |
| claim-camly Edge Function | ✅ Hoạt động | MIN 200K, DAILY LIMIT 500K |
| useHonobarStats Hook | ✅ Realtime | Subscribe 5 bảng: profiles, videos, comments, wallet_transactions, subscriptions |
| Honobar Desktop | ✅ Có sẵn | 6 thống kê, gradient Turquoise/Gold |
| CompactHonobar Mobile | ✅ Có sẵn | Compact version, top-right |

### Vấn Đề Hiện Tại

1. **Honobar không được hiển thị trên trang chủ (Index.tsx)** - Cần tích hợp
2. **Thiếu các trường phù hợp FUN PLAY** - Cần thêm: Total CAMLY Pool, Online Users, Creators
3. **Màu sắc chưa đồng bộ với logo** - Logo FUN Play có: Cyan (#00E7FF), Gold (#FFD700), Purple (#7A2BFF)

---

## 2. Thiết Kế Honor Board Mới

### 2.1. Các Trường Thống Kê (Phù Hợp FUN PLAY)

| Icon | Tên Trường | Nguồn Data | Mô Tả |
|------|------------|------------|-------|
| 👥 Users | Người dùng | `profiles` count | Tổng số tài khoản |
| 🎬 Video | Video | `videos` count (approved) | Video đã duyệt |
| 👁 Eye | Lượt xem | Sum `videos.view_count` | Tổng views |
| 💬 MessageSquare | Bình luận | `comments` count | Tổng comments |
| 🪙 Coins | CAMLY Pool | Sum `profiles.approved_reward` | Tổng CAMLY chờ rút |
| 🎖 Trophy | Top Creator | Query top video uploader | Creator có nhiều video nhất |

### 2.2. Bảng Màu Theo Logo FUN PLAY

```text
┌─────────────────────────────────────────────────┐
│  FUN PLAY BRAND COLORS                          │
├─────────────────────────────────────────────────┤
│  Primary Cyan:    #00E7FF (rgb(0, 231, 255))    │
│  Gold Accent:     #FFD700 (rgb(255, 215, 0))    │
│  Purple Vibrant:  #7A2BFF (rgb(122, 43, 255))   │
│  Magenta:         #FF00E5 (rgb(255, 0, 229))    │
│  White Base:      #FFFFFF (background)          │
└─────────────────────────────────────────────────┘
```

### 2.3. Layout Honor Board

**Desktop (>1024px):**
```text
┌────────────────────────────────────────────────────────────────────────────┐
│  Header                                                    [HONOR BOARD]   │
│                                                            ┌──────────────┐│
│  Sidebar                 Main Content Area                 │ 👥 Users     ││
│                                                            │ 1,234        ││
│                                                            ├──────────────┤│
│                                                            │ 🎬 Video     ││
│                                                            │ 567          ││
│                                                            ├──────────────┤│
│                         Videos Grid                        │ 👁 Views     ││
│                                                            │ 12.5K        ││
│                                                            ├──────────────┤│
│                                                            │ 💬 Comments  ││
│                                                            │ 890          ││
│                                                            ├──────────────┤│
│                                                            │ 🪙 CAMLY Pool││
│                                                            │ 5.2M         ││
│                                                            ├──────────────┤│
│                                                            │ 🎖 Top       ││
│                                                            │ @creator     ││
│                                                            └──────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

**Mobile (<1024px):**
```text
┌─────────────────────────────────────┐
│  Mobile Header        [Compact HB]  │
│                       ┌───────────┐ │
│                       │👥 │🎬 │👁 │ │
│                       │12K│567│45K│ │
│                       ├───┼───┼───┤ │
│                       │💬 │🪙 │🎖 │ │
│                       │890│5M │Top│ │
│                       └───────────┘ │
│                                     │
│     Video Cards (Full Width)        │
│                                     │
│  [Bottom Navigation]                │
└─────────────────────────────────────┘
```

---

## 3. Chi Tiết Triển Khai

### 3.1. Cập Nhật useHonobarStats Hook

**Thêm các trường mới:**

```typescript
export interface HonobarStats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalComments: number;
  totalRewards: number;         // Total CAMLY ever earned
  totalSubscriptions: number;
  camlyPool: number;            // THÊM MỚI: Sum approved_reward (chờ rút)
  topCreator: {                 // THÊM MỚI: Creator có nhiều video nhất
    displayName: string;
    videoCount: number;
  } | null;
}
```

### 3.2. Tạo Component EnhancedHonobar

**File mới:** `src/components/Layout/EnhancedHonobar.tsx`

**Tính năng:**
- 6 stat cards với animation shimmer
- Màu gradient Cyan → Gold theo logo
- Glow effect khi hover
- Crown icon cho header
- Realtime updates

### 3.3. Tạo Component MobileHonobar

**File mới:** `src/components/Layout/MobileHonobar.tsx`

**Tính năng:**
- Compact 3x2 grid
- Touch-friendly (min 44px touch targets)
- Không có hover effects (mobile)
- Đóng mở bằng tap (collapsible)

### 3.4. Tích Hợp vào Index.tsx

**Vị trí:** Góc trên bên phải (`absolute top-4 right-4`)

```typescript
// Desktop: EnhancedHonobar với đầy đủ animation
// Mobile: MobileHonobar compact, có thể thu gọn

{!isMobile && <EnhancedHonobar />}
{isMobile && <MobileHonobar />}
```

---

## 4. Thiết Kế Chi Tiết UI

### 4.1. Desktop EnhancedHonobar

**CSS/Tailwind Classes:**

```css
/* Container */
.honobar-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  width: auto;
  max-width: 280px;
}

/* Outer Glow */
.honobar-glow {
  background: linear-gradient(135deg, 
    rgba(0, 231, 255, 0.3), 
    rgba(255, 215, 0, 0.3)
  );
  filter: blur(20px);
  position: absolute;
  inset: 0;
  border-radius: 1rem;
}

/* Main Card */
.honobar-card {
  background: linear-gradient(135deg,
    rgba(0, 231, 255, 0.05),
    rgba(255, 255, 255, 0.95),
    rgba(255, 215, 0, 0.05)
  );
  backdrop-filter: blur(20px);
  border: 2px solid rgba(0, 231, 255, 0.5);
  border-radius: 1rem;
  box-shadow: 
    0 0 30px rgba(0, 231, 255, 0.3),
    0 0 50px rgba(255, 215, 0, 0.2);
}

/* Header */
.honobar-header {
  background: linear-gradient(90deg, #00E7FF, #7A2BFF, #FFD700);
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 800;
}

/* Stat Item */
.stat-item {
  background: linear-gradient(135deg,
    rgba(0, 231, 255, 0.1),
    rgba(255, 215, 0, 0.1)
  );
  border: 1px solid rgba(0, 231, 255, 0.3);
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

/* Shimmer Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
```

### 4.2. Mobile MobileHonobar

**Đặc điểm:**
- Width: 180px (compact)
- Grid: 3 columns × 2 rows
- Font size: 10px label, 12px value
- Touch target: min 44px
- Collapsible với icon chevron

---

## 5. Danh Sách File Cần Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/hooks/useHonobarStats.tsx` | SỬA | Thêm camlyPool, topCreator |
| `src/components/Layout/EnhancedHonobar.tsx` | TẠO MỚI | Desktop Honor Board với brand colors |
| `src/components/Layout/MobileHonobar.tsx` | TẠO MỚI | Mobile compact version |
| `src/pages/Index.tsx` | SỬA | Import và render Honobar |
| `src/components/Layout/Honobar.tsx` | GIỮ NGUYÊN | Backup reference |
| `src/components/Layout/CompactHonobar.tsx` | GIỮ NGUYÊN | Backup reference |

---

## 6. Animation & Effects

### 6.1. Entry Animation
```typescript
initial={{ scale: 0.8, opacity: 0, y: -20 }}
animate={{ scale: 1, opacity: 1, y: 0 }}
transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
```

### 6.2. Shimmer Effect (mỗi stat card)
```typescript
<motion.div
  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
  animate={{ x: ["-100%", "200%"] }}
  transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
/>
```

### 6.3. Icon Pulse
```typescript
<motion.div
  animate={{ scale: [1, 1.15, 1] }}
  transition={{ duration: 2, repeat: Infinity, delay: index * 0.15 }}
>
  <Icon className="w-4 h-4 text-[#00E7FF]" />
</motion.div>
```

### 6.4. Number Glow
```typescript
<motion.span
  animate={{
    textShadow: [
      "0 0 4px rgba(0,231,255,0.3)",
      "0 0 8px rgba(255,215,0,0.5)",
      "0 0 4px rgba(0,231,255,0.3)"
    ]
  }}
  transition={{ duration: 2, repeat: Infinity }}
>
  {value}
</motion.span>
```

---

## 7. Test Cases

| Test | Mô Tả | Expected Result |
|------|-------|-----------------|
| Desktop Render | Mở trang chủ trên Desktop | Honor Board hiển thị góc trên phải với 6 stats |
| Mobile Render | Mở trang chủ trên Mobile | Compact Honor Board 3x2 grid |
| Realtime Update | User khác upload video | Số video tự động +1 |
| CAMLY Pool | Admin approve reward | camlyPool tăng theo approved_reward |
| Top Creator | User upload nhiều video nhất | Hiển thị đúng username |
| Animation | Hover vào stat card | Glow effect xuất hiện |
| Loading State | Page đang load | Skeleton loading animation |

---

## 8. Ghi Chú Kỹ Thuật

1. **Performance:** Chỉ fetch stats mới khi có realtime event, không polling
2. **Z-index:** Honor Board z-20, thấp hơn Modal (z-50) nhưng cao hơn content
3. **Responsive:** Sử dụng `useIsMobile()` hook để switch component
4. **Accessibility:** Thêm aria-label cho screen readers
5. **Dark Mode:** Sử dụng CSS variables để hỗ trợ cả light/dark theme
