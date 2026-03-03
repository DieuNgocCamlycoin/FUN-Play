

## Kế hoạch: Hiển thị danh sách Livestream đã kết thúc trong tab Livestream trên Profile

### Vấn đề hiện tại
Tab "Livestream" trên trang profile đang hiển thị placeholder tĩnh "Chưa có Livestream - Tính năng Livestream sẽ sớm ra mắt! 🎥". Cần thay thế bằng danh sách các buổi livestream đã kết thúc (có VOD) của user/channel đó.

### Kế hoạch thực hiện

**1. Tạo component `ProfileLivestreamTab`** (`src/components/Profile/ProfileLivestreamTab.tsx`)
- Query bảng `livestreams` với `status = 'ended'`, filter theo `user_id`
- Join với bảng `videos` qua `vod_video_id` để lấy `video_url` nếu có
- Hiển thị dạng grid card tương tự tab Video, mỗi card gồm:
  - Thumbnail (từ `thumbnail_url` của livestream)
  - Tiêu đề livestream
  - Thời gian phát sóng (`started_at` → `ended_at`)
  - Peak viewers, total donations
  - Badge "Có VOD" nếu `vod_video_id` không null → click vào sẽ navigate đến video VOD
  - Badge "LIVE" đỏ nếu status vẫn là `live`
- Empty state giữ lại icon Radio + text "Chưa có Livestream nào"

**2. Cập nhật `ProfileTabs.tsx`**
- Import `ProfileLivestreamTab`
- Thay thế placeholder tĩnh trong `TabsContent value="livestream"` bằng `<ProfileLivestreamTab userId={userId} />`

### Chi tiết kỹ thuật
- Query: `supabase.from("livestreams").select("*, videos(id, video_url, thumbnail_url)").eq("user_id", userId).in("status", ["ended", "live"]).order("created_at", { ascending: false })`
- Click vào card có VOD → navigate đến `/video/{vod_video_id}`
- Click vào card đang live → navigate đến `/live/{livestream_id}`
- Không cần migration database, chỉ thay đổi frontend

