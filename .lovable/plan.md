

# Kế Hoạch Thiết Kế Lại Honor Board Theo Hình Mẫu

## Phân Tích Hình Mẫu

Từ hình ảnh tham khảo, Honor Board có thiết kế:

```text
┌─────────────────────────────────┐
│     HONOR BOARD (italic)        │  ← Tiêu đề gradient xanh lá/vàng
├─────────────────────────────────┤
│ 👥 TOTAL USERS           77     │  ← Pill xanh lá, text trắng, value vàng
├─────────────────────────────────┤
│ 📝 TOTAL POSTS        1.101     │  ← Mỗi stat một dòng riêng
├─────────────────────────────────┤
│ 📷 TOTAL PHOTOS         947     │
├─────────────────────────────────┤
│ 🎬 TOTAL VIDEOS          40     │
├─────────────────────────────────┤
│ 💰 TOTAL REWARD    39.500.000   │  ← Pill với coin icon
└─────────────────────────────────┘
```

### Đặc Điểm Thiết Kế Chính

| Yếu Tố | Chi Tiết |
|--------|----------|
| **Title** | Chữ italic, gradient xanh lá sang vàng |
| **Layout** | Vertical stacked - mỗi stat một hàng riêng (không 2 cột) |
| **Shape** | Pill/capsule với bo góc lớn (full rounded) |
| **Background** | Gradient xanh lá đậm (#1B5E20 → #4CAF50) |
| **Icon + Label** | Bên trái, text trắng |
| **Value** | Bên phải, text vàng/gold (#FFD700) |
| **Spacing** | Gap nhỏ giữa các pill |

---

## Mapping Stats Cho FUN Play

| Hình Mẫu | FUN Play Tương Ứng |
|----------|-------------------|
| TOTAL USERS | Total Users (giữ nguyên) |
| TOTAL POSTS | Total Comments (số bình luận) |
| TOTAL PHOTOS | Total Views (lượt xem) |
| TOTAL VIDEOS | Total Videos (giữ nguyên) |
| TOTAL REWARD | CAMLY Pool (reward pool) |

---

## Thay Đổi Cần Thực Hiện

### 1. File: `src/components/Layout/HonoboardRightSidebar.tsx`

**Thay đổi layout:**
- Từ: Grid 2 cột horizontal
- Thành: Stack vertical 1 cột (mỗi stat một pill)

**Thay đổi style:**
- Background: `bg-gradient-to-r from-[#1B5E20] to-[#4CAF50]` (xanh lá)
- Shape: `rounded-full` (pill shape)
- Label text: `text-white`
- Value text: `text-[#FFD700]` (vàng gold)
- Title: Italic với gradient xanh lá/vàng

**Code mới cho StatPill:**
```tsx
const StatPill = ({ icon: Icon, label, value, loading }) => (
  <motion.div
    className="flex items-center justify-between px-4 py-3 rounded-full
      bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]
      shadow-md hover:shadow-lg transition-all duration-200"
  >
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-white" />
      <span className="text-sm font-medium text-white uppercase tracking-wide">
        {label}
      </span>
    </div>
    <span className="text-lg font-bold text-[#FFD700]">
      {loading ? "..." : formatNumber(value)}
    </span>
  </motion.div>
);
```

**Stats mới (vertical stack):**
```tsx
const stats = [
  { icon: Users, label: "TOTAL USERS", value: stats.totalUsers },
  { icon: MessageCircle, label: "TOTAL COMMENTS", value: stats.totalComments },
  { icon: Eye, label: "TOTAL VIEWS", value: stats.totalViews },
  { icon: Video, label: "TOTAL VIDEOS", value: stats.totalVideos },
  { icon: Coins, label: "CAMLY POOL", value: stats.camlyPool },
];
```

---

### 2. File: `src/components/Layout/MobileHonoboardCard.tsx`

**Thay đổi:**
- Redesign theo style pill xanh lá
- Compact 2-3 stats preview trên một dòng
- Tap để mở full detail modal

**Layout mobile card:**
```text
┌─────────────────────────────────────────┐
│ 👑 HONOR BOARD                    [→]   │
├─────────────────────────────────────────┤
│ [👥 77] [🎬 85] [💰 50M]                │  ← Mini pills
└─────────────────────────────────────────┘
```

---

### 3. File: `src/components/Layout/HonobarDetailModal.tsx`

**Thay đổi:**
- Full vertical pill layout như desktop
- Giữ Top 10 Creators section
- Áp dụng color scheme xanh lá/vàng

---

## Visual Design Chi Tiết

### Color Palette (Forest Green Theme)

| Element | Color | HEX |
|---------|-------|-----|
| Pill Dark Green | `from-[#1B5E20]` | #1B5E20 |
| Pill Mid Green | `via-[#2E7D32]` | #2E7D32 |
| Pill Light Green | `to-[#4CAF50]` | #4CAF50 |
| Value Gold | `text-[#FFD700]` | #FFD700 |
| Label White | `text-white` | #FFFFFF |
| Title Gradient | `from-[#2E7D32] to-[#FFD700]` | Green → Gold |

### Title Design

```css
.honor-board-title {
  font-style: italic;
  font-weight: 900;
  background: linear-gradient(to right, #2E7D32, #FFD700);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}
```

### Pill Item Design

```css
.stat-pill {
  background: linear-gradient(to right, #1B5E20, #2E7D32, #4CAF50);
  border-radius: 9999px; /* full rounded */
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-pill:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
```

---

## Files Cần Thay Đổi

| File | Thay Đổi |
|------|----------|
| `src/components/Layout/HonoboardRightSidebar.tsx` | Redesign hoàn toàn theo pill layout |
| `src/components/Layout/MobileHonoboardCard.tsx` | Cập nhật style xanh lá/vàng |
| `src/components/Layout/HonobarDetailModal.tsx` | Full pill layout trong modal |

---

## Kết Quả Mong Đợi

1. **Desktop Right Sidebar:**
   - Title "HONOR BOARD" italic với gradient xanh/vàng
   - 5 stat pills xếp dọc với gradient xanh lá
   - Icon + label trắng bên trái, value vàng bên phải
   - Top 10 Creators giữ nguyên bên dưới

2. **Mobile Card:**
   - Header với style tương tự
   - Mini pills preview
   - Tap để mở full detail

3. **Mobile/Desktop Modal:**
   - Full vertical pill layout
   - Cùng color scheme xanh lá/vàng
   - Real-time updates indicator

