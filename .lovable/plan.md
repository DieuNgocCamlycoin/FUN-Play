

# Thêm fallback avatar cho og:image trong Edge Function prerender

## Tổng quan
Khi chia sẻ link mà nội dung không có thumbnail/ảnh, hệ thống sẽ dùng avatar của tác giả thay vì ảnh mặc định FUN Play. Thay đổi chỉ ảnh hưởng logic chọn ảnh, **không** thay đổi cấu trúc URL hay bất kỳ tính năng nào khác.

## Chuỗi fallback ảnh

```text
og:image = thumbnail/ảnh nội dung → avatar tác giả → ảnh mặc định FUN Play
```

## Chi tiết thay đổi

**File duy nhất**: `supabase/functions/prerender/index.ts`

### 1. Legacy video/music by ID (dòng 236-259)
- Sau khi query video, thêm 1 query phụ lấy `avatar_url` từ `profiles` theo `video.user_id`
- Thay `meta.image = data.thumbnail_url || meta.image` thành `meta.image = data.thumbnail_url || avatarUrl || meta.image`
- Cần thêm `user_id` vào select của video query

### 2. Video by slug (dòng 294-309)
- Đã có `resolved.userId` sẵn, chỉ cần query `profiles.avatar_url` theo userId
- Thay `meta.image = video.thumbnail_url || meta.image` thành `meta.image = video.thumbnail_url || avatarUrl || meta.image`

### 3. Post by slug (dòng 353-367)
- Tương tự, dùng `resolved.userId` để lấy `avatar_url`
- Thay logic chọn ảnh: `firstImage || avatarUrl || meta.image`

### 4. AI Music (dòng 218-233)
- Thêm query `profiles.avatar_url` theo `data.user_id`
- Fallback: `thumbnail_url || avatarUrl || meta.image`

### Cách tối ưu
Với video-by-slug và post-by-slug, `resolveUsername` đã resolve `userId` rồi nên chỉ cần 1 query thêm cho avatar. Với legacy routes, cần query thêm avatar sau khi có video data (dùng `user_id` từ video).

## Kết quả
- Link video không có thumbnail -> hiện avatar tác giả trên MXH
- Link bài đăng không có ảnh -> hiện avatar tác giả
- Link có thumbnail/ảnh -> giữ nguyên như cũ
- Backward compatible 100%, không thay đổi URL

