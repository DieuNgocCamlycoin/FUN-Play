

## Kích hoạt pipeline tự động thu nạp pplp_events từ hoạt động người dùng

### Vấn đề hiện tại
Hook `usePplpEventIngest` chỉ được gọi tại 1 nơi duy nhất (`PPLPRatingModal`). Các hành động chính (đăng bài, bình luận, like, upload video, check-in, donation) **không tạo pplp_events**, khiến `features_user_day`, `light_score`, và `mint-epoch-engine` không có dữ liệu để hoạt động.

### Giải pháp: Database Triggers (server-side)
Thay vì sửa từng component client-side (dễ bỏ sót, phụ thuộc UI), tạo **1 database function + nhiều triggers** tự động ghi `pplp_events` mỗi khi có INSERT vào các bảng hoạt động. Cách này đảm bảo 100% coverage bất kể hành động đến từ web, mobile, hay API.

### Chi tiết kỹ thuật

**1 migration** tạo:

1. **Function `auto_ingest_pplp_event()`** -- trigger function chung, nhận tham số `event_type` và `target_type`, tự tạo `ingest_hash` dedup theo minute-bucket (giống logic edge function hiện tại).

2. **7 triggers** trên các bảng:

| Bảng | Event Type | Target Type |
|------|-----------|-------------|
| `posts` | `POST_CREATED` | `post` |
| `comments` | `COMMENT_CREATED` | `comment` |
| `post_comments` | `COMMENT_CREATED` | `post_comment` |
| `videos` | `VIDEO_UPLOADED` | `video` |
| `likes` (where is_dislike=false) | `LIKE_GIVEN` | `video` |
| `post_likes` | `LIKE_GIVEN` | `post` |
| `daily_checkins` | `LIGHT_CHECKIN` | `checkin` |
| `donation_transactions` (where status='success') | `DONATION_MADE` | `donation` |

3. **Dedup logic**: Hash = `md5(user_id || event_type || target_id || minute_bucket)`, upsert với `ON CONFLICT (ingest_hash) DO NOTHING`.

4. **Backfill** (optional): Chạy 1 lần `backfill_pplp_events()` để nạp dữ liệu lịch sử từ các bảng hiện có vào `pplp_events`.

### Phạm vi thay đổi
- **1 database migration**: tạo function + triggers
- **0 file frontend thay đổi** -- hoàn toàn server-side

### Lợi ích
- Mọi hành động đều tự động được ghi nhận, không phụ thuộc client
- `build-features` edge function và `mint-epoch-engine` sẽ có dữ liệu ngay lập tức
- Dedup tích hợp sẵn, tránh tính điểm trùng

