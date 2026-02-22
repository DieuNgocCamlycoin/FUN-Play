

## Thiết kế lại hiển thị mã ví trên trang cá nhân

### Mô tả

Theo hình tham chiếu, mã ví cần được hiển thị dạng badge/chip nổi bật với viền bo tròn, icon copy rõ ràng, nằm ngay dưới username - thay vì kiểu text nhỏ mờ hiện tại.

### Thay đổi

**File: `src/components/Profile/ProfileInfo.tsx` (dòng 127-146)**

Thay thế phần hiển thị wallet hiện tại bằng thiết kế mới:

- **Chip/badge** với nền `bg-muted/60` hoặc `bg-card`, viền `border border-primary/30`, bo tròn `rounded-full`
- **Icon ví** (Wallet) bên trái, kích thước lớn hơn (`w-4 h-4`), màu primary
- **Địa chỉ ví** font mono, cỡ chữ `text-sm` (tăng từ `text-xs`), màu `text-foreground` (thay vì muted)
- **Nút copy** bên phải, có hover effect rõ ràng, icon `Copy` lớn hơn (`w-4 h-4`)
- **Padding** thoáng hơn: `px-4 py-2`
- Toàn bộ chip có `hover:border-primary/50` transition

Kết quả: mã ví nổi bật, dễ đọc, dễ copy - giống style trong hình tham chiếu.
