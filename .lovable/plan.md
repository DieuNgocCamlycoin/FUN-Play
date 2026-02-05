

# Kế Hoạch Chỉnh Sửa Honor Board & Video Grid Layout

## Tổng Quan Yêu Cầu

1. **Kiểm tra lỗi**: Có 1 warning React.forwardRef từ DropdownMenu (không nghiêm trọng)
2. **Cải thiện Right Sidebar**: Điều chỉnh kích thước và nội dung cho hoàn chỉnh
3. **Xóa "Top Creator"**: Loại bỏ section Top 10 Creators khỏi sidebar
4. **Thêm "Top Sponsor"**: Bảng xếp hạng nhà tài trợ dựa trên wallet_transactions
5. **Thêm "Donate to Project"**: Nút quyên góp cho dự án
6. **Video Grid 3 cột**: Chia vùng giữa thành 3 cột video cân bằng

---

## 1. Kiểm Tra Lỗi Hiện Tại

| Loại | Mô tả | Mức độ |
|------|-------|--------|
| Warning | React.forwardRef trong DropdownMenu | Không nghiêm trọng |
| Function | useTopRanking, useHonobarStats | Hoạt động tốt |
| Layout | Right sidebar w-72 (288px) | Có thể cải thiện |

**Kết luận**: Không có lỗi nghiêm trọng, tiến hành cải thiện UI.

---

## 2. Chỉnh Sửa Right Sidebar

### Thay đổi layout:

```text
TRƯỚC:                          SAU:
┌─────────────────────┐        ┌─────────────────────┐
│ 👑 HONOR BOARD      │        │ 👑 HONOR BOARD      │
├─────────────────────┤        ├─────────────────────┤
│ [Stat Pills x 5]    │        │ [Stat Pills x 5]    │
├─────────────────────┤        ├─────────────────────┤
│ 🏆 Top 10 Creators  │ ← XÓA  │ 🏅 Top 5 Ranking    │
├─────────────────────┤        ├─────────────────────┤
│ 🏅 Top 5 Ranking    │        │ 💎 TOP SPONSOR      │ ← MỚI
├─────────────────────┤        │ [Top 5 Donors]      │
│ FUN Play Branding   │        ├─────────────────────┤
└─────────────────────┘        │ [Donate to Project] │ ← MỚI
                               ├─────────────────────┤
                               │ FUN Play Branding   │
                               └─────────────────────┘
```

### Kích thước sidebar mới:
- Giữ `w-72` (288px) - phù hợp với design 3 cột
- Tăng padding cho content

---

## 3. Tạo Top Sponsor Section

### Hook mới: `useTopSponsors.ts`

Query từ `wallet_transactions` table để lấy top donors:

```tsx
interface TopSponsor {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_donated: number;
  token_type: string;
}

// Query: SUM(amount) WHERE status = 'completed' GROUP BY from_user_id
```

### Component mới: `TopSponsorSection.tsx`

