
# Cập nhật viền và màu chữ Filter Chips Bar theo màu xanh logo FUN Play

## Tình trạng hiện tại

Các chip chưa chọn (default) hiện tại có:
- **Viền**: Mỏng (`border` = 1px), màu cyan nhạt (`border-[#22D3EE]/30`)
- **Chữ**: Màu `#0284C7` (sky blue)

## Màu xanh logo FUN Play

Logo FUN Play sử dụng màu **Cosmic Sapphire** (`#0066FF`), đã được định nghĩa trong hệ thống thiết kế:
- CSS Variable: `--cosmic-sapphire: 216 100% 50%`
- Tailwind token: `fun-blue` hoặc `cosmic-sapphire`

## Thay đổi

### File duy nhất: `src/components/Layout/CategoryChips.tsx`

**Chip mặc định (chưa chọn) -- dòng 35:**

| Thuộc tính | Hiện tại | Sau cập nhật |
|------------|----------|--------------|
| Viền dày | `border` (1px) | `border-2` (2px) |
| Màu viền | `border-[#22D3EE]/30` (cyan nhạt) | `border-[#0066FF]/40` (xanh logo) |
| Màu chữ | `text-[#0284C7]` (sky blue) | `text-[#0066FF]` (xanh logo) |
| Hover viền | `hover:border-[#22D3EE]/50` | `hover:border-[#0066FF]/60` |
| Hover chữ | `hover:text-[#0369A1]` | `hover:text-[#0052CC]` (xanh logo đậm hơn) |

**Chip được chọn (selected) -- dòng 34:**

| Thuộc tính | Hiện tại | Sau cập nhật |
|------------|----------|--------------|
| Viền dày | `border` (1px) | `border-2` (2px) |
| (Giữ nguyên gradient nền và chữ trắng) | | |

## Chi tiết kỹ thuật

Thay đổi class CSS trên dòng 34 và 35 của file `CategoryChips.tsx`:

**Dòng 34 (chip selected):** Đổi `border border-transparent` thanh `border-2 border-transparent`

**Dòng 35 (chip default):** Đổi toàn bộ:
- `border border-[#22D3EE]/30` thanh `border-2 border-[#0066FF]/40`
- `text-[#0284C7]` thanh `text-[#0066FF]`
- `hover:text-[#0369A1]` thanh `hover:text-[#0052CC]`
- `hover:border-[#22D3EE]/50` thanh `hover:border-[#0066FF]/60`

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| Thay đổi | 2 dòng (dòng 34 và 35) |
| Cơ sở dữ liệu | Không |
| Đồng bộ Mobile | Tự động (component dùng chung) |

## Kết quả

- Viền các chip dày hơn (2px thay vì 1px), rõ ràng hơn trên mobile
- Màu viền và chữ sử dụng đúng màu xanh logo FUN Play (#0066FF)
- Chip được chọn giữ nguyên gradient Teal-Cyan-Blue với viền dày hơn
- Áp dụng đồng thời cho cả Desktop và Mobile
