

## Sửa lỗi video không phát được trên điện thoại

### Nguyên nhân gốc

Trong file `YouTubeMobilePlayer.tsx`, component sử dụng `motion.div` với cả hai prop `drag="y"` và `onClick={handleTap}` cùng lúc (dòng 419-430). Trên điện thoại, Framer Motion xử lý sự kiện chạm (touch) để phục vụ tính năng kéo (drag), điều này gây xung đột với `onClick` — Framer Motion có thể "nuốt" sự kiện touch trước khi `onClick` kịp kích hoạt.

Ngoài ra, autoplay (`video.play()`) thường bị trình duyệt mobile chặn (do chính sách autoplay), nhưng lỗi này bị bắt im lặng (`.catch(() => {})`), khiến người dùng thấy màn hình đen mà không có cách nào bấm phát video.

### Giải pháp

**File thay đổi:** `src/components/Video/YouTubeMobilePlayer.tsx`

#### 1. Thay `onClick` bằng `onTap` của Framer Motion
- Framer Motion cung cấp prop `onTap` được thiết kế để phân biệt giữa chạm nhẹ (tap) và kéo (drag)
- Đổi `onClick={handleTap}` thành `onTap={handleTap}` trên `motion.div` container (dòng 430)
- Cập nhật kiểu tham số của hàm `handleTap` cho tương thích với `onTap`

#### 2. Xử lý autoplay thất bại — hiện nút Play lớn
- Thêm state `autoplayFailed` để theo dõi khi trình duyệt chặn autoplay
- Cập nhật `useEffect` autoplay (dòng 304-308) để set `autoplayFailed = true` khi `.play()` bị reject
- Hiển thị overlay nút Play lớn khi autoplay thất bại, cho phép người dùng bấm thủ công để phát video

#### 3. Đảm bảo nút Play/Pause trong controls không bị chặn
- Thêm `onPointerDown` với `e.stopPropagation()` cho nút Play/Pause trung tâm để sự kiện không bị Framer Motion chặn

### Chi tiết kỹ thuật

```text
Luồng xử lý mới:
  Tải video → Thử autoplay
    ├── Thành công → Phát bình thường
    └── Thất bại → Hiện overlay nút Play lớn
                     └── Người dùng bấm → Phát video + ẩn overlay
```

