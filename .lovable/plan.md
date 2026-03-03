

## Sửa lỗi link livestream đã kết thúc không mở được

**Nguyên nhân**: Dòng 35 navigate đến `/video/${ls.vod_video_id}` — route này không tồn tại. Hệ thống dùng format `/:username/video/:slug`.

**Cách sửa** (1 file: `ProfileLivestreamTab.tsx`):
- Import `useVideoNavigation` từ `@/lib/videoNavigation`
- Thay `navigate` bằng `goToVideo(ls.vod_video_id)` cho livestream đã kết thúc có VOD
- Giữ nguyên `navigate('/live/${ls.id}')` cho livestream đang live

