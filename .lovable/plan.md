

# Kế Hoạch: Thêm Chức Năng Like/Unlike cho Bình Luận Bài Đăng

## Tổng Quan

Thêm tính năng like/unlike cho các bình luận bài đăng với:
- Optimistic UI (cập nhật giao diện ngay lập tức)
- Theo dõi trong database
- Hiển thị số lượt thích
- Nút like với animation

---

## Phần 1: Thiết Kế Database

### Tạo Bảng `post_comment_likes`

Tạo bảng mới riêng biệt để lưu trữ lượt thích cho bình luận bài đăng (tách khỏi bảng `likes` hiện tại dành cho video).

**Schema:**

| Cột | Kiểu | Nullable | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| id | uuid | NO | gen_random_uuid() | Khóa chính |
| comment_id | uuid | NO | - | FK đến post_comments(id) ON DELETE CASCADE |
| user_id | uuid | NO | - | Người thích |
| created_at | timestamptz | NO | now() | Thời gian thích |

**Constraints:**
- UNIQUE (comment_id, user_id) - Mỗi user chỉ được like 1 lần cho mỗi comment

**Index:**
- `idx_post_comment_likes_comment_id` - Đếm like nhanh theo comment
- `idx_post_comment_likes_user_id` - Tìm các comment user đã like

---

## Phần 2: Row Level Security (RLS)

| Hành động | Quy tắc |
|-----------|---------|
| **SELECT** | Mọi người có thể xem ai đã like |
| **INSERT** | User chỉ được tạo like cho chính mình (`auth.uid() = user_id`) |
| **DELETE** | User chỉ được xóa like của mình (`auth.uid() = user_id`) |

---

## Phần 3: Cập Nhật Hook `usePostComments`

### Thêm State và Functions

```typescript
interface UsePostCommentsReturn {
  // ... existing
  likedCommentIds: Set<string>;    // Set các comment ID user đã like
  toggleLike: (commentId: string) => Promise<void>;
}
```

### Logic Toggle Like

1. **Check Like Status**: Khi fetch comments, cũng fetch các like của user hiện tại
2. **Toggle Like**: 
   - Nếu chưa like → INSERT vào `post_comment_likes` + UPDATE `like_count` tăng 1
   - Nếu đã like → DELETE khỏi `post_comment_likes` + UPDATE `like_count` giảm 1
3. **Optimistic UI**: Cập nhật UI ngay trước khi gọi API

---

## Phần 4: Cập Nhật Components

### 4.1. `PostCommentItem` - Thêm Nút Like

**UI Changes:**
- Thêm nút Heart/ThumbsUp trước nút "Trả lời"
- Hiển thị số lượt thích bên cạnh icon
- Icon đổi màu khi đã like (filled vs outline)
- Animation nhỏ khi click

**Props mới:**
```typescript
interface PostCommentItemProps {
  // ... existing
  isLiked: boolean;
  onToggleLike: (commentId: string) => Promise<void>;
}
```

### 4.2. `PostCommentList` - Truyền Like Props

Nhận `likedCommentIds` và `onToggleLike` từ parent, truyền xuống từng `PostCommentItem`.

### 4.3. `PostComments` - Container

Lấy `likedCommentIds` và `toggleLike` từ hook, truyền xuống `PostCommentList`.

---

## Phần 5: Flow Người Dùng

### Flow Like Bình Luận
```text
User bấm nút ❤️ trên comment
    ↓
Optimistic: Icon đổi màu + số like +1
    ↓
INSERT vào post_comment_likes
    ↓
UPDATE post_comments SET like_count = like_count + 1
    ↓
Thành công → Giữ nguyên
Thất bại → Rollback UI + hiện lỗi
```

### Flow Unlike Bình Luận
```text
User bấm nút ❤️ (đang đỏ) trên comment
    ↓
Optimistic: Icon đổi outline + số like -1
    ↓
DELETE khỏi post_comment_likes
    ↓
UPDATE post_comments SET like_count = like_count - 1
    ↓
Thành công → Giữ nguyên
Thất bại → Rollback UI
```

---

## Phần 6: UI/UX

### Thiết Kế Nút Like

```text
┌─────────────────────────────────────────────┐
│ 👤 Tên người dùng • 3 phút trước           │
│ Nội dung bình luận ở đây...                 │
│                                             │
│ [♡ 12]  [↩️ Trả lời]  [🗑️ Xóa]             │
│    ↑                                        │
│   Icon thay đổi: ♡ (chưa like) → ❤️ (đã like)│
└─────────────────────────────────────────────┘
```

### States

| Trạng thái | Hiển thị |
|------------|----------|
| Chưa like | Icon outline (Heart), số mờ |
| Đã like | Icon filled đỏ (❤️), số sáng |
| Đang xử lý | Disabled, opacity giảm |
| Chưa đăng nhập | Redirect đến /auth khi click |

### Animation
- Scale nhỏ khi click (0.9 → 1.1 → 1)
- Transition màu mượt (150ms)

---

## Phần 7: Files Cần Thay Đổi

### Database Migration (Mới)

| Thay đổi | Mô tả |
|----------|-------|
| CREATE TABLE post_comment_likes | Bảng lưu lượt thích |
| CREATE UNIQUE INDEX | Đảm bảo 1 user = 1 like/comment |
| CREATE INDEXES | Performance indexes |
| ENABLE RLS | Bảo mật |
| CREATE POLICIES | 3 policies (SELECT, INSERT, DELETE) |

### Files Sửa

| File | Thay đổi |
|------|----------|
| `src/hooks/usePostComments.ts` | Thêm `likedCommentIds`, `toggleLike`, fetch like status |
| `src/components/Post/PostCommentItem.tsx` | Thêm nút Like với animation |
| `src/components/Post/PostCommentList.tsx` | Truyền like props |
| `src/components/Post/PostComments.tsx` | Lấy và truyền like state |

---

## Phần 8: Bảo Mật & Chất Lượng

### Validation
- Chỉ user đã đăng nhập mới được like
- Không thể like comment đã bị xóa
- Rate limiting tự nhiên qua unique constraint

### Error Handling
- Optimistic rollback khi API fail
- Toast thông báo lỗi user-friendly
- Không cho like khi đang pending

### Type Safety
- TypeScript interfaces cho like data
- Proper null checks
- Type guards cho API responses

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

1. **Database**: Bảng `post_comment_likes` với RLS đầy đủ
2. **UI**: Nút like với animation mượt mà
3. **UX**: 
   - Like/unlike tức thì với optimistic UI
   - Hiển thị số lượt thích real-time
   - Feedback trực quan khi thao tác
4. **Security**: RLS đảm bảo user chỉ thao tác được like của mình

