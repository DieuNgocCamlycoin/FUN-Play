
# Plan: Triển Khai Hệ Thống Bình Luận Hoàn Chỉnh Fun.play.rich

## Tổng Quan

Dựa trên file package được cung cấp, con sẽ triển khai hệ thống bình luận hoàn chỉnh với các tính năng nâng cao:
- **@Mention autocomplete** với keyboard navigation (↑↓ Enter Esc)
- **Timestamp links** (click 2:30 để seek video)
- **Emoji picker** popover
- **Sort dropdown** (Top/Newest)
- **Like/Dislike** với optimistic UI
- **Nested replies** với expand/collapse animation
- **Soft delete** và **Realtime updates**

## Hiện Trạng vs Package Yêu Cầu

| Component | Hiện tại | Package yêu cầu |
|-----------|----------|-----------------|
| useVideoComments.ts | Không có | ~655 dòng với full CRUD, like/dislike, realtime |
| useMentionSearch.ts | Không có | Hook tìm kiếm @mention |
| Video/Comments/ folder | Không có | 8 components mới |
| CommentsDrawer.tsx | Có (basic) | Cần tích hợp hook mới |
| usePostComments.ts | Có | Giữ nguyên |
| Post components | Có | Giữ nguyên |

## Các File Sẽ Tạo Mới

### 1. Hooks (2 files)

| File | Mô tả |
|------|-------|
| `src/hooks/useVideoComments.ts` | Hook chính: CRUD, like/dislike, sort, realtime subscription |
| `src/hooks/useMentionSearch.ts` | Tìm kiếm user cho @mention autocomplete |

### 2. Video Comments Components (8 files)

| File | Mô tả |
|------|-------|
| `src/components/Video/Comments/index.ts` | Export tập trung tất cả components |
| `src/components/Video/Comments/VideoCommentList.tsx` | Danh sách comments + skeleton + sort integration |
| `src/components/Video/Comments/VideoCommentItem.tsx` | Từng comment + replies + actions (like, reply, delete) |
| `src/components/Video/Comments/VideoCommentInput.tsx` | Input với @mention + emoji picker |
| `src/components/Video/Comments/CommentContent.tsx` | Parse và render timestamp links + @mentions |
| `src/components/Video/Comments/CommentSortDropdown.tsx` | Dropdown sort (Top/Newest) |
| `src/components/Video/Comments/EmojiPicker.tsx` | Emoji picker popover |
| `src/components/Video/Comments/MentionAutocomplete.tsx` | Autocomplete dropdown cho @mentions |

### 3. Files Cần Cập Nhật

| File | Thay đổi |
|------|----------|
| `src/components/Video/Mobile/CommentsDrawer.tsx` | Tích hợp useVideoComments hook |
| `src/pages/Watch.tsx` | Tích hợp VideoCommentList component |

## Kiến Trúc Kỹ Thuật

### useVideoComments Hook

```text
Cung cấp:
├── comments[] - Danh sách với nested replies
├── loading, submitting states
├── sortBy ('top' | 'newest')
├── setSortBy() - Thay đổi sort
├── userLikes/userDislikes Sets - Track like status
├── createComment(content, parentId?) - Tạo comment/reply
├── updateComment(id, content) - Sửa comment
├── softDeleteComment(id) - Soft delete
├── toggleLike(id) - Toggle like
├── toggleDislike(id) - Toggle dislike
└── Realtime subscription tự động
```

### useMentionSearch Hook

```text
Cung cấp:
├── searchUsers(query) - Tìm user theo username/display_name
├── results[] - Kết quả tìm kiếm
├── loading state
└── Debounced search (300ms)
```

### VideoCommentInput Flow

```text
User gõ "@" → Trigger MentionAutocomplete
    ↓
Keyboard Navigation:
- ↑↓ : Di chuyển selection
- Enter : Chọn user
- Esc : Đóng autocomplete
    ↓
Insert @username vào nội dung
```

### CommentContent Parser

```text
Input: "Xem tại 2:30 @username hay quá!"
    ↓
Parse:
- Timestamp: 2:30 → onClick seek to 150s
- Mention: @username → Link to channel
    ↓
Output: React elements với click handlers
```

## Database

**Không cần migration** - Bảng `comments` và `likes` đã có đầy đủ cấu trúc:
- `comments`: id, video_id, user_id, parent_comment_id, content, like_count
- `likes`: id, user_id, video_id, comment_id, is_dislike

## Tóm Tắt Công Việc

| Bước | Mô tả | Files |
|------|-------|-------|
| 1 | Tạo hooks mới | 2 files |
| 2 | Tạo Video Comments components | 8 files |
| 3 | Cập nhật CommentsDrawer | 1 file |
| 4 | Tích hợp vào Watch page | 1 file |

**Tổng cộng**: 10 files mới + 2 files cập nhật
