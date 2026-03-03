

## Kết quả kiểm tra

### Dữ liệu hiện tại trong database

| Livestream | Status | vod_video_id | Thời gian |
|---|---|---|---|
| test 6 | ended | **null** | 4 phút trước |
| test 4 | ended | **null** | 40 phút trước |
| test live 3 | ended | **null** | ~1 giờ trước |
| test live 2 | ended | **null** | ~1 giờ trước |
| test live | ended | **null** | ~2 giờ trước |

### Storage bucket `videos`
- **Không có file VOD nào** trong bucket. Không có object nào theo pattern `{user_id}/vod/...`.
- Chỉ có các video upload thông thường (từ tháng 12/2025 - tháng 1/2026).

### Database bảng `videos`
- Không có row VOD nào được tạo cho user này gần đây.

### Kết luận: vấn đề nằm ở đâu?
- RPC `finalize_livestream_vod` tồn tại và logic đúng (SECURITY DEFINER, insert + update atomic).
- Storage RLS policy đúng (path bắt đầu bằng `user_id`).
- Code `GoLive.tsx` logic đúng cấu trúc.

**Root cause thực sự**: MediaRecorder không sản xuất được blob hợp lệ. Toàn bộ pipeline phía sau (upload → RPC) không bao giờ được gọi vì blob = null hoặc < 1000 bytes. Điều này xảy ra vì:

1. **Stream bị clone/thay đổi khi WebRTC bắt đầu**: `startStreaming()` thiết lập WebRTC peers và có thể modify tracks trên stream gốc. MediaRecorder đang ghi từ stream mà tracks có thể bị thay đổi.
2. **Không có defensive logging đủ** để phát hiện lỗi ở production (console.log bị ẩn trên published URL).

### Kế hoạch fix

1. **Clone stream trước khi ghi** - Tạo một bản clone của `localStream` riêng cho MediaRecorder để tránh WebRTC can thiệp vào tracks:
   ```
   const recordingStream = localStream.clone();
   startRecording(recordingStream);
   ```

2. **Dọn recording stream khi kết thúc** - Sau khi `stopRecording`, stop các tracks của cloned stream.

3. **Thêm guard chắc chắn hơn**: Kiểm tra stream tracks active trước khi bắt đầu recording, log chi tiết track states.

4. **Fallback nếu blob quá nhỏ**: Nếu blob < 1KB sau khi stop, thử chờ thêm 2 giây rồi tạo blob từ chunks có sẵn.

### Files cần sửa
- `src/pages/GoLive.tsx` - Clone stream cho recorder, thêm logging
- `src/hooks/useMediaRecorder.ts` - Thêm track validation, chunk monitoring

