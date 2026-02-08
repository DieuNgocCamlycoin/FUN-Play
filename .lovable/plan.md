

# Cập nhật màu sắc Filter Chips Bar theo thương hiệu FUN Play

## Tổng quan

Bạn muốn cập nhật thanh **Filter Chips Bar** (Category Chips) để sử dụng màu sắc từ logo dự án thay vì màu xanh sky hiện tại. Logo FUN Play sử dụng bảng màu **Aurora Gradient** đặc trưng của theme "Heavenly Aurora Bliss" với 4 màu cosmic chính:

- **Cosmic Cyan**: `#00E7FF` (xanh cyan rực rỡ)
- **Cosmic Sapphire**: `#7A2BFF` (tím sapphire)
- **Cosmic Magenta**: `#FF00E5` (hồng magenta)
- **Cosmic Gold**: `#FFD700` (vàng kim)

## Thiết kế mới

### Chip được chọn (Selected State)
- **Background**: Gradient aurora từ Cyan → Sapphire → Magenta
- **Text**: Màu trắng với font đậm
- **Border**: Viền gradient với hiệu ứng glow nhẹ
- **Shadow**: Ánh sáng phát ra màu cyan/magenta

### Chip mặc định (Default State)
- **Background**: Nền trắng trong suốt 80% với viền gradient nhẹ
- **Text**: Màu tím đậm (`#7A2BFF`)
- **Hover**: Hiệu ứng glow nhẹ khi di chuột

### Đồng bộ Desktop & Mobile
Component `CategoryChips` được sử dụng chung cho cả desktop và mobile trên trang Index, nên chỉ cần cập nhật một file duy nhất để đồng bộ toàn bộ.

---

## Kế hoạch triển khai

### File cần chỉnh sửa

**File:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (Selected):**
   - Thay `bg-white text-sky-700 shadow-md border border-sky-200` 
   - Thành gradient aurora với glow effect:
   ```
   bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5]
   text-white font-semibold
   shadow-[0_0_15px_rgba(0,231,255,0.4)]
   border border-[#00E7FF]/40
   ```

2. **Chip mặc định (Default):**
   - Thay `bg-white/80 text-sky-600 border border-gray-200`
   - Thành glassmorphism với accent aurora:
   ```
   bg-white/90 backdrop-blur-sm
   text-[#7A2BFF] 
   border border-[#7A2BFF]/20
   hover:border-[#00E7FF]/50
   hover:shadow-[0_0_10px_rgba(0,231,255,0.3)]
   ```

---

## Tóm tắt kỹ thuật

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (CategoryChips.tsx) |
| File mới | 0 |
| Thay đổi database | Không |
| Độ phức tạp | Thấp - chỉ thay đổi styling |
| Đồng bộ Mobile | Tự động (component dùng chung) |

### Kết quả sau cập nhật

- Filter Chips Bar sẽ sử dụng bảng màu Aurora Gradient phù hợp với logo FUN Play
- Chip được chọn có hiệu ứng gradient cầu vồng nổi bật
- Chip mặc định có viền tím nhẹ với hover effect phát sáng
- Giao diện đồng nhất trên cả desktop và mobile
- Phù hợp với tinh thần "5D Light Economy" của dự án

