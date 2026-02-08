

# Cập nhật màu sắc Filter Chips Bar theo Logo FUN Play

## Tổng quan

Thanh **Filter Chips Bar** (Category Chips) hiện tại sử dụng màu xanh sky (`sky-600`, `sky-700`) không phù hợp với thương hiệu FUN Play. Cần cập nhật để sử dụng 3 màu chính từ logo dự án:

- **Xanh dương (Blue)**: `#0066FF` (Cosmic Sapphire)
- **Vàng kim (Yellow/Gold)**: `#FFD700` (Cosmic Gold)  
- **Hồng nhẹ (Light Pink)**: `#FFB7F6` (Divine Pink)

## Thiết kế mới

### Chip được chọn (Selected State)
- **Nền**: Gradient 3 màu từ logo: Xanh dương → Hồng nhẹ → Vàng kim
- **Chữ**: Màu trắng đậm (font-semibold) để nổi bật trên nền gradient
- **Viền**: Viền xanh nhẹ với độ trong suốt (`border-[#00BFFF]/40`)
- **Bóng**: Hiệu ứng phát sáng màu xanh (`shadow-[0_0_12px_rgba(0,102,255,0.35)]`)

### Chip mặc định (Default State)
- **Nền**: Nền trắng trong suốt 90% (`bg-white/90`)
- **Chữ**: Màu xanh dương đậm từ logo (`text-[#0066FF]`)
- **Viền**: Viền hồng nhẹ (`border-[#FFB7F6]/30`)
- **Hover**: Viền chuyển sang xanh + hiệu ứng phát sáng nhẹ

### Đồng bộ Desktop và Mobile
Component `CategoryChips` được sử dụng chung cho cả desktop và mobile trên trang chủ (chỉ có 1 file duy nhất), nên chỉ cần cập nhật 1 file là đồng bộ toàn bộ.

---

## Kế hoạch triển khai

### File cần chỉnh sửa

**File:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (Selected):**
   - Thay: `bg-white text-sky-700 shadow-md border border-sky-200 hover:bg-white`
   - Thành:
   ```
   bg-gradient-to-r from-[#0066FF] via-[#FFB7F6] to-[#FFD700]
   text-white font-semibold
   shadow-[0_0_12px_rgba(0,102,255,0.35)]
   border border-[#00BFFF]/40
   hover:shadow-[0_0_18px_rgba(0,102,255,0.5)]
   ```

2. **Chip mặc định (Default):**
   - Thay: `bg-white/80 text-sky-600 border border-gray-200 hover:bg-white hover:text-sky-700 hover:shadow-sm`
   - Thành:
   ```
   bg-white/90
   text-[#0066FF]
   border border-[#FFB7F6]/30
   hover:bg-white hover:text-[#0055DD]
   hover:border-[#00BFFF]/50
   hover:shadow-[0_0_8px_rgba(0,102,255,0.2)]
   ```

---

## Tóm tắt kỹ thuật

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (CategoryChips.tsx) |
| File mới | 0 |
| Thay đổi cơ sở dữ liệu | Không |
| Độ phức tạp | Thấp — chỉ thay đổi styling |
| Đồng bộ Mobile | Tự động (component dùng chung) |

### Kết quả sau cập nhật

- Filter Chips Bar sẽ sử dụng 3 màu chính từ logo FUN Play: xanh dương, vàng kim, hồng nhẹ
- Chip được chọn có hiệu ứng gradient cầu vồng 3 màu nổi bật
- Chip mặc định có chữ xanh dương với viền hồng nhẹ
- Giao diện đồng nhất trên cả desktop và mobile
- Phù hợp với tinh thần "5D Light Economy" của dự án

