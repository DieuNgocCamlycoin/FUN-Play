

## Sửa lỗi hiển thị chồng: Dropdown + Dialog báo cáo

### Vấn đề

Khi bấm "Báo cáo" trong menu dropdown, dialog báo cáo mở ra nhưng dropdown **không đóng lại**, khiến 2 thành phần hiển thị chồng lên nhau.

Nguyên nhân: `onSelect={(e) => e.preventDefault()}` ngăn dropdown đóng khi click.

### Giải pháp

Thay đổi cách tích hợp: thay vì nhúng `ReportSpamButton` trực tiếp vào dropdown (gây xung đột), sẽ dùng cách tương tự các nút khác (Chia sẻ, Lưu playlist) -- bấm menu item sẽ đóng dropdown, rồi mở dialog báo cáo riêng biệt.

### Chi tiết kỹ thuật

**File: `src/components/Video/VideoCard.tsx`**

1. Thêm state `reportDialogOpen` để quản lý dialog báo cáo
2. Thay `DropdownMenuItem asChild` + `ReportSpamButton` bằng `DropdownMenuItem` thường với `onClick` set state mở dialog
3. Đặt `ReportSpamButton` (hoặc dialog từ nó) bên ngoài dropdown, điều khiển bằng state -- tương tự `ShareModal`

Cách khác đơn giản hơn: tách phần Dialog ra khỏi `ReportSpamButton`, thêm prop `open`/`onOpenChange` để component cha kiểm soát. Hoặc đơn giản hơn nữa: đặt `ReportSpamButton` ra ngoài dropdown hoàn toàn và chỉ dùng DropdownMenuItem để trigger mở dialog.

| File | Thay đổi |
|------|---------|
| `src/components/Video/VideoCard.tsx` | Chuyển ReportSpamButton ra ngoài DropdownMenu, dùng state để mở dialog sau khi dropdown đóng |
| `src/components/Video/ReportSpamButton.tsx` | Thêm prop `open`/`onOpenChange` để component cha có thể điều khiển dialog từ bên ngoài |

