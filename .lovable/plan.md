

## Sửa lỗi không hiển thị playlist sau khi tạo

### Nguyên nhân gốc

Trong `ProfilePlaylistsTab.tsx`, query Supabase sử dụng cú pháp không hợp lệ:

```
playlist_videos(count, videos(thumbnail_url))
```

Supabase không cho phép kết hợp `count` (aggregate) với `videos(thumbnail_url)` (join) trong cùng một relation. Query này lỗi thầm lặng, rơi vào `catch` block và không cập nhật state `playlists` --> luôn hiển thị "Chưa có Playlist".

### Giải pháp

Sửa file `src/components/Profile/ProfilePlaylistsTab.tsx`:

**1. Tách query thành 2 phần** (dòng 36-66):
- Query chính: lấy `id, name, description, is_public` từ `playlists`
- Lấy video count và thumbnail riêng, hoặc dùng 2 subselect riêng biệt

Cụ thể, đổi select thành:
```
id, name, description, is_public, playlist_videos(video_id, videos(thumbnail_url))
```
Sau đó tính `video_count` bằng `p.playlist_videos?.length || 0` thay vì dùng `count`.

**2. Cập nhật processing** (dòng 59-66):
```typescript
video_count: p.playlist_videos?.length || 0,
thumbnail_url: p.playlist_videos?.[0]?.videos?.thumbnail_url,
```

### Tóm tắt

| File | Thay đổi |
|---|---|
| `src/components/Profile/ProfilePlaylistsTab.tsx` | Sửa query select: bỏ `count`, dùng `video_id` + đếm bằng `.length` |
