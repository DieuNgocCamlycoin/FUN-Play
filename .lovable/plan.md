
# Kế Hoạch Cải Tiến Honor Board - Layout Cố Định & Horizontal Stats

## Tổng Quan Yêu Cầu

1. **Cột phải (Honor Board) cố định** - Chỉ phần giữa (video grid) cuộn
2. **Stats xếp hàng ngang** - Thống kê hiển thị theo hàng ngang, xếp chồng
3. **Màu sắc & thiết kế phù hợp** - Theo design system "Heavenly Aurora Bliss"
4. **Cập nhật cho mobile** - Responsive phù hợp

---

## 1. Layout Mới

### Desktop (Cấu Trúc Scroll)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    HEADER (fixed - top: 0)                           │
├─────────────┬─────────────────────────────────┬──────────────────────┤
│             │                                 │                      │
│  SIDEBAR    │     MIDDLE CONTENT              │   HONOR BOARD        │
│  (fixed)    │     (SCROLLABLE)                │   (fixed)            │
│             │                                 │                      │
│             │  ┌─────────────────────────┐    │  ┌────────────────┐  │
│             │  │ Category Chips          │    │  │ 👑 HONOR BOARD │  │
│             │  ├─────────────────────────┤    │  ├────────────────┤  │
│             │  │                         │    │  │ Users   Videos │  │
│             │  │  VIDEO GRID             │    │  │ Views Comments │  │
│             │  │  (scrolls here)         │    │  │ Pool   Subs    │  │
│             │  │                         │    │  ├────────────────┤  │
│             │  │  ┌───────┐ ┌───────┐    │    │  │ TOP CREATORS   │  │
│             │  │  │Video 1│ │Video 2│    │    │  │ 1. Creator A   │  │
│             │  │  └───────┘ └───────┘    │    │  │ 2. Creator B   │  │
│             │  │  ┌───────┐ ┌───────┐    │    │  │ 3. Creator C   │  │
│             │  │  │Video 3│ │Video 4│    │    │  │ ...            │  │
│             │  │  └───────┘ └───────┘    │    │  └────────────────┘  │
│             │  └─────────────────────────┘    │                      │
└─────────────┴─────────────────────────────────┴──────────────────────┘
```

### Stats Layout Mới (Horizontal Stacked)

```text
┌─────────────────────────────────┐
│       👑 HONOR BOARD 👑         │
│          ⚡ Realtime            │
├─────────────────────────────────┤
│ 👥 Users     │ 🎬 Videos        │  ← Row 1
├─────────────────────────────────┤
│ 👁 Views     │ 💬 Comments      │  ← Row 2
├─────────────────────────────────┤
│ 💰 Pool      │ 📡 Subs          │  ← Row 3
├─────────────────────────────────┤
│      🏆 TOP 10 CREATORS         │
│  ┌─────────────────────────┐    │
│  │ 🥇 Creator Name  12.5K  │    │
│  │ 🥈 Creator Name  8.2K   │    │
│  │ 🥉 Creator Name  5.1K   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

## 2. Thay Đổi Files

### File 1: `src/components/Layout/HonoboardRightSidebar.tsx`

**Thay đổi chính:**

