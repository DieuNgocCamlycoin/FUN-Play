
Mục tiêu: xử lý dứt điểm việc livestream kết thúc nhưng không tạo được VOD.

1) Kết luận sau khi rà soát hiện trạng
- `livestreams` đã chuyển `status='ended'` đúng, nhưng tất cả `vod_video_id` vẫn `null`.
- Không có object mới trong bucket `videos` theo prefix `{user_id}/vod/...`.
- Không có video row mới cho user trong bảng `videos`.
- Suy ra lỗi đang xảy ra trước khi link `vod_video_id` (ở khâu ghi recorder hoặc upload), không phải chỉ ở UI tab Livestream.

2) Kế hoạch fix triệt để (code + backend)
- File chính: `src/pages/GoLive.tsx`
- File phụ: `src/hooks/useMediaRecorder.ts`
- Bổ sung 1 hàm backend transaction (migration + RPC) để đảm bảo insert video + link livestream là nguyên tử.

3) Thay đổi cụ thể cần triển khai
- A. Chặn “live không ghi” ngay từ đầu
  - Khi bấm “Bắt đầu phát sóng”, bắt buộc có stream + recorder start thành công.
  - Nếu recorder không start được: báo lỗi rõ ràng và không chuyển sang phase live (tránh ended stream không có VOD).
  - Nếu user muốn vẫn live không VOD thì hiển thị xác nhận rõ (tùy chọn fallback).

- B. Gia cố recorder cho đa trình duyệt
  - Mở rộng MIME fallback: `video/webm;codecs=vp8,opus` → `video/webm` → `video/mp4` (nếu hỗ trợ).
  - Lưu `actualMimeType` khi start để stop tạo Blob đúng type, đúng extension.
  - Trước `stop()`, gọi `requestData()` + timeout bảo vệ để tránh blob rỗng/silent fail.
  - Trả lỗi có mã nguyên nhân (unsupported mime / inactive recorder / empty blob).

- C. Upload VOD theo luồng ổn định
  - Thay upload trực tiếp storage bằng luồng upload đã ổn định của app (`useR2Upload`) để tăng độ bền với file lớn và lỗi mạng.
  - Đặt path chuẩn: `{user_id}/vod/{livestream_id}.{ext}`.
  - Retry upload 1 lần tự động; nếu vẫn fail thì báo lỗi rõ + cho phép tải blob về máy để tránh mất dữ liệu.

- D. Gộp “tạo video + link livestream” thành transaction backend
  - Tạo RPC `finalize_livestream_vod(...)`:
    - verify owner livestream
    - lấy channel của user
    - insert row vào `videos` (approval_status phù hợp)
    - update `livestreams.vod_video_id`
    - trả về `video_id`
  - Lợi ích: tránh trạng thái nửa vời (đã upload nhưng chưa link).

- E. Thông báo & quan sát lỗi rõ ràng
  - Toast phân bước: “Đang đóng bản ghi”, “Đang upload”, “Đang tạo VOD”, “Hoàn tất”.
  - Log chuẩn hóa theo step để lần sau nhìn phát biết hỏng ở đâu.
  - Không hiện “Bản ghi đã được lưu” nếu chưa hoàn tất toàn bộ pipeline.

4) Luồng mới sau khi sửa
````text
Start Live
  -> validate stream + recorder started
  -> livestream running (isRecording=true)
End Live
  -> flush + stop recorder -> blob
  -> upload blob (retry)
  -> RPC finalize_livestream_vod (insert video + link vod_video_id)
  -> success toast + điều hướng
````

5) Kiểm thử end-to-end bắt buộc sau fix
- Case 1 (chuẩn): live 1-3 phút → end bằng nút “Kết thúc” → có object VOD + có row video + `vod_video_id != null` + click được từ tab Livestream.
- Case 2 (mạng chập chờn): xác nhận retry hoạt động, không silent fail.
- Case 3 (trình duyệt không hỗ trợ recorder): app báo rõ và không vào live (hoặc buộc xác nhận “live không VOD” nếu bật fallback).
- Case 4 (stream cũ đã ended nhưng không có file): hiển thị trạng thái “Không có bản ghi” (không thể khôi phục nếu blob đã mất).

6) Technical details (cho dev review nhanh)
- RLS storage hiện đúng với prefix user_id; vấn đề còn lại là độ ổn định của recorder/upload và tính nguyên tử khi finalize.
- Sửa triệt để theo 3 lớp: (1) recorder reliability, (2) resilient upload, (3) transactional finalize.
- Không sửa file auto-generated (`src/integrations/supabase/client.ts`, `types.ts`).
