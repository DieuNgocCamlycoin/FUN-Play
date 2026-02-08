

# Cập nhật hiệu ứng Filter Chips Bar: Gradient Xanh dương → Xanh lá → Vàng

## Tổng quan

Bạn muốn thanh **Filter Chips Bar** có hiệu ứng gradient chạy từ **xanh dương (blue)** sang **xanh lá (green)** rồi đến **vàng (yellow)**, áp dụng đồng bộ trên cả desktop và mobile.

## Thiết kế mới

### Chip được chọn (Selected State)
- **Nền**: Gradient 3 màu: Xanh dương (`#0066FF`) → Xanh lá (`#00CC66`) → Vàng kim (`#FFD700`)
- **Chữ**: Màu trắng đậm (`font-semibold`) để nổi bật trên nền gradient
- **Viền**: Viền xanh lá nhẹ với độ trong suốt (`border-[#00CC66]/40`)
- **Bóng**: Hiệu ứng phát sáng xanh lá (`shadow-[0_0_12px_rgba(0,204,102,0.35)]`)

### Chip mặc định (Default State)
- **Nền**: Nền trắng trong suốt 90% (`bg-white/90`)
- **Chữ**: Màu xanh dương đậm (`text-[#0066FF]`)
- **Viền**: Viền xanh lá nhẹ (`border-[#00CC66]/25`)
- **Hover**: Viền chuyển sang xanh lá đậm hơn + hiệu ứng phát sáng nhẹ

### Đồng bộ Desktop và Mobile
Component `CategoryChips` được sử dụng chung cho cả desktop và mobile (chỉ có 1 file duy nhất), nên chỉ cần cập nhật 1 file là tự động đồng bộ toàn bộ.

---

## Kế hoạch triển khai

### File cần chỉnh sửa

**File:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (Selected):**
   - Thay: `bg-white text-sky-700 shadow-md border border-sky-200 hover:bg-white`
   - Thành:
   ```
   bg-gradient-to-r from-[#0066FF] via-[#00CC66] to-[#FFD700]
   text-white font-semibold
   shadow-[0_0_12px_rgba(0,204,102,0.35)]
   border border-[#00CC66]/40
   hover:shadow-[0_0_18px_rgba(0,204,102,0.5)]
   ```

2. **Chip mặc định (Default):**
   - Thay: `bg-white/80 text-sky-600 border border-gray-200 hover:bg-white hover:text-sky-700 hover:shadow-sm`
   - Thành:
   ```
   bg-white/90
   text-[#0066FF]
   border border-[#00CC66]/25
   hover:bg-white hover:text-[#0055DD]
   hover:border-[#00CC66]/50
   hover:shadow-[0_0_8px_rgba(0,204,102,0.2)]
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

- Chip được chọn sẽ có gradient rực rỡ chạy từ xanh dương → xanh lá → vàng kim
- Chip mặc định có chữ xanh dương với viền xanh lá nhẹ
- Hiệu ứng phát sáng (glow) màu xanh lá khi hover
- Giao diện đồng nhất trên cả desktop và mobile