| Thuộc Tính | Hiện Tại | Mới |
|------------|----------|-----|
| Position | `sticky top-14` | `fixed right-0 top-14` |
| Scroll | `ScrollArea` bên trong | Không cần scroll (nội dung gọn) |
| Stats Grid | `grid-cols-2` (6 items) | `grid-rows-3` với 2 items mỗi hàng |
| Colors | Gradient pastel | Aurora colors (#00E7FF, #FFD700, #7A2BFF) |
| Border | Simple border | Gradient border với glow effect |

**Stats Layout mới:**
```tsx
// Row-based layout thay vì grid-cols-2
<div className="space-y-2">
  {/* Row 1: Users + Videos */}
  <div className="flex gap-2">
    <StatItem icon={Users} label="Users" value={...} />
    <StatItem icon={Video} label="Videos" value={...} />
  </div>
  {/* Row 2: Views + Comments */}
  <div className="flex gap-2">
    <StatItem icon={Eye} label="Views" value={...} />
    <StatItem icon={MessageCircle} label="Comments" value={...} />
  </div>
  {/* Row 3: Pool + Subscriptions */}
  <div className="flex gap-2">
    <StatItem icon={Coins} label="CAMLY Pool" value={...} />
    <StatItem icon={Bell} label="Subs" value={...} />
  </div>
</div>
```

**Màu sắc mới:**
- Header: Gradient `from-[#00E7FF] via-[#7A2BFF] to-[#FFD700]`
- Stats: Background `bg-gradient-to-br from-[#00E7FF]/10 to-[#FFD700]/10`
- Border: `border-[#00E7FF]/40` với hover `border-[#FFD700]/60`
- Text values: `text-sky-700` (matching project text color)
- Glow: `shadow-[0_0_20px_rgba(0,231,255,0.3)]`

---

### File 2: `src/pages/Index.tsx`

**Thay đổi chính:**

| Thuộc Tính | Hiện Tại | Mới |
|------------|----------|-----|
| Right sidebar | Inside flex container | Fixed position với margin-right cho main |
| Main content | No right padding | `pr-72 xl:pr-80` khi có Honor Board |
| Scroll behavior | Entire page scrolls | Chỉ middle section scroll |

**Layout structure mới:**
```tsx
<main className={`pt-14 pb-20 lg:pb-0 transition-all duration-300 
  ${isSidebarExpanded ? 'lg:pl-60' : 'lg:pl-16'}
  xl:pr-72`}>  {/* Thêm padding-right cho Honor Board cố định */}
  
  {/* Middle content - scrollable */}
  <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
    <CategoryChips />
    <MobileHonoboardCard /> {/* Mobile only */}
    <VideoGrid />
  </div>
</main>

{/* Honor Board - fixed position */}
<HonoboardRightSidebar className="fixed right-0 top-14" />
```

---

### File 3: `src/components/Layout/MobileHonoboardCard.tsx`

**Thay đổi chính:**

| Thuộc Tính | Hiện Tại | Mới |
|------------|----------|-----|
| Stats preview | Inline (Users, Videos, Pool) | Row layout tương tự desktop |
| Colors | Yellow-based | Aurora gradient (#00E7FF → #FFD700) |
| Layout | Single row | Compact 2-row layout |

**Mobile card layout mới:**
```text
┌─────────────────────────────────────────┐
│ 👑 Honor Board                    [→]   │
├─────────────────────────────────────────┤
│ 👥 150   🎬 85   👁 10K   💰 50M        │ ← Compact stats row
├─────────────────────────────────────────┤
│ 🏆 Top: Creator Name          ⚡Live    │
└─────────────────────────────────────────┘
```

**Màu sắc mới:**
- Background: `bg-gradient-to-r from-white via-[#00E7FF]/5 to-[#FFD700]/10`
- Border: `border-[#00E7FF]/40`
- Glow: `shadow-[0_0_15px_rgba(0,231,255,0.2)]`
- Text: Stats dùng `text-sky-700`, labels dùng `text-muted-foreground`

---

### File 4: `src/components/Layout/HonobarDetailModal.tsx`

**Thay đổi chính:**

| Thuộc Tính | Hiện Tại | Mới |
|------------|----------|-----|
| Stats layout | 3x2 grid | Row-based (2 items/row) |
| Colors | Mix of colors | Unified Aurora gradient |
| Top Creators | Not shown | Full Top 10 list with avatars |

**Stats section mới:**
```tsx
<div className="space-y-3">
  {/* Row-based stats như desktop */}
  {statRows.map((row, i) => (
    <div key={i} className="flex gap-3">
      {row.map(stat => <StatCard {...stat} />)}
    </div>
  ))}
</div>
```

---

## 3. Visual Design Chi Tiết

### Color Palette (Aurora Theme)

| Element | Color | HEX |
|---------|-------|-----|
| Primary Cyan | `#00E7FF` | Cosmic Cyan |
| Primary Gold | `#FFD700` | Cosmic Gold |
| Accent Purple | `#7A2BFF` | Cosmic Purple |
| Text Primary | `text-sky-700` | #0369A1 |
| Text Muted | `text-muted-foreground` | System |
| Background | White với gradient overlay | #FFFFFF |

### Stat Item Component

```text
┌───────────────────────┐
│  [Icon]  Label        │
│          ━━━━━        │ ← Value với gradient text
│          12.5K        │
└───────────────────────┘
```

CSS:
```css
.stat-item {
  background: linear-gradient(135deg, rgba(0,231,255,0.08), rgba(255,215,0,0.08));
  border: 1px solid rgba(0,231,255,0.3);
  border-radius: 12px;
  padding: 12px;
  flex: 1;
  transition: all 0.2s;
}

.stat-item:hover {
  border-color: rgba(255,215,0,0.6);
  box-shadow: 0 0 20px rgba(0,231,255,0.3);
}

.stat-value {
  background: linear-gradient(to right, #00E7FF, #FFD700);
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 700;
}
```

### Top Creators List

```text
┌─────────────────────────────────┐
│ 🥇 [Avatar] Creator Name        │
│            📹 25  👁 12.5K      │
├─────────────────────────────────┤
│ 🥈 [Avatar] Creator Name        │
│            📹 18  👁 8.2K       │
└─────────────────────────────────┘
```

- Rank 1: Border `border-[#FFD700]` với glow
- Rank 2: Border `border-gray-400`
- Rank 3: Border `border-orange-400`
- Rank 4+: Border `border-border`

---

## 4. Thứ Tự Triển Khai

1. **Cập nhật `HonoboardRightSidebar.tsx`**
   - Đổi sang fixed position
   - Redesign stats layout theo hàng ngang
   - Cập nhật màu sắc Aurora theme
   - Giữ Top 10 Creators với thiết kế mới

2. **Cập nhật `Index.tsx`**
   - Thêm padding-right cho main content
   - Đảm bảo middle section có overflow-y-auto
   - Honor Board ở ngoài flex container

3. **Cập nhật `MobileHonoboardCard.tsx`**
   - Redesign theo Aurora theme
   - Compact stats row
   - Matching style với desktop

4. **Cập nhật `HonobarDetailModal.tsx`**
   - Row-based stats layout
   - Thêm Top 10 Creators list đầy đủ
   - Aurora gradient styling

---

## 5. Kết Quả Mong Đợi

| Tính năng | Mô tả |
|-----------|-------|
| Fixed Right Column | Honor Board cố định, không cuộn khi scroll video |
| Middle Section Scrollable | Chỉ video grid và category chips cuộn |
| Horizontal Stats | Stats xếp theo hàng ngang (2 items/row × 3 rows) |
| Aurora Theme | Màu sắc Cyan (#00E7FF) + Gold (#FFD700) xuyên suốt |
| Mobile Responsive | Card compact với cùng color scheme |
| Smooth Transitions | Hover effects, glow animations |
| Realtime Updates | Stats tự động cập nhật |
