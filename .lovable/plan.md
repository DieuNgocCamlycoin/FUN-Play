
# Cap nhat he thong binh luan tu COMMENT-SYSTEM-FULL-PACKAGE

## Tong quan

File package chua phien ban 1.1.0 cua he thong binh luan voi nhieu tinh nang nang cap so voi code hien tai. Sau khi so sanh chi tiet tung file, day la nhung thay doi can thuc hien:

## Phan 1: Database Migration

### 1.1 Them cot moi vao bang `comments`
Bang hien tai thieu cac cot quan trong cho tinh nang moi:

| Cot moi | Kieu | Muc dich |
|---------|------|----------|
| dislike_count | INTEGER DEFAULT 0 | Dem so dislike |
| is_pinned | BOOLEAN DEFAULT FALSE | Ghim binh luan |
| is_hearted | BOOLEAN DEFAULT FALSE | Tim tu creator |
| hearted_by | UUID | Ai da tha tim |
| hearted_at | TIMESTAMPTZ | Khi nao tha tim |
| is_edited | BOOLEAN DEFAULT FALSE | Da chinh sua chua |
| edited_at | TIMESTAMPTZ | Khi nao chinh sua |
| is_deleted | BOOLEAN DEFAULT FALSE | Soft delete |

### 1.2 Tao bang `comment_likes`
Hien tai dung bang `likes` chung cho ca video va comment. Package yeu cau bang rieng `comment_likes`:
- comment_id, user_id, is_dislike
- UNIQUE(comment_id, user_id)
- RLS policies cho SELECT/INSERT/UPDATE/DELETE

### 1.3 Tao trigger auto-update like_count
- Trigger `update_comment_like_counts` tu dong cap nhat like_count va dislike_count khi INSERT/UPDATE/DELETE tren `comment_likes`

## Phan 2: Hook Updates (3 files)

### 2.1 `src/hooks/useVideoComments.ts` - VIET LAI HOAN TOAN
Day la thay doi lon nhat. Hook hien tai va package khac nhau hoan toan:

**Hien tai:**
- Nhan `videoId: string | undefined`
- Tra ve `userLikes`, `userDislikes` (Set)
- Dung bang `likes` cho like/dislike
- Khong co edit, heart, pin

**Package moi:**
- Nhan `{ videoId, videoOwnerId, onCommentCountChange }`
- Tra ve `addComment`, `editComment`, `deleteComment`, `heartComment`, `pinComment`, `isVideoOwner`
- Dung bang `comment_likes` rieng
- Like/dislike state nam trong tung comment object (`hasLiked`, `hasDisliked`)
- Tich hop CAMLY rewards truc tiep
- Filter is_deleted comments
- Fetch channels cho creator badge

### 2.2 `src/hooks/useMentionSearch.ts` - Cap nhat API
- Doi `results` -> `users`
- Doi `clearResults` -> `clearUsers`
- Bo debounce (package don gian hon)
- Giam min query length tu 2 -> 1

### 2.3 `src/hooks/usePostComments.ts` - GIU NGUYEN
File nay giong nhau giua current va package, khong can thay doi.

## Phan 3: Video Comment Components (7 files)

### 3.1 `src/components/Video/Comments/index.ts` - Cap nhat exports
- Them re-export types: `VideoComment`, `SortType`

### 3.2 `src/components/Video/Comments/VideoCommentList.tsx` - VIET LAI
**Hien tai:** Hook chay ben trong component, interface don gian `{ videoId, onSeek }`
**Package moi:** Nhan tat ca props tu ben ngoai (comments, loading, sortBy, onAddComment, onLike, onDislike, onReply, onEdit, onDelete, onHeart, onPin, videoOwnerId, channelName, isVideoOwner, onTimestampClick...)
- Them animation voi framer-motion
- Them empty state voi icon MessageCircle
- Skeleton loading cai thien

### 3.3 `src/components/Video/Comments/VideoCommentItem.tsx` - VIET LAI
**Them tinh nang:**
- Creator badge (hien ten kenh)
- Pinned comment badge
- Hearted by creator indicator
- Edit inline (textarea + Luu/Huy)
- Heart button cho video owner
- Pin option trong dropdown menu
- Report option
- Navigate to channel khi click avatar/name
- Doi `onSeek` -> `onTimestampClick`
- Doi `isLiked/isDisliked` boolean -> doc tu `comment.hasLiked/hasDisliked`
- Them `onEdit`, `onHeart`, `onPin` props

