
# Cập nhật màu chữ Filter Chips Bar đồng bộ với nút WALLET (Desktop & Mobile)

## Tình trạng hiện tại

Component `CategoryChips` hiện tại sử dụng màu chữ xanh sky cơ bản:
- **Chip được chọn**: `text-sky-700` (#0369A1) trên nền trắng
- **Chip mặc định**: `text-sky-600` (#0284C7) trên nền trắng mờ

Component này được sử dụng chung cho cả Desktop và Mobile tại `src/pages/Index.tsx` (dòng 341), nên mọi thay đổi sẽ **tự động áp dụng cho cả hai giao diện**.

## Màu nút WALLET (tham chiếu)

Nút WALLET trên Header sử dụng:
- **Gradient nền**: `#5EEAD4` (Teal nhạt) -> `#22D3EE` (Cyan) -> `#06B6D4` (Cyan đậm) -> `#0EA5E9` (Sky) -> `#0284C7` (Blue)
- **Chữ**: Trắng đậm (`text-white font-bold`)

## Thiết kế mới

### Chip được chọn (Selected)
- **Nền**: Gradient Teal-Cyan-Blue giống hệt nút WALLET: `bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)]`
- **Chữ**: Trắng đậm (`text-white font-semibold`) -- giống nút WALLET
- **Viền**: Trong suốt (`border-transparent`)
- **Không glow** (`!shadow-none`)

### Chip mặc định (Default)
- **Nền**: Nền trắng trong suốt (`bg-white/90`)
- **Chữ**: Cyan đậm (`text-[#0284C7]`) -- lấy từ điểm cuối gradient WALLET
- **Viền**: Cyan nhẹ (`border-[#22D3EE]/30`)
- **Hover**: Chữ đậm hơn (`hover:text-[#0369A1]`) + viền rõ hơn (`hover:border-[#22D3EE]/50`)
- **Không glow** (`!shadow-none`)

## File cần chỉnh sửa

**File duy nhất:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (dòng 34):**
   - Hiện tại: `bg-white text-sky-700 !shadow-none border border-sky-200 hover:bg-white hover:!shadow-none`
   - Thay thành: `bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)] text-white font-semibold border border-transparent !shadow-none hover:brightness-110 hover:!shadow-none`

2. **Chip mặc định (dòng 35):**
   - Hiện tại: `bg-white/80 text-sky-600 border border-gray-200 !shadow-none hover:bg-white hover:text-sky-700 hover:!shadow-none`
   - Thay thành: `bg-white/90 text-[#0284C7] border border-[#22D3EE]/30 !shadow-none hover:bg-white hover:text-[#0369A1] hover:border-[#22D3EE]/50 hover:!shadow-none`

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| File mới | 0 |
| Cơ sở dữ liệu | Không thay đổi |
| Độ phức tạp | Rất thấp -- chỉ thay đổi CSS classes |
| Đồng bộ Mobile | Tự động (component dùng chung cho cả Desktop và Mobile) |

## Kết quả sau cập nhật

- Chip được chọn sẽ có gradient Teal-Cyan-Blue giống hệt nút WALLET, chữ trắng nổi bật
- Chip mặc định có chữ xanh Cyan và viền Cyan nhẹ, hài hòa với tông màu WALLET
- Giao diện đồng nhất 100% trên cả Desktop và Mobile (không cần sửa riêng cho mobile)
- Không có hiệu ứng glow (giữ nguyên `!shadow-none`)
