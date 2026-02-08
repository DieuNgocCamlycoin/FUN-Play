
# Nâng cấp Filter Chips Bar sang phong cách sang trọng, đồng bộ màu Header Bar

## Tổng quan

Thanh **Filter Chips Bar** hiện tại sử dụng màu xanh sky đơn giản (`sky-600`, `sky-700`) trông nhạt nhòa và không hài hòa với thanh Header Bar. Header Bar hiện đang sử dụng bảng màu sang trọng gồm:

- **Vàng kim Premium** (nút THƯỞNG & TẶNG, MINT): `#FFEA00` → `#FFD700` → `#E5A800`
- **Xanh Teal-Cyan holographic** (nút WALLET): `#5EEAD4` → `#22D3EE` → `#0284C7`
- **Hồng Divine** (từ Design System): `#FFB7F6`

Mục tiêu là biến Filter Chips Bar trở nên **sang trọng (luxurious)** hơn, kết hợp hài hòa 3 tông màu chính của Header Bar, tạo cảm giác thống nhất cho toàn bộ giao diện.

---

## Thiết kế mới chi tiết

### Chip được chọn (Selected State) -- Phong cách "Aurora Luxury"
- **Nền**: Gradient 3 màu sang trọng từ Teal qua Vàng kim đến Hồng nhẹ: `from-[#22D3EE] via-[#FFD700] to-[#FFB7F6]`
- **Chữ**: Màu tối đậm (`text-gray-900`) cho độ tương phản cao, font bán đậm (`font-semibold`)
- **Viền**: Viền vàng kim nhẹ (`border-[#FFD700]/50`)
- **Bóng phát sáng**: Ánh sáng vàng kim tỏa ra (`shadow-[0_0_14px_rgba(255,215,0,0.4)]`)
- **Hiệu ứng Mirror Shimmer**: Dải ánh sáng trắng chạy liên tục qua chip (giống nút THƯỞNG & TẶNG trên Header), tạo cảm giác kim loại cao cấp
- **Hover**: Tăng cường bóng phát sáng (`shadow-[0_0_22px_rgba(255,215,0,0.6)]`) + phóng nhẹ (`scale-105`)

### Chip mặc định (Default State) -- Phong cách "Glass Teal"
- **Nền**: Nền trắng trong suốt glassmorphism (`bg-white/90 backdrop-blur-sm`)
- **Chữ**: Màu xanh teal đậm (`text-[#0284C7]`) -- lấy từ gradient nút WALLET
- **Viền**: Viền xanh teal nhẹ (`border-[#22D3EE]/30`)
- **Hover**: Viền chuyển sang vàng kim (`hover:border-[#FFD700]/50`) + bóng phát sáng teal nhẹ (`hover:shadow-[0_0_10px_rgba(34,211,238,0.25)]`) + chữ đậm hơn (`hover:text-[#0369A1]`)

### Thanh chứa (Container)
- Thêm hiệu ứng glassmorphism nhẹ cho container (`bg-white/95 backdrop-blur-sm`) thay vì `bg-background` thuần

---

## Đồng bộ Desktop và Mobile

Component `CategoryChips` được sử dụng chung tại trang chủ (`src/pages/Index.tsx`) cho cả desktop và mobile. Chỉ cần cập nhật **1 file duy nhất** là toàn bộ giao diện sẽ tự động đồng bộ.

---

## Kế hoạch triển khai

### File cần chỉnh sửa

**File:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Container (dòng 24):**
   - Thay: `bg-background`
   - Thành: `bg-white/95 backdrop-blur-sm`

2. **Chip được chọn (dòng 34):**
   - Thay:
     ```
     bg-white text-sky-700 shadow-md border border-sky-200 hover:bg-white
     ```
   - Thành:
     ```
     bg-gradient-to-r from-[#22D3EE] via-[#FFD700] to-[#FFB7F6]
     text-gray-900 font-semibold
     border border-[#FFD700]/50
     shadow-[0_0_14px_rgba(255,215,0,0.4)]
     hover:shadow-[0_0_22px_rgba(255,215,0,0.6)]
     hover:scale-105
     ```
   - Thêm lớp phủ (overlay) `animate-mirror-shimmer` bên trong chip (hiệu ứng ánh sáng lướt qua giống nút vàng kim trên Header)

3. **Chip mặc định (dòng 35):**
   - Thay:
     ```
     bg-white/80 text-sky-600 border border-gray-200
     hover:bg-white hover:text-sky-700 hover:shadow-sm
     ```
   - Thành:
     ```
     bg-white/90 backdrop-blur-sm
     text-[#0284C7]
     border border-[#22D3EE]/30
     hover:bg-white hover:text-[#0369A1]
     hover:border-[#FFD700]/50
     hover:shadow-[0_0_10px_rgba(34,211,238,0.25)]
     ```

4. **Thêm hiệu ứng Mirror Shimmer** cho chip được chọn:
   - Bọc nội dung chip trong thẻ `relative overflow-hidden`
   - Thêm phần tử `<div>` với class `animate-mirror-shimmer` (đã có sẵn trong Tailwind config) tạo dải sáng trắng chạy liên tục

---

## Tóm tắt kỹ thuật

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| File mới | 0 |
| Thay đổi cơ sở dữ liệu | Không |
| Độ phức tạp | Thấp -- chỉ thay đổi styling |
| Đồng bộ Mobile | Tự động (component dùng chung) |
| Animation mới | Không (tái sử dụng `animate-mirror-shimmer` có sẵn) |

---

## Kết quả sau cập nhật

- Chip được chọn sẽ có gradient sang trọng Teal-Vàng kim-Hồng nhẹ, đồng bộ hoàn hảo với 3 tông màu chính trên Header Bar
- Hiệu ứng Mirror Shimmer (dải sáng lướt qua) giống hệt nút "THƯỞNG & TẶNG" và "MINT" trên Header, tạo sự thống nhất thương hiệu
- Chip mặc định có phong cách glassmorphism tinh tế với chữ xanh teal, hài hòa với nút WALLET
- Hover effect với bóng phát sáng vàng kim sang trọng
- Giao diện đồng nhất 100% trên cả desktop và mobile
- Phù hợp hoàn toàn với tinh thần "5D Light Economy" và theme "Heavenly Aurora Bliss" của dự án
