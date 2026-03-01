

## Điều chỉnh avatar vào trung tâm màn hình trên giao diện điện thoại

### Vấn đề hiện tại
Avatar đang được căn giữa bằng `left-1/2 -translate-x-1/2`, nhưng nằm bên trong container có `max-w-6xl mx-auto px-4`. Trên mobile, padding và max-width của container cha khiến avatar bị lệch so với trung tâm thực sự của màn hình.

### Giải pháp
Chỉnh sửa file `src/components/Profile/ProfileHeader.tsx` để avatar căn giữa chính xác theo viewport trên mobile.

### Chi tiết kỹ thuật

**File chỉnh sửa:** `src/components/Profile/ProfileHeader.tsx`

1. **Dòng 58** - Thay đổi container của avatar: trên mobile bỏ giới hạn `max-w-6xl` và `px-4`, chỉ áp dụng chúng từ `md` trở lên:
   - Từ: `relative max-w-6xl mx-auto px-4 lg:px-6`
   - Thành: `relative max-w-none md:max-w-6xl mx-auto md:px-4 lg:px-6`

2. **Dòng 121** - Tăng khoảng cách spacer trên mobile để avatar không bị chồng lên nội dung phía dưới:
   - Từ: `h-24 md:h-20 lg:h-24`
   - Thành: `h-28 md:h-20 lg:h-24`

### Kết quả mong đợi
Avatar sẽ nằm chính giữa màn hình trên giao diện điện thoại, không bị lệch do padding hay max-width của container cha.

