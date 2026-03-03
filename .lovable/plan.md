
Mục tiêu: tìm nguyên nhân VOD không được lưu sau khi kết thúc livestream và triển khai fix để video xem lại luôn được tạo + bấm vào được.

1) Kết luận sau khi kiểm tra
- Hai livestream bạn vừa test (`test live`, `test live 2`) đều có `status='ended'` nhưng `vod_video_id = null`.
- Bucket `videos` hiện không có object nào theo prefix `vod/...`.
- Policy upload của bucket `videos` yêu cầu thư mục đầu tiên của file path phải là `auth.uid()`:
  - `auth.uid()::text = (storage.foldername(name))[1]`
- Logic hiện tại đang upload bằng path `vod/{userId}/{livestreamId}.webm` (thư mục đầu tiên là `vod`) nên bị chặn bởi RLS => upload fail => không tạo bản ghi trong `videos` => không có `vod_video_id`.

2) Kế hoạch sửa lỗi (code)
- File chính: `src/pages/GoLive.tsx`
- Đổi đường dẫn upload VOD từ:
  - `vod/${user.id}/${livestreamId}.webm`
  thành:
  - `${user.id}/vod/${livestreamId}.webm`
- Giữ nguyên bucket `videos` (không cần migration DB).

3) Gia cố logic để tránh “fail im lặng”
- Trong `handleEndLive`, tách rõ từng bước và kiểm tra lỗi từng bước:
  1. stopRecording
  2. upload file storage
  3. insert row vào `videos`
  4. update `livestreams.vod_video_id`
- Nếu bước nào lỗi thì log chi tiết + toast rõ nguyên nhân (upload lỗi, thiếu channel, insert lỗi, update link lỗi), để lần sau dễ debug.
- Chỉ hiển thị “Bản ghi đã được lưu!” khi cả 4 bước thành công.

4) Kiểm thử end-to-end sau khi sửa
```text
Go Live -> Bắt đầu live -> Kết thúc live
  -> kiểm tra storage có file: {user_id}/vod/{livestream_id}.webm
  -> kiểm tra livestreams.vod_video_id != null
  -> mở tab Profile > Livestream
  -> bấm card VOD mở đúng trang video
```

5) Technical details (để dev review nhanh)
- Root cause là mismatch giữa upload path và RLS policy của `storage.objects` cho bucket `videos`.
- Không cần đổi schema/policy; chỉ cần sửa naming convention path theo policy hiện tại.
- Fix này tương thích với route hiện tại vì `ProfileLivestreamTab` đã dùng `goToVideo(vod_video_id)` để resolve URL chuẩn `/:username/video/:slug`.
