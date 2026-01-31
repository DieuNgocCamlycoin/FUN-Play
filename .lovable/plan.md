

# Kế Hoạch: Xây Dựng Hệ Thống Bình Luận Cho Bài Đăng (Posts)

## Tổng Quan

Xây dựng hệ thống bình luận hoàn chỉnh cho bài đăng (posts) với các tính năng:
- Bình luận gốc (root comments)
- Trả lời bình luận (1 cấp lồng nhau)
- Soft delete (xóa mềm - giữ dữ liệu nhưng ẩn đi)
- Phân quyền dựa trên xác thực
- Cập nhật realtime
- Optimistic UI

---

## Phần 1: Thiết Kế Cơ Sở Dữ Liệu

### Tạo Bảng `post_comments`

Sẽ tạo bảng mới `post_comments` riêng biệt với bảng `comments` hiện tại (dành cho video) để tránh xung đột và dễ quản lý.

**Schema:**

| Cột | Kiểu | Nullable | Mặc định | Mô tả |
|-----|------|----------|----------|-------|
| id | uuid | NO | gen_random_uuid() | Khóa chính |
| post_id | uuid | NO | - | Liên kết đến posts(id) ON DELETE CASCADE |
| user_id | uuid | NO | - | Người bình luận |
| parent_id | uuid | YES | NULL | Bình luận cha (để trả lời) |
| content | text | NO | - | Nội dung bình luận |
| is_deleted | boolean | NO | false | Đánh dấu xóa mềm |
| like_count | integer | NO | 0 | Số lượt thích |
| created_at | timestamptz | NO | now() | Thời gian tạo |
| updated_at | timestamptz | NO | now() | Thời gian cập nhật |

**Indexes:**
- `idx_post_comments_post_id` - Tìm kiếm theo bài đăng
- `idx_post_comments_parent_id` - Tìm kiếm bình luận con
- `idx_post_comments_user_id` - Tìm kiếm theo người dùng
- `idx_post_comments_created_at` - Sắp xếp theo thời gian

---

## Phần 2: Row Level Security (RLS)

### Chính Sách Bảo Mật

| Hành động | Quy tắc |
|-----------|---------|
| **SELECT** | Mọi người có thể đọc bình luận chưa bị xóa (`is_deleted = false`) HOẶC chủ sở hữu thấy cả bình luận đã xóa của mình |
| **INSERT** | Chỉ người dùng đã xác thực mới được tạo bình luận (`auth.uid() = user_id`) |
| **UPDATE** | Chỉ chủ sở hữu được cập nhật nội dung (`auth.uid() = user_id`) |
| **DELETE** | Không cho phép xóa cứng - dùng soft delete qua UPDATE |

**Lưu ý bảo mật:**
- Không cho phép DELETE trực tiếp từ client
- Soft delete được thực hiện qua UPDATE (set `is_deleted = true`)
- Trigger tự động cập nhật `updated_at` khi có thay đổi

---

## Phần 3: Frontend Components

### 3.1. Component Structure

```text
src/components/Post/
├── PostComments.tsx          # Container chính cho bình luận
├── PostCommentList.tsx       # Danh sách bình luận với realtime
├── PostCommentItem.tsx       # Hiển thị 1 bình luận
├── PostCommentInput.tsx      # Ô nhập bình luận
└── PostCommentReplies.tsx    # Hiển thị các reply
```

### 3.2. `PostComments` - Component Chính

**Props:**
- `postId: string` - ID của bài đăng
- `onCommentCountChange?: (count: number) => void` - Callback khi số comment thay đổi

**Chức năng:**
- Fetch danh sách bình luận
- Subscribe realtime để nhận bình luận mới
- Render danh sách + form nhập

### 3.3. `PostCommentItem` - Hiển Thị Bình Luận

**Features:**
- Avatar người dùng (từ profiles)
- Tên hiển thị + username
- Nội dung bình luận
- Thời gian tương đối (vd: "3 phút trước")
- Nút "Trả lời" → mở form reply
- Nút "Xóa" (chỉ hiện cho chủ sở hữu)
- Hiển thị replies (indent nhẹ)
- Nếu `is_deleted = true` → hiện "Bình luận này đã bị xóa"

### 3.4. `PostCommentInput` - Ô Nhập Bình Luận

**Features:**
- Textarea với placeholder
- Validate: không cho phép bình luận trống
- Disabled nếu chưa đăng nhập
- Optimistic UI: hiển thị comment ngay khi submit
- Rollback nếu có lỗi

---

## Phần 4: Hook `usePostComments`

Tạo custom hook để quản lý logic bình luận:

