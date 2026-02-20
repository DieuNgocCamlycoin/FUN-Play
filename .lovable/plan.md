
## Kế hoạch thiết kế lại giao diện 3 cột FUN PLAY – Trang Preview

### Tổng quan chiến lược

Thay vì sửa trực tiếp layout hiện tại có thể gây lỗi, tôi sẽ **tạo một trang Preview riêng** tại `/ui-preview` để con xem và duyệt thiết kế mới trước khi áp dụng. Trang này hoàn toàn độc lập, không ảnh hưởng gì đến giao diện hiện tại.

---

### Phân tích hiện trạng

| Thành phần | Hiện tại | Vấn đề |
|---|---|---|
| Left sidebar | `bg-background border-r` (nền trắng đặc) | Không trong suốt, thiếu glassmorphism |
| Right sidebar | `bg-gradient-to-b from-white via-white` + `border-l` | Nền trắng đặc, không xuyên qua background |
| Cards (HonorBoard, Ranking) | `bg-white/85` | Gần đúng nhưng thiếu viền hologram đủ đẹp |
| Video grid | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | OK nhưng chưa tối ưu card style |
| Background | `bg-background` = trắng 100% | Chưa có cơ chế thay theme linh hoạt |

---

### Nội dung trang UIPreview (`/ui-preview`)

**Trang UIPreview sẽ render đầy đủ layout 3 cột giả lập:**

#### 1. Background hệ thống (thay được theme)
- Nền mặc định: gradient nhẹ trắng → tím/xanh nhạt (giống mock của con)
- Thêm các lớp trang trí nhẹ hai bên (bông hoa, ánh sáng)
- CSS variable `--bg-theme` để sau này thay theme dễ

#### 2. Component `GlassPanel` (dùng chung cho cả 2 panel)
```
background: rgba(255,255,255,0.14)
backdrop-filter: blur(14px)
border: 1.5px solid rgba(255,255,255,0.30)
border-radius: 20px
```
Biến thể `HoloBorder` cho panel phải:
```
border: 2px solid transparent
background-clip: padding-box
+ ::after overlay gradient 7 màu nhẹ
```

#### 3. Left Panel – FUN Ecosystem (260–300px)
- Tiêu đề "🌿 FUN ECOSYSTEM" với gradient text
- **About FUN PLAY** – nút Collapsible có mũi tên xuống:
  - Luật Ánh Sáng
  - Build & Bounty
  - White Paper
- Danh sách 10 platform với card nhỏ:
  1. FUN PROFILE – fun.rich
  2. ANGEL AI – angel.fun.rich
  3. FUN TREASURY – treasury.fun.rich
  4. FUN FARM – farm.fun.rich
  5. FUN PLANET – planet.fun.rich
  6. FUN CHARITY – charity.fun.rich
  7. FUN GREEN EARTH – 5DEarth.fun.rich
  8. FUN ACADEMY – academy.fun.rich
  9. CAMLY COIN – camly.co
  10. FUN WALLET – wallet.fun.rich
- Mỗi platform card: logo tròn + tên + mũi tên link ngoài + hover glow
- Phần điều hướng còn lại (Trang chủ, Shorts…) → gộp vào menu 3 gạch (drawer)

#### 4. Center Content – Grid video 3 cột
- Header filter chips (Tất cả / Xu hướng / Âm nhạc…)
- Grid `grid-cols-3` desktop, `grid-cols-2` tablet, `grid-cols-1` mobile
- 6 VideoCard mẫu (mock data) theo chuẩn YouTube:
  - Thumbnail 16:9 bo 16px
  - Avatar trái + dấu 3 chấm phải
  - Tên video tối đa 2 dòng
  - Tên kênh
  - Lượt xem · thời gian

#### 5. Right Panel – Honor Board / Ranking / Sponsor (300–340px)
- Glass panel + HoloBorder gradient 7 màu nhẹ
- 3 stat-card stacked:
  - Honor Board (users, posts, photos, videos, rewards)
  - Top Ranking
  - Top Sponsors
- Mỗi stat-card: nền gradient FUN PLAY nhẹ + icon + số liệu

---

### Breakpoints

| Màn hình | Layout |
|---|---|
| Desktop ≥ 1280px | 3 cột: Left 280px + Center fluid + Right 320px |
| Tablet 768-1279px | 2 cột: Center + Right, Left thành icon sidebar |
| Mobile < 768px | 1 cột: Center → Right cards → Left drawer |

Max-width toàn trang: `1560px`, canh giữa.

---

### Các file sẽ tạo/chỉnh sửa

| STT | File | Hành động | Mô tả |
|---|---|---|---|
| 1 | `src/pages/UIPreview.tsx` | Tạo mới | Trang preview 3 cột hoàn chỉnh |
| 2 | `src/components/Layout/GlassPanel.tsx` | Tạo mới | Component panel trong suốt dùng chung |
| 3 | `src/components/Layout/FunEcosystemPanel.tsx` | Tạo mới | Left panel với 10 platform + About FUN PLAY collapsible |
| 4 | `src/components/Layout/HonorRightPanel.tsx` | Tạo mới | Right panel glass + holoBorder, tích hợp 3 card |
| 5 | `src/App.tsx` | Chỉnh sửa | Thêm route `/ui-preview` |

---

### Chi tiết kỹ thuật

**GlassPanel.tsx:**
```tsx
// Nền trong suốt chuẩn glassmorphism
// Variant: "default" | "holo"
// "holo" = viền gradient 7 màu nhẹ (không lòe loẹt)
```

**FunEcosystemPanel.tsx:**
```tsx
// 10 platform items dạng card nhỏ
// Collapsible "About FUN PLAY"
// Hover: glow nhẹ theo màu logo
// Cuộn được nếu nội dung dài
```

**UIPreview.tsx:**
```tsx
// Header preview (logo + search + buttons giả lập)
// 3-column grid: left (280px) + center (1fr) + right (320px)
// Background: gradient trắng → lavender nhẹ
// Scrollable page
// Ghi chú "Preview Mode" để phân biệt với giao diện thật
```

---

### Kết quả mong đợi

Sau khi xong, con có thể truy cập `/ui-preview` để xem toàn bộ giao diện mới:
- Left panel glassmorphism với 10 platform + About FUN PLAY collapsible
- Center: 6 video card mẫu (3 cột desktop)
- Right panel với holoBorder + 3 card stat
- Background xuyên qua panel rõ ràng
- Responsive chuẩn desktop/tablet/mobile

Khi con duyệt → Cha sẽ áp dụng vào layout thật (`CollapsibleSidebar`, `HonoboardRightSidebar`, `Index.tsx`).
