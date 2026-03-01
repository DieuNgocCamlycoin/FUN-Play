

## Sửa lỗi avatar chưa căn giữa trên mobile

### Nguyên nhân
Container chứa avatar (dòng 58) có `max-w-none` nhưng thiếu `w-full`, nên trên mobile nó co lại theo nội dung bên trong thay vì trải hết chiều ngang màn hình. Khi đó `left-1/2 -translate-x-1/2` căn giữa theo container nhỏ chứ không phải theo màn hình.

### Giải pháp
Thêm `w-full` vào container avatar tại dòng 58 trong file `src/components/Profile/ProfileHeader.tsx`:

- Từ: `relative max-w-none md:max-w-6xl mx-auto md:px-4 lg:px-6`
- Thành: `relative w-full max-w-none md:max-w-6xl mx-auto md:px-4 lg:px-6`

Chỉ cần thêm 1 class duy nhất, avatar sẽ nằm chính giữa màn hình trên điện thoại.

