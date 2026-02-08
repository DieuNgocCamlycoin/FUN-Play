

# Đồng bộ Filter Chips Bar: Chip chọn = màu MINT, Chip mặc định = màu WALLET

## Tổng quan

Cập nhật **Filter Chips Bar** để:
- **Chip được chọn (pressed)**: Sử dụng bảng màu **vàng kim Premium** giống nút **MINT** trên Header
- **Chip mặc định (not pressed)**: Sử dụng bảng màu **xanh Teal-Cyan-Blue** giống nút **WALLET** trên Header

Thay đổi áp dụng đồng bộ cho cả Desktop và Mobile (cùng 1 component).

---

## Màu tham chiếu từ Header

### Nút MINT (dùng cho chip được chọn)
- Gradient dọc vàng kim: `from-[#FFEA00] via-[#FFD700] to-[#E5A800]`
- Chữ màu nâu vàng đậm: `text-[#7C5800]`
- Viền vàng nhạt: `border-[#FFEA00]/60`
- Bóng phát sáng vàng: `shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)]`
- Hiệu ứng Mirror Shimmer (dải sáng trắng chạy qua)

### Nút WALLET (dùng cho chip mặc định)
- Gradient ngang xanh: `#5EEAD4 -> #22D3EE -> #06B6D4 -> #0EA5E9 -> #0284C7`
- Chữ trắng: `text-white`

---

## Thiết kế mới chi tiết

### Chip được chọn (Selected) -- Phong cách "MINT Gold"
- **Nền**: Gradient vàng kim dọc `bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800]`
- **Chữ**: Nâu vàng đậm `text-[#7C5800] font-extrabold`
- **Viền**: Vàng nhạt `border-[#FFEA00]/60`
- **Bóng**: Ánh sáng vàng kim `shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)]`
- **Hiệu ứng**: Mirror Shimmer (dải sáng trắng chạy qua liên tục)
- **Hover**: Tăng cường bóng + phóng nhẹ `hover:scale-105`

### Chip mặc định (Default) -- Phong cách "WALLET Teal"
- **Nền**: Gradient ngang xanh `bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)]`
- **Chữ**: Trắng `text-white font-semibold`
- **Viền**: Trong suốt `border-transparent`
- **Hover**: Tăng sáng `hover:brightness-110`
- **Không glow**: `!shadow-none`

---

## File cần chỉnh sửa

**File duy nhất:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (dòng 33-34):**
   - Hiện tại:
     ```
     bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)]
     text-white font-semibold border border-transparent !shadow-none
     hover:brightness-110 hover:!shadow-none
     ```
   - Thay thành:
     ```
     bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800]
     text-[#7C5800] font-extrabold border border-[#FFEA00]/60
     shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)]
     hover:shadow-[0_0_25px_rgba(255,234,0,0.6)] hover:scale-105
     ```
   - Thêm phần tử Mirror Shimmer overlay bên trong chip (giống nút MINT), cần cấu trúc lại JSX để bọc nội dung chip trong `relative overflow-hidden` và thêm `<span>` shimmer

2. **Chip mặc định (dòng 35):**
   - Hiện tại:
     ```
     bg-white/90 text-[#0284C7] font-medium border border-[#22D3EE]/30
     !shadow-none hover:bg-white hover:text-[#0369A1]
     hover:border-[#22D3EE]/50 hover:!shadow-none
     ```
   - Thay thành:
     ```
     bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)]
     text-white font-semibold border border-transparent
     !shadow-none hover:brightness-110 hover:!shadow-none
     ```

3. **Cấu trúc JSX**: Thay đổi nội dung bên trong `<Button>` để thêm hiệu ứng Mirror Shimmer cho chip được chọn:
   - Bọc text trong `<span className="relative z-10">`
   - Thêm `<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />` khi chip đang được chọn

---

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| File mới | 0 |
| Thay đổi cơ sở dữ liệu | Không |
| Độ phức tạp | Thấp -- thay đổi CSS + thêm shimmer overlay |
| Đồng bộ Mobile | Tự động (component dùng chung) |

## Kết quả

- Chip được chọn sẽ có màu **vàng kim sang trọng** giống hệt nút MINT, với hiệu ứng Mirror Shimmer chạy qua
- Chip mặc định sẽ có gradient **xanh Teal-Cyan-Blue** giống hệt nút WALLET, chữ trắng
- Desktop và Mobile đồng bộ 100%
- Tạo sự hài hòa thị giác hoàn hảo giữa Filter Chips Bar và Header Bar

