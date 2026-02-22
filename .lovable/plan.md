

## Sửa lỗi và thêm dấu tick cho mục Liên kết mạng xã hội

### Nguyên nhân lỗi không thể lưu link

Tất cả 9 ô nhập link đang dùng `type="url"`, khiến trình duyệt tự động chặn gửi form nếu link không đúng định dạng URL chuẩn (ví dụ thiếu `https://`). Lỗi này xảy ra "âm thầm" -- bấm Lưu nhưng không có phản hồi gì.

### Giải pháp

**File: `src/pages/ProfileSettings.tsx`**

1. **Sửa lỗi**: Đổi `type="url"` thành `type="text"` cho tất cả 9 ô nhập link mạng xã hội, tránh trình duyệt chặn form.

2. **Thêm dấu tick**: Mỗi ô nhập link sẽ hiển thị:
   - Dấu tick xanh (CheckCircle) bên phải khi đã nhập link hợp lệ (bắt đầu bằng `http://` hoặc `https://`)
   - Không hiển thị gì khi ô trống hoặc link chưa hợp lệ

### Chi tiết kỹ thuật

- Thay `type="url"` -> `type="text"` trên 9 Input (lines 659-691)
- Bọc mỗi Input trong `div relative`, thêm icon `CheckCircle` từ lucide-react với class `absolute right-3 top-1/2 -translate-y-1/2 text-green-500` khi giá trị bắt đầu bằng `https://` hoặc `http://`
- Import thêm `CheckCircle` từ lucide-react (nếu chưa có)

Chỉ thay đổi 1 file duy nhất.
