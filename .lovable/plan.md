
# Triển khai cache username→user_id trong Edge Function prerender

## Vấn đề hiện tại

Edge Function `prerender` chỉ xử lý các URL cũ (`/watch/:id`, `/channel/:id`, `/music/:id`). Trong khi đó, `ShareModal` đã gửi clean URL dạng `/:username/:slug` cho video — nhưng prerender không parse được, dẫn đến trả về meta mặc định thay vì meta riêng của nội dung.

## Giải pháp

Cập nhật `supabase/functions/prerender/index.ts` để:

1. **Nhận diện clean URL patterns mới**:
   - `/:username/video/:slug` hoặc `/:username/:slug` (video)
   - `/:username/post/:slug` (bài đăng)
   - `/:username` (trang profile/channel)

2. **Cache username to user_id** bằng in-memory Map (module-level) với TTL 10 phút — tránh query `profiles` mỗi lần request:
   ```text
   Map<username, { user_id, expires_at }>
   ```

3. **Resolve nội dung qua slug** thay vì ID:
   - Video: query `videos` theo `(user_id, slug)`, fallback check `video_slug_history`
   - Post: query `posts` theo `(user_id, slug)`, fallback check `post_slug_history`
   - Profile: query `profiles` + `channels` theo username

4. **Hỗ trợ 301 redirect cho slug cũ**: Nếu tìm thấy trong `*_slug_history`, trả về HTML với `<meta http-equiv="refresh">` trỏ đến slug mới.

## Chi tiết kỹ thuật

### File thay đổi: `supabase/functions/prerender/index.ts`

**A. Thêm cache module-level:**
```typescript
const usernameCache = new Map<string, { userId: string; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 phút

async function resolveUsername(supabase, username: string): Promise<string | null> {
  const cached = usernameCache.get(username);
  if (cached && cached.expiresAt > Date.now()) return cached.userId;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (data) {
    usernameCache.set(username, { userId: data.id, expiresAt: Date.now() + CACHE_TTL });
    return data.id;
  }

  // Fallback: previous_username
  const { data: prev } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("previous_username", username)
    .single();

  if (prev) {
    usernameCache.set(username, { userId: prev.id, expiresAt: Date.now() + CACHE_TTL });
    return prev.id;
  }
  return null;
}
```

**B. Mở rộng path parsing** để nhận diện các pattern mới bên cạnh các pattern cũ (giữ nguyên backward compatibility):

| Pattern | Type | Resolve |
|---------|------|---------|
| `/:username/video/:slug` | video-by-slug | username + slug |
| `/:username/post/:slug` | post-by-slug | username + slug |
| `/:username/:slug` | video-by-slug (fallback) | username + slug |
| `/:username` | channel-by-username | username |

**C. Thêm logic query cho các type mới:**
- **video-by-slug**: `videos` WHERE `user_id` + `slug`, fallback `video_slug_history`
- **post-by-slug**: `posts` WHERE `user_id` + `slug`, fallback `post_slug_history`
- **channel-by-username**: `profiles` JOIN `channels` WHERE `username`

**D. Giữ nguyên** tất cả logic cũ (`/watch/:id`, `/music/:id`, `/ai-music/:id`, `/channel/:id`) để không ảnh hưởng link đã chia sẻ trước đó.

## Kết quả

- Link chia sẻ dạng `/:username/video/:slug` sẽ hiển thị đúng thumbnail, title, description trên mạng xã hội
- Giảm số lần query database nhờ cache username (10 phút TTL)
- Hỗ trợ redirect khi slug/username đã thay đổi
- Backward compatible 100% với link cũ
