

## Ẩn video/bài viết của user bị suspend khỏi mọi feed công khai

### Mô tả
Video và bài viết của user bị suspend (banned) sẽ không còn xuất hiện trong Home feed, Search, Shorts, Subscriptions, Liked Videos, Meditate, gợi ý tìm kiếm, và đề xuất video. Nội dung chỉ còn hiển thị duy nhất trên kênh cá nhân của user đó.

### Cách tiếp cận

Tạo một hook chung `useBannedUserIds` để cache danh sách user_id bị banned, sau đó dùng nó để lọc kết quả ở phía client trong mỗi trang feed. Cách này tránh sửa nhiều query phức tạp và tập trung logic lọc vào một nơi.

### Các file cần thay đổi

| File | Thay đổi |
|---|---|
| `src/hooks/useBannedUserIds.ts` | **Tạo mới** - Hook cache danh sách banned user IDs, query `profiles` where `banned = true`, chỉ lấy `id`, cache 5 phút |
| `src/pages/Index.tsx` | Import hook, lọc `videos.filter(v => !bannedIds.has(v.user_id))` sau khi fetch |
| `src/pages/Search.tsx` | Lọc kết quả search video, loại bỏ video từ banned users |
| `src/pages/Shorts.tsx` | Lọc shorts, loại bỏ video từ banned users |
| `src/pages/Subscriptions.tsx` | Lọc video subscriptions, loại bỏ video từ banned users |
| `src/pages/LikedVideos.tsx` | Lọc liked videos, loại bỏ video từ banned users |
| `src/pages/Meditate.tsx` | Lọc meditation videos, loại bỏ video từ banned users |
| `src/hooks/useSearchSuggestions.ts` | Lọc gợi ý tìm kiếm, loại bỏ video từ banned users |
| `src/contexts/VideoPlaybackContext.tsx` | Lọc video đề xuất, loại bỏ video từ banned users |

### Chi tiết kỹ thuật

**Hook `useBannedUserIds`**:
- Sử dụng `useQuery` với `queryKey: ["banned-user-ids"]`
- Query: `supabase.from("profiles").select("id").eq("banned", true)`
- Return: `Set<string>` chứa các user_id bị banned
- `staleTime: 5 * 60 * 1000` (cache 5 phút)
- Có thể dùng trực tiếp trong component hoặc truyền vào async function

**Đối với các trang dùng `useQuery`** (Shorts): lọc trong queryFn trước khi return.

**Đối với các trang dùng state** (Index, Search, LikedVideos, Meditate, Subscriptions): fetch banned IDs rồi filter trước khi setState.

**Đối với VideoPlaybackContext**: fetch banned IDs và filter candidates trước khi build danh sách đề xuất.

**Đối với useSearchSuggestions**: fetch banned IDs và filter video suggestions trước khi hiển thị.

### Lưu ý
- `ProfileVideosTab.tsx` (kênh cá nhân) sẽ KHÔNG bị lọc - đây là nơi duy nhất vẫn hiển thị nội dung của user bị suspend
- Admin tabs cũng KHÔNG bị ảnh hưởng