```typescript
usePostComments(postId: string) {
  // State
  comments: PostComment[]
  loading: boolean
  submitting: boolean
  
  // Actions
  fetchComments()
  createComment(content, parentId?)
  softDeleteComment(commentId)
  
  // Realtime subscription
  subscribeToChanges()
}
```

---

## Phần 5: Trang Chi Tiết Bài Đăng (PostDetail)

### Tạo Route Mới

Thêm route `/post/:id` để xem chi tiết bài đăng kèm bình luận.

**Components:**
- Hiển thị nội dung bài đăng
- Hình ảnh (nếu có)
- Thông tin tác giả
- Section bình luận sử dụng `PostComments`

---

## Phần 6: Flow Người Dùng

### Flow 1: Xem Bình Luận
```text
User vào /post/:id
    ↓
Fetch post data + comments
    ↓
Subscribe realtime channel
    ↓
Render comments (root + replies)
```

### Flow 2: Đăng Bình Luận
```text
User nhập nội dung → Submit
    ↓
Optimistic: Hiển thị comment ngay
    ↓
Insert vào Supabase
    ↓
Thành công → Giữ nguyên
Thất bại → Rollback + hiện lỗi
```

### Flow 3: Trả Lời Bình Luận
```text
Bấm "Trả lời" trên comment
    ↓
Hiện form reply (parent_id = comment.id)
    ↓
Submit reply
    ↓
Reply hiển thị indent dưới comment cha
```

### Flow 4: Xóa Bình Luận (Soft Delete)
```text
Chủ sở hữu bấm "Xóa"
    ↓
Confirm dialog
    ↓
UPDATE is_deleted = true
    ↓
UI hiển thị "Bình luận này đã bị xóa"
```

---

## Phần 7: Realtime Updates

### Cấu Hình

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
```

### Subscribe Pattern

```typescript
supabase
  .channel(`post-comments-${postId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'post_comments',
    filter: `post_id=eq.${postId}`
  }, handleChange)
  .subscribe()
```

---

## Phần 8: Danh Sách Files Sẽ Tạo/Sửa

### Files Mới

| File | Mô tả |
|------|-------|
| `src/components/Post/PostComments.tsx` | Component container chính |
| `src/components/Post/PostCommentList.tsx` | Danh sách bình luận |
| `src/components/Post/PostCommentItem.tsx` | 1 item bình luận |
| `src/components/Post/PostCommentInput.tsx` | Form nhập bình luận |
| `src/hooks/usePostComments.ts` | Custom hook logic |
| `src/pages/PostDetail.tsx` | Trang chi tiết bài đăng |

### Files Sửa

| File | Thay đổi |
|------|----------|
| `src/App.tsx` | Thêm route `/post/:id` |

### Database Migration

| Thay đổi | Mô tả |
|----------|-------|
| CREATE TABLE post_comments | Bảng mới cho bình luận bài đăng |
| CREATE INDEXES | 4 indexes cho performance |
| ENABLE RLS | Bảo mật row-level |
| CREATE POLICIES | 3 policies (SELECT, INSERT, UPDATE) |
| CREATE TRIGGER | Auto update `updated_at` |
| ADD TO REALTIME | Enable realtime cho bảng |

---

## Phần 9: UI/UX Requirements

### Thiết Kế Giao Diện

- **Clean & Minimal**: Phù hợp style FUN Play hiện tại
- **Responsive**: Hoạt động tốt trên mobile và desktop
- **Dark mode compatible**: Hỗ trợ theme tối
- **Animations**: Sử dụng Framer Motion cho transitions

### Trạng Thái UI

| Trạng thái | Hiển thị |
|------------|----------|
| Loading | Skeleton placeholder |
| Empty | "Chưa có bình luận nào" + icon |
| Error | Toast thông báo lỗi |
| Deleted comment | "Bình luận này đã bị xóa" (text mờ) |
| Reply indent | Margin-left 48px |

---

## Phần 10: Bảo Mật & Chất Lượng

### Validation

- Không cho phép bình luận rỗng (trim + check length)
- Giới hạn độ dài tối đa: 1000 ký tự
- Sanitize content để tránh XSS (React tự xử lý)

### Error Handling

- Try-catch tất cả async operations
- Toast thông báo lỗi user-friendly
- Console log chi tiết cho debugging

### Type Safety

- TypeScript interfaces cho tất cả data types
- Strict null checks
- Proper type guards

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

1. **Database**: Bảng `post_comments` với RLS và realtime
2. **UI Components**: Bộ component modular, tái sử dụng
3. **User Experience**: 
   - Đăng bình luận với optimistic UI
   - Trả lời bình luận (1 cấp)
   - Xóa mềm với xác nhận
   - Realtime updates
4. **PostDetail Page**: Trang chi tiết xem bài đăng + bình luận

