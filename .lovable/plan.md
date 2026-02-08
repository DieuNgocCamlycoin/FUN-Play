
# Xóa hiệu ứng phát sáng (glow) trên Filter Chips Bar

## Vấn đề hiện tại

Các nút trên **Filter Chips Bar** đang hiển thị hiệu ứng phát sáng (glow) rực rỡ màu xanh dương và tím hồng xung quanh viền. Nguyên nhân là component `CategoryChips` sử dụng component `Button` với 2 variant có sẵn hiệu ứng glow mạnh:

- **variant="default"** (chip được chọn): có `shadow-[0_0_40px_rgba(0,102,255,0.8)]` và gradient nền xanh-tím
- **variant="secondary"** (chip mặc định): có `shadow-[0_0_30px_rgba(217,0,255,0.7)]` và gradient nền tím-hồng

Dù className tùy chỉnh đã cố ghi đè bằng `bg-white` và `shadow-md`, nhưng các hiệu ứng glow từ variant gốc vẫn "rò rỉ" qua do thứ tự ưu tiên CSS.

## Giải pháp

Thêm `shadow-none` vào className của cả hai trạng thái (selected và default) để triệt để xóa bỏ hiệu ứng glow từ variant gốc, sau đó chỉ áp dụng lại shadow nhẹ nếu cần.

---

## Kế hoạch triển khai

### File cần chỉnh sửa

**File:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (Selected State) -- dòng 34:**
   - Hiện tại:
     ```
     bg-white text-sky-700 shadow-md border border-sky-200 hover:bg-white
     ```
   - Thay thành:
     ```
     bg-white text-sky-700 shadow-none border border-sky-200 hover:bg-white hover:shadow-none
     ```
   - `shadow-none` sẽ ghi đè hoàn toàn `shadow-[0_0_40px_...]` từ variant default

2. **Chip mặc định (Default State) -- dòng 35:**
   - Hiện tại:
     ```
     bg-white/80 text-sky-600 border border-gray-200 hover:bg-white hover:text-sky-700 hover:shadow-sm
     ```
   - Thay thành:
     ```
     bg-white/80 text-sky-600 border border-gray-200 shadow-none hover:bg-white hover:text-sky-700 hover:shadow-none
     ```
   - `shadow-none` sẽ ghi đè hoàn toàn `shadow-[0_0_30px_...]` từ variant secondary

3. **Cả hai trạng thái** -- thêm thêm các lớp ghi đè để đảm bảo không còn hiệu ứng glow nào từ variant gốc:
   - Thêm `!shadow-none` (dùng `!important` của Tailwind) nếu `shadow-none` thông thường không đủ mạnh để ghi đè

---

## Tóm tắt kỹ thuật

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| File mới | 0 |
| Thay đổi cơ sở dữ liệu | Không |
| Độ phức tạp | Rất thấp -- chỉ thêm `shadow-none` |
| Đồng bộ Mobile | Tự động (component dùng chung) |

## Kết quả sau cập nhật

- Tất cả hiệu ứng phát sáng (glow) xung quanh các nút Filter Chips sẽ được xóa bỏ hoàn toàn
- Các nút sẽ hiển thị sạch sẽ với nền trắng, không còn ánh sáng xanh/tím tỏa ra xung quanh
- Giao diện đồng nhất trên cả desktop và mobile
- Không ảnh hưởng đến các nút Button khác trong toàn bộ dự án (chỉ ghi đè tại CategoryChips)