```text
┌─────────────────────────────────────┐
│ 💎 TOP SPONSORS                     │
│ ┌─────────────────────────────────┐ │
│ │ 🥇 Sponsor A         500 CAMLY  │ │
│ │ 🥈 Sponsor B         350 CAMLY  │ │
│ │ 🥉 Sponsor C         200 CAMLY  │ │
│ │ #4 Sponsor D         150 CAMLY  │ │
│ │ #5 Sponsor E         100 CAMLY  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💖 DONATE TO PROJECT            │ │ ← Button với Aurora gradient
│ │ [Opens Donate Modal/Link]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Styling (Aurora Theme):
- Card background: `from-[#F0FDFF] via-white to-[#FFF8F0]`
- Border: `border-[#00E7FF]/25`
- Rank badges: 🥇🥈🥉 cho top 3
- Values: Gold text `text-[#FFD700]`

---

## 4. Donate to Project Button

### Design:

```tsx
<Button
  className="w-full bg-gradient-to-r from-[#FF00E5] via-[#7A2BFF] to-[#00E7FF]
    text-white font-bold
    shadow-[0_0_20px_rgba(255,0,229,0.3)]
    hover:shadow-[0_0_30px_rgba(122,43,255,0.5)]"
>
  <Heart className="h-4 w-4 mr-2" />
  Donate to Project
</Button>
```

### Chức năng:
- Option 1: Mở TipModal với project wallet address
- Option 2: Navigate đến trang donate riêng
- Option 3: Mở external link (nếu có)

---

## 5. Video Grid 3 Cột

### Thay đổi trong `Index.tsx`:

```tsx
// TRƯỚC: 2 cột trên desktop
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

// SAU: 3 cột trên desktop  
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
```

### Responsive breakpoints:
| Screen | Columns | Gap |
|--------|---------|-----|
| Mobile (<640px) | 1 | 16px |
| Tablet (640-1024px) | 2 | 16px |
| Desktop (≥1024px) | 3 | 20px |

### VideoCard adjustments:
- Giữ `aspect-video` cho thumbnail
- Giảm nhẹ padding nếu cần: `p-3` thay vì `p-4`
- Text size responsive

---

## 6. Mobile Updates

### MobileHonoboardCard:
- Xóa "Top Creator Preview" (vì đã xóa Top Creators)
- Thêm mini indicator cho Top Sponsors nếu có

### MobileSponsorCard (optional):
- Card compact hiển thị Top 3 sponsors
- Nút Donate nhỏ gọn

---

## 7. Files Cần Thay Đổi

| File | Action | Mô tả |
|------|--------|-------|
| `src/hooks/useTopSponsors.ts` | **Tạo mới** | Fetch top donors từ wallet_transactions |
| `src/components/Layout/TopSponsorSection.tsx` | **Tạo mới** | Component Top 5 Sponsors |
| `src/components/Layout/HonoboardRightSidebar.tsx` | **Chỉnh sửa** | Xóa Top Creators, thêm Top Sponsors + Donate |
| `src/components/Layout/MobileHonoboardCard.tsx` | **Chỉnh sửa** | Cập nhật layout, xóa Top Creator preview |
| `src/components/Layout/HonobarDetailModal.tsx` | **Chỉnh sửa** | Xóa Top Creators section, thêm Sponsors |
| `src/pages/Index.tsx` | **Chỉnh sửa** | Video grid 3 cột |

---

## 8. Database Query cho Top Sponsors

```sql
-- Query để lấy top sponsors (total donations)
SELECT 
  wt.from_user_id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  SUM(wt.amount) as total_donated,
  wt.token_type
FROM wallet_transactions wt
JOIN profiles p ON p.id = wt.from_user_id
WHERE wt.status = 'completed'
  OR wt.status = 'success'
GROUP BY wt.from_user_id, p.username, p.display_name, p.avatar_url, wt.token_type
ORDER BY total_donated DESC
LIMIT 5;
```

---

## 9. Visual Design Chi Tiết

### Top Sponsor Card:

```css
.sponsor-section {
  background: linear-gradient(135deg, #F0FDFF, white, #FFF8F0);
  border: 1px solid rgba(0, 231, 255, 0.25);
  border-radius: 12px;
  padding: 12px;
}

.sponsor-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.sponsor-item:hover {
  background: rgba(240, 253, 255, 1);
  transform: translateX(4px);
}

.sponsor-value {
  color: #FFD700;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
}
```

### Donate Button:

```css
.donate-button {
  background: linear-gradient(to right, #FF00E5, #7A2BFF, #00E7FF);
  color: white;
  font-weight: 700;
  border-radius: 9999px;
  padding: 12px 24px;
  box-shadow: 0 0 20px rgba(255, 0, 229, 0.3);
  transition: all 0.3s;
}

.donate-button:hover {
  box-shadow: 0 0 30px rgba(122, 43, 255, 0.5);
  transform: scale(1.02);
}
```

---

## 10. Thứ Tự Triển Khai

1. **Tạo `useTopSponsors.ts`** - Hook fetch donors
2. **Tạo `TopSponsorSection.tsx`** - Component với Aurora styling
3. **Chỉnh sửa `HonoboardRightSidebar.tsx`**:
   - Xóa Top 10 Creators section (lines 147-228)
   - Thêm TopSponsorSection sau TopRankingSection
   - Thêm Donate button
4. **Chỉnh sửa `HonobarDetailModal.tsx`**:
   - Xóa Top 10 Creators section
   - Thêm Top Sponsors section
5. **Chỉnh sửa `MobileHonoboardCard.tsx`**:
   - Xóa Top Creator preview
   - Cập nhật layout
6. **Chỉnh sửa `Index.tsx`**:
   - Video grid từ 2 → 3 cột trên desktop

---

## 11. Kết Quả Mong Đợi

| Tính năng | Mô tả |
|-----------|-------|
| Right Sidebar | Gọn gàng hơn với Stats + Ranking + Sponsors + Donate |
| Top Sponsors | Hiển thị Top 5 donors với CAMLY amounts |
| Donate Button | Aurora gradient, glow effect khi hover |
| Video Grid | 3 cột cân bằng trên desktop |
| Mobile | Compact cards với Aurora theme |
| Aurora Theme | Toàn bộ colors nhất quán với design system |

