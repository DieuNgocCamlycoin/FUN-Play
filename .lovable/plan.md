

## Điều chỉnh giao diện UIPreview – Liquid Glass + Hologram Border

### So sánh hiện tại vs. yêu cầu

| Thành phần | Hiện tại | Yêu cầu từ ảnh |
|---|---|---|
| Background trang | Gradient tím/xanh nhạt | Trắng thuần (#FFFFFF hoặc trắng nhạt) |
| Viền panel | Glass mờ nhẹ / hologram yếu | Hologram 7 màu RỰC RỠ, dày, nổi bật hẳn |
| Nền panel | rgba(255,255,255,0.13) | Liquid Glass: trong suốt hơn, blur mạnh hơn |
| Card nội dung (stat, rank) | Nền trắng/xám nhạt | Holographic card: gradient màu sắc ánh kim |
| Tiêu đề "FUN ECOSYSTEM" | Gradient text nhỏ | Chữ màu sắc + icon logo tròn lớn hơn |
| Platform items | Card nhỏ emoji + text | Giống ảnh: logo tròn lớn + text đậm |
| HONOR BOARD | Stat grid 2 cột | Dòng ngang: icon + label + số (layout giống ảnh) |
| TOP RANKING | Rows nhỏ | Rows với avatar tròn + tên + số CAMLY |

---

### Thay đổi cụ thể

#### 1. `src/pages/UIPreview.tsx` – Đổi background thành trắng
- Background: `#FFFFFF` hoặc `linear-gradient(135deg, #FAFAFA 0%, #F5F5FF 100%)` (trắng nhạt rất tinh tế)
- Xóa lớp radial gradient tím/xanh trang trí phía sau
- Giữ badge "Preview Mode"

#### 2. `src/components/Layout/GlassPanel.tsx` – Nâng cấp Liquid Glass + Hologram
**Variant `"default"` (Left Panel):**
```
background: rgba(255,255,255,0.45)
backdropFilter: blur(20px) saturate(180%)
border: 2px solid transparent (dùng gradient border trick)
viền hologram: linear-gradient từ #FF6B9D → #00E7FF → #7A2BFF → #FFD700 → #00E7FF
```

**Variant `"holo"` (Right Panel):**
- Viền dày hơn (2.5px), màu sắc rực hơn, opacity cao hơn (0.9-1.0)
- Hiệu ứng viền chạy gradient animated (shimmer nhẹ)

Thêm variant mới `"liquid"` để dùng cho Left Panel với viền hologram tương tự nhưng nhẹ hơn Right Panel.

#### 3. `src/components/Layout/FunEcosystemPanel.tsx` – Redesign theo ảnh
**Tiêu đề:**
- "🌿 FUN ECOSYSTEM" → font lớn hơn, màu gradient sắc nét
- Xóa mục "About FUN PLAY" collapsible ra ngoài hoặc giữ ở cuối

**Platform items** (theo ảnh chỉ hiện 3 cái đầu kèm logo tròn lớn):
- Logo tròn 40×40px với ảnh/emoji bên trong
- Tên kênh font đậm, to hơn (14px thay vì 11px)
- Xóa ExternalLink icon — thay bằng border holographic trên mỗi item
- Mỗi item: nền `rgba(255,255,255,0.6)`, bo 16px, hover glow màu sắc

**Mục điều hướng (theo ảnh):**
- Sau platform list: thêm section "Điều hướng" collapsible (chevron UP/DOWN)
- Bên trong: Trang chủ, Shorts, Kênh đăng ký, Thiền cùng Cha, Tạo Nhạc Ánh Sáng

#### 4. `src/components/Layout/HonorRightPanel.tsx` – Redesign theo ảnh

**HONOR BOARD section:**
- Bỏ grid 2 cột
- Layout dọc: mỗi dòng = icon + label (trái) + số nổi bật (phải, màu cyan)
- Thêm TOTAL USERS, TOTAL POSTS, TOTAL PHOTOS, TOTAL REWARD
- Màu số: `#00E7FF` (cyan rực), label: tím `#7A2BFF` uppercase
- Nền mỗi dòng: trắng mờ hoặc không có nền

**TOP RANKING section:**
- Mỗi hàng: emoji huy hiệu rank (🥇🥈🥉#4) + avatar tròn + tên + số CAMLY (cam nhạt)
- Số CAMLY theo format "🌿 8.5M"
- Nền card holographic nhạt

**Viền panel phải (Holo Border):**
- Đậm hơn, cầu vồng rực rỡ như trong ảnh (không nhạt)
- Có thể thêm animation pulse nhẹ

---

### Các file thay đổi

| File | Loại thay đổi |
|---|---|
| `src/pages/UIPreview.tsx` | Đổi background → trắng |
| `src/components/Layout/GlassPanel.tsx` | Nâng cấp Liquid Glass + Holo Border rực hơn |
| `src/components/Layout/FunEcosystemPanel.tsx` | Redesign layout theo ảnh + thêm Điều hướng |
| `src/components/Layout/HonorRightPanel.tsx` | Redesign Honor Board + Top Ranking theo ảnh |

---

### Kết quả mong đợi sau khi sửa

- Nền trang: trắng sạch
- Hai panel: **Liquid Glass** trong suốt, viền **Hologram cầu vồng** rực rỡ, nhìn thấy nền trắng xuyên qua
- Các card bên trong: **Holographic** với gradient màu nhạt ánh kim
- Honor Board: layout dọc theo đúng ảnh (icon + label + số cyan)
- Top Ranking: avatar tròn + tên + số CAMLY màu cam
- FUN ECOSYSTEM: logo tròn lớn + tên đậm + section Điều hướng

