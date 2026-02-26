

## Sửa lỗi: Nút Play/Pause không hoạt động trên điện thoại

### Nguyên nhân gốc

Trong `YouTubeMobilePlayer.tsx`, container `motion.div` (dòng 425-438) sử dụng `onTap` của Framer Motion. Trên điện thoại, Framer Motion chiếm quyền xử lý sự kiện chạm (touch), khiến `onClick` trên nút Play/Pause bên trong (dòng 614-626) **không được kích hoạt** hoặc bị trình duyệt coi là **không phải hành động của người dùng** (non-user gesture), dẫn đến `video.play()` bị từ chối.

Chuỗi lỗi:
1. Người dùng chạm vào nút Play
2. Framer Motion bắt sự kiện touch trước → kích hoạt `onTap` trên container → ẩn controls
3. `onClick` trên nút Play hoặc không fire, hoặc fire nhưng `video.play()` bị browser từ chối vì không còn là "user gesture"
4. Video không phát lại được

### Giải pháp

**File thay đổi:** `src/components/Video/YouTubeMobilePlayer.tsx`

#### 1. Chuyển nút Play/Pause sang dùng `onPointerUp` thay vì `onClick`
- `onPointerUp` fire trước khi Framer Motion xử lý `onTap`, đảm bảo nút bấm luôn được ghi nhận
- Giữ `e.stopPropagation()` để ngăn `onTap` cha fire theo

#### 2. Thêm kiểm tra target trong `handleTap`
- Trong hàm `handleTap`, kiểm tra nếu sự kiện đến từ một nút bấm (`button`, `svg`, `path`) thì bỏ qua, không toggle controls
- Điều này ngăn `handleTap` chạy đồng thời với nút Play/Pause

#### 3. Thêm `.catch()` cho `video.play()` trong `togglePlay`
- Bắt lỗi khi browser từ chối phát video, set `autoplayFailed = true` để hiện overlay Play lớn làm phương án dự phòng

### Chi tiết kỹ thuật

```text
Trước khi sửa:
  Chạm nút Play → Framer onTap chiếm quyền → onClick không fire → Video không phát

Sau khi sửa:
  Chạm nút Play → onPointerUp fire ngay → video.play() OK
                 → handleTap kiểm tra target → bỏ qua (không ẩn controls)
                 → Nếu play() thất bại → hiện overlay Play lớn
```

Thay đổi cụ thể:
- Hàm `togglePlay`: thêm `.catch()` xử lý lỗi, set `autoplayFailed = true`
- Hàm `handleTap`: thêm kiểm tra `event.target` có phải nút bấm không
- Nút Play/Pause trung tâm: đổi `onClick` thành `onPointerUp` 
- Các nút Previous/Next: cũng đổi sang `onPointerUp` cho nhất quán