### 3.4 `src/components/Video/Comments/VideoCommentInput.tsx` - Cap nhat
- Doi tu `Textarea` component sang plain `<textarea>` voi auto-resize
- Them ky tu dem (maxLength counter)
- Them `showCancel` prop
- Cap nhat mention API: `users`/`clearUsers` thay vi `results`/`clearResults`
- Emoji picker di chuyen vao trong textarea area
- Ctrl+Enter de gui

### 3.5 `src/components/Video/Comments/CommentContent.tsx` - Cap nhat nhe
- Doi `onSeek` prop -> `onTimestampClick`
- Cap nhat regex pattern
- Mention click: navigate truc tiep thay vi query supabase

### 3.6 `src/components/Video/Comments/CommentSortDropdown.tsx` - Cap nhat
- Them `commentCount` prop
- Hien thi so binh luan trong header
- Doi `value`/`onChange` -> `sortBy`/`onSortChange`
- Them Check icon cho selected option
- Doi type `SortBy` -> `SortType`

### 3.7 `src/components/Video/Comments/EmojiPicker.tsx` - Cap nhat
- Doi tu object-based categories sang array-based
- 5 categories (them "Tim & Yeu thuong")
- Them tab selector cho categories
- Grid layout 8 cot

### 3.8 `src/components/Video/Comments/MentionAutocomplete.tsx` - Cap nhat
- Them `visible` prop de control hien thi
- Cap nhat fallback styling
- Them loading spinner icon (Loader2)

## Phan 4: Mobile Components (2 files)

### 4.1 `src/components/Video/Mobile/CommentsDrawer.tsx` - VIET LAI
**Hien tai:** Dung `VideoCommentList` component (hook chay ben trong)
**Package moi:** Dung `useVideoComments` hook truc tiep, render comments inline voi:
- Sort dropdown trong header
- VideoCommentItem voi day du tinh nang (edit, heart, pin)
- Comment input fixed o bottom
- Skeleton loading
- Empty state voi animation
- Nhan them props: `videoOwnerId`, `channelName`

### 4.2 `src/components/Video/Mobile/CommentsCard.tsx` - GIU NGUYEN
Giong nhau, khong can thay doi.

## Phan 5: Consumer Updates (2 files)

### 5.1 `src/pages/Watch.tsx` - Cap nhat cach dung VideoCommentList
- `VideoCommentList` moi nhan props tu ben ngoai
- Phai goi `useVideoComments` hook trong Watch page
- Truyen `video.user_id` lam `videoOwnerId`
- Truyen channel name

### 5.2 `src/components/Video/Mobile/MobileWatchView.tsx` - Cap nhat
- `useVideoComments` moi nhan object thay vi string
- Cap nhat latestComment mapping (profile -> profiles)

## Phan 6: Files KHONG thay doi
- `src/hooks/usePostComments.ts` - Giong nhau
- `src/components/Post/*` - Giong nhau  
- `src/components/Video/ShortsCommentSheet.tsx` - Giong nhau
- `src/components/Music/MusicComments.tsx` - Giong nhau

## Thu tu thuc hien

1. Database migration (them cot, tao bang, tao trigger)
2. `useMentionSearch.ts` (vi hooks khac phu thuoc)
3. `useVideoComments.ts` (hook chinh)
4. Cac comment components (VideoCommentList, Item, Input, Content, SortDropdown, EmojiPicker, MentionAutocomplete, index.ts)
5. Mobile components (CommentsDrawer)
6. Consumer updates (Watch.tsx, MobileWatchView.tsx)

## Chi tiet ky thuat - Database

```text
-- Them cot vao bang comments
ALTER TABLE comments ADD COLUMN dislike_count INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN is_hearted BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN hearted_by UUID REFERENCES auth.users(id);
ALTER TABLE comments ADD COLUMN hearted_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN edited_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Tao bang comment_likes
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_dislike BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- RLS + Indexes + Trigger
```

## Tom tat

| Loai | So file | Chi tiet |
|------|---------|----------|
| Database migration | 1 | Them cot + tao bang + trigger |
| Hooks | 2 | useVideoComments (viet lai), useMentionSearch (cap nhat) |
| Video Comments | 7 | Tat ca 7 components trong Video/Comments/ |
| Mobile | 1 | CommentsDrawer (viet lai) |
| Consumers | 2 | Watch.tsx, MobileWatchView.tsx |
| Khong doi | 7+ | PostComments, ShortsCommentSheet, MusicComments... |
| **Tong cong** | **~13 files** | |
