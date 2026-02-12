

# Sửa lỗi nút Like + Phân loại video

## Lỗi tìm thấy

### 1. Nút Like trên PostCard KHÔNG hoạt động (lỗi chính)
**File: `src/components/Profile/PostCard.tsx`**

Nút Like chỉ thay đổi giao dien nhưng KHÔNG ghi vao database. Code hiện tại:
```text
const handleLike = async () => {
  // Optimistic update only - no database call!
  setIsLiked(!isLiked);
  setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  // TODO: Implement actual like functionality  <-- Bug ở đây
};
```

Trong khi hook `usePostLike` đã tồn tại và hoạt động đúng (ghi vào bảng `post_likes`, có trigger tự cập nhật `like_count` trên bảng `posts`). PostCard không dùng hook này.

**Sửa**: Thay thế logic like thủ công bằng `usePostLike` hook.

### 2. Ngưỡng phân loại video: dùng `<` thay vì `<=`
**File: `src/pages/Upload.tsx` (dòng 486) và `src/contexts/UploadContext.tsx` (dòng 314)**

Code hiện tại: `videoDuration < 180` -- video đúng 180 giây sẽ bị phân loại LONG (sai).
Chuẩn: Video <= 180s là SHORT, > 180s là LONG.

**Sửa**: Đổi `<` thành `<=`.

### 3. Các tính năng đã hoạt động tốt
- **moderate-content**: Edge function hoạt động, logs cho thấy boot + shutdown bình thường
- **award-camly**: Auto-approve hoạt động đúng (logs: "AutoApproved: true")
- **Duration extraction**: Desktop upload đã có code trích xuất duration từ HTML5 Video API
- **backfill-video-duration**: Edge function đã deploy

## Thay đổi cụ thể

### File 1: `src/components/Profile/PostCard.tsx`
- Import `usePostLike` hook
- Xóa state thủ công `isLiked`, `likeCount`
- Thay `handleLike` bằng `toggleLike` từ hook
- Hook tự động: kiểm tra trạng thái like, optimistic update, ghi database, có trigger cập nhật `like_count`

### File 2: `src/pages/Upload.tsx` (dòng 486)
- Đổi `videoDuration < SHORT_VIDEO_MAX_DURATION` thành `videoDuration <= SHORT_VIDEO_MAX_DURATION`

### File 3: `src/contexts/UploadContext.tsx` (dòng 314)
- Đổi `effectiveDuration < SHORT_VIDEO_MAX_DURATION` thành `effectiveDuration <= SHORT_VIDEO_MAX_DURATION`

## Tóm tắt
| File | Thay đổi |
|------|----------|
| `src/components/Profile/PostCard.tsx` | Dùng `usePostLike` hook thay logic like hỏng |
| `src/pages/Upload.tsx` | Sửa ngưỡng `<` thành `<=` (dòng 486) |
| `src/contexts/UploadContext.tsx` | Sửa ngưỡng `<` thành `<=` (dòng 314) |

