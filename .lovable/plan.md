

# Cải thiện cách đếm View Count: Chỉ tăng sau 30 giây xem

## Vấn đề hiện tại

Trong `src/pages/Watch.tsx` (dòng 253-257), view_count được tăng **ngay lập tức** khi video data load xong, không cần user thực sự xem video. Điều này dễ bị lạm dụng (reload = tăng view).

## Giải pháp

Thay thế logic tăng view ngay lập tức bằng một timer 30 giây, chỉ tăng view khi user thực sự xem đủ thời gian.

## Chi tiết kỹ thuật

### Sửa `src/pages/Watch.tsx`

1. **Xóa** đoạn increment view_count ngay lập tức (dòng 253-257)

2. **Thêm useEffect mới** với logic:
   - Khởi tạo timer 30 giây khi video đã load thành công
   - Dùng `useRef` để đảm bảo chỉ tăng view **1 lần** cho mỗi video ID
   - Khi timer hoàn thành (30s), gọi `supabase.update()` tăng view_count +1
   - Cleanup timer khi user chuyển trang hoặc đổi video
   - Reset ref khi video ID thay đổi (để video mới có thể đếm view riêng)

```text
Logic flow:
  Video load xong → Bắt đầu timer 30s → Timer hết → Tăng view_count +1
  User chuyển trang trước 30s → Cancel timer → Không tăng view
```

Không cần thay đổi database hay các file khác.

