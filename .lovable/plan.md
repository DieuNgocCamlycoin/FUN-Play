
# Di chuyển 3 Cards sang Right Sidebar (Giống FUN FARM)

## Tổng quan vấn đề

Hiện tại các cards (Honor Board, Top Ranking, Top Sponsors) đang hiển thị **nằm ngang phía trên** video feed (như hình 1) thay vì bên phải như FUN FARM (hình 2).

**Nguyên nhân**: Breakpoint đang dùng `xl` (1280px), nhưng màn hình preview nhỏ hơn 1280px nên:
- Mobile cards (`xl:hidden`) hiển thị ở trên
- Right sidebar (`hidden xl:flex`) bị ẩn

## Giải pháp

Thay đổi breakpoint từ `xl` (1280px) xuống `lg` (1024px) để right sidebar hiển thị sớm hơn trên desktop.

---

## Chi tiết thay đổi (2 files)

### 1. File: `src/components/Layout/HonoboardRightSidebar.tsx`

**Thay đổi breakpoint hiển thị:**

| Vị trí | Cũ | Mới |
|--------|-----|-----|
| Dòng 18 | `hidden xl:flex` | `hidden lg:flex` |

### 2. File: `src/pages/Index.tsx`

**Cập nhật 2 vị trí:**

| Vị trí | Mô tả | Cũ | Mới |
|--------|-------|-----|-----|
| Dòng 271 | Main content padding right | `xl:pr-80` | `lg:pr-80` |
| Dòng 277 | Mobile 3-Card Layout | `xl:hidden` | `lg:hidden` |

---

## Kết quả sau khi sửa

```text
+------------------+------------------------+-------------------+
|   Left Sidebar   |      Video Feed        |   Right Sidebar   |
|   FUN ECOSYSTEM  |      (70-75%)          |   (320px)         |
|   (64px/240px)   |                        |   FIXED/STICKY    |
+------------------+------------------------+-------------------+
                   |                        | 1. HONOR BOARD    |
                   |     Tiep tuc xem       | 2. TOP RANKING    |
                   |     Video Grid         | 3. TOP SPONSORS   |
                   |                        +-------------------+
```

| Breakpoint | Right Sidebar | Mobile Cards |
|------------|---------------|--------------|
| < 1024px (mobile/tablet) | Ẩn | Hiển thị (stack dọc) |
| >= 1024px (desktop) | Hiển thị (fixed bên phải) | Ẩn |

---

## Màu sắc giữ nguyên

Tất cả màu sắc và style hiện tại của FUN PLAY sẽ được giữ nguyên:
- Gradient hologram: Cyan (#00E7FF) → Purple (#7A2BFF) → Magenta (#FF00E5)
- Stat pills: Purple-Pink gradient (#7A2BFF → #FF00E5 → #FFD700)  
- Values: Gold (#FFD700)
- Glass background: white/85 + backdrop-blur

---

## Tổng kết

| File | Thay đổi |
|------|----------|
| `HonoboardRightSidebar.tsx` | `xl:` → `lg:` |
| `Index.tsx` | `xl:hidden` → `lg:hidden`, `xl:pr-80` → `lg:pr-80` |
| **Tổng cộng** | **2 files, 3 dòng code** |

Đây là thay đổi nhỏ nhưng quan trọng - chỉ cần đổi breakpoint để Right Sidebar hiển thị đúng vị trí bên phải như FUN FARM!
