
Mục tiêu: sửa triệt để lỗi VOD không được lưu sau khi kết thúc livestream, để stream ended luôn có thể xem lại.

1) Kết luận kiểm tra (đã xác nhận)
- `videos` bucket đang dùng policy upload đúng chuẩn: thư mục đầu tiên phải là `auth.uid()` (`(storage.foldername(name))[1]`).
- `GoLive.tsx` hiện đã đổi path upload sang `${user.id}/vod/${livestreamId}.webm` (đúng policy).
- Nhưng còn một lỗi chặn tạo VOD record:
  - Code insert vào `public.videos` đang gửi `status: "published"`.
  - Bảng `public.videos` hiện không có cột `status` (chỉ có `approval_status`).
  - Hệ quả: upload có thể thành công nhưng insert video fail => `livestreams.vod_video_id` vẫn null => không bấm xem lại được.

2) Kế hoạch fix code
- File chính: `src/pages/GoLive.tsx`
- Chỉnh block insert vào `videos`:
  - Bỏ field `status`.
  - Dùng field hợp lệ theo schema hiện tại (ví dụ `approval_status: "approved"` nếu muốn VOD xuất hiện như video đã publish; hoặc bỏ để dùng default).
  - Giữ `title`, `user_id`, `channel_id`, `video_url`.
- Giữ nguyên path upload `${user.id}/vod/${livestreamId}.webm` (không đổi DB policy).

3) Gia cố để tránh lỗi im lặng
- Trong `handleEndLive`, giữ flow 4 bước rõ ràng:
  1. stop recording
  2. upload storage
  3. insert video row
  4. link `livestreams.vod_video_id`
- Nếu bước 3/4 lỗi:
  - log rõ lỗi và toast rõ nguyên nhân.
  - không báo “Bản ghi đã được lưu!” khi chưa link thành công.
- (Khuyến nghị) Nếu upload xong nhưng insert fail, thử cleanup object vừa upload để tránh file mồ côi.

4) Gia cố recorder để giảm mất VOD
- File phụ: `src/hooks/useMediaRecorder.ts` (hoặc xử lý ở `GoLive.tsx`)
- Bọc `startRecording()` trong try/catch:
  - Nếu browser không hỗ trợ MediaRecorder/mime hiện tại, vẫn cho live chạy nhưng thông báo “live không ghi được VOD”.
- `stopRecording()` trả về null thì hiển thị cảnh báo rõ ràng để user biết lý do không có replay.

5) Kiểm thử end-to-end sau fix
```text
Go Live -> Bắt đầu live (>=10s) -> Kết thúc
  -> kiểm tra storage có file: {user_id}/vod/{livestream_id}.webm
  -> kiểm tra public.videos có row mới (không lỗi cột status)
  -> kiểm tra livestreams.vod_video_id != null
  -> mở Profile > Livestream
  -> bấm card VOD mở đúng trang video
```

6) Technical details (dev review nhanh)
- Root cause hiện tại không còn ở path upload (đã đúng policy), mà nằm ở payload insert sai schema (`status` field không tồn tại).
- Không cần migration database để fix lỗi chính; chỉ cần sửa payload insert + xử lý lỗi tốt hơn.
- Các livestream cũ đã ended nhưng không có file VOD trong storage sẽ không thể phục hồi replay; cần tạo stream mới để verify fix.
