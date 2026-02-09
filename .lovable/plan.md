

# KE HOACH CAP NHAT YOUTUBE FEATURES PACKAGE VAO DU AN GOC

---

## I. PHAN TICH GAP (DA CO vs CAN THEM)

### Files DA CO va HOAN CHINH (khong can thay doi)
| File | Trang Thai |
|------|-----------|
| `src/hooks/useVideoComments.ts` | Da co day du (621 dong) |
| `src/components/Video/Comments/*` (8 files) | Da co |
| `src/components/Video/ShortsCommentSheet.tsx` | Da co |
| `src/components/Music/MusicComments.tsx` | Da co |
| `src/hooks/useMentionSearch.ts` | Da co |
| `src/hooks/useAutoReward.ts` | Da co |
| `src/components/Post/CommentLikesList.tsx` | Da co |

### Database DA CO
| Bang | Trang Thai |
|------|-----------|
| `comments` | Da co + RLS + trigger |
| `comment_likes` | Da co + RLS + trigger |
| `post_comments` | Da co + RLS |
| `post_comment_likes` | Da co nhung **THIEU cot `emoji`** |
| `posts` | Da co |

### CAN TAO MOI
| # | File/Resource | Loai | Mo Ta |
|---|---------------|------|-------|
| 1 | `post_likes` table | Database | Bang like bai dang voi emoji (CHUA TON TAI) |
| 2 | Cot `emoji` trong `post_comment_likes` | Database | Them cot emoji TEXT DEFAULT 'tim do' |
| 3 | Function `update_post_like_count` | Database | Tu dong cap nhat like_count cua posts |
| 4 | Trigger `trigger_update_post_likes` | Database | Kich hoat function tren |
| 5 | `src/hooks/usePostLike.ts` | Hook moi | Like bai dang voi emoji (~120 dong) |
| 6 | `src/components/Post/PostReactions.tsx` | Component moi | Like/Comment/Share bar (~70 dong) |
| 7 | `src/components/Post/PostEmojiPicker.tsx` | Component moi | 4 categories emoji picker (~40 dong) |

### CAN CAP NHAT (them emoji support)
| # | File | Thay Doi |
|---|------|---------|
| 1 | `src/hooks/usePostComments.ts` | Them `likedCommentEmojis` Map, sua `toggleLike` nhan emoji |
| 2 | `src/components/Post/PostCommentItem.tsx` | Them emoji reaction picker tren comment |
| 3 | `src/components/Post/PostCommentInput.tsx` | Them emoji picker trong input |
| 4 | `src/components/Post/PostCommentList.tsx` | Them prop `likedCommentEmojis` |
| 5 | `src/components/Post/PostComments.tsx` | Truyen emoji data xuong components |

---

## II. TRIEN KHAI CHI TIET

### PHASE 1: Database Migration

**Tao bang `post_likes`:**
```sql
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL DEFAULT 'tim do',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- RLS Policies
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own likes" ON public.post_likes FOR UPDATE USING (auth.uid() = user_id);
```

**Them cot emoji cho `post_comment_likes`:**
```sql
ALTER TABLE public.post_comment_likes ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT 'tim do';
```

**Tao trigger tu dong cap nhat like_count:**
```sql
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();
```

---

### PHASE 2: Tao 3 File Moi

**File 1: `src/hooks/usePostLike.ts`**
- Hook quan ly like bai dang voi emoji
- Optimistic UI + rollback
- Toggle like/unlike/change emoji
- ~120 dong code tu package

**File 2: `src/components/Post/PostEmojiPicker.tsx`**
- 4 categories emoji tich cuc: Tim, Vui ve, Co vu, Nang luong
- 40 emoji tong cong
- Popover UI voi tab categories
- ~40 dong code tu package

**File 3: `src/components/Post/PostReactions.tsx`**
- Bar ngang: Like + Emoji + Comment + Share
- Tich hop `usePostLike` hook
- Animation khi like (framer-motion)
- Web Share API cho chia se
- ~70 dong code tu package

---

### PHASE 3: Cap Nhat 5 File Hien Co

**File 1: `src/hooks/usePostComments.ts`**
- THEM: `likedCommentEmojis: Map<string, string>` state
- SUA: `toggleLike(commentId, emoji)` - them param emoji
- SUA: Fetch emoji tu `post_comment_likes` khi load
- SUA: Insert/update emoji khi like comment

**File 2: `src/components/Post/PostCommentItem.tsx`**
- THEM: Props `likedEmoji`, `likedCommentEmojis`
- THEM: Emoji reaction picker (Popover voi 8 emoji)
- SUA: Hien thi emoji da chon thay vi icon Heart mac dinh
- SUA: `onToggleLike` signature nhan them emoji

**File 3: `src/components/Post/PostCommentInput.tsx`**
- THEM: Emoji picker button trong textarea
- THEM: Grid 30 emoji de chen vao noi dung
- THEM: Logic chen emoji tai vi tri cursor

**File 4: `src/components/Post/PostCommentList.tsx`**
- THEM: Prop `likedCommentEmojis: Map<string, string>`
- SUA: Truyen `likedEmoji` cho tung `PostCommentItem`

**File 5: `src/components/Post/PostComments.tsx`**
- SUA: Lay `likedCommentEmojis` tu hook
- SUA: Truyen xuong `PostCommentList`

---

## III. BANG TONG HOP

| # | File | Loai | Phuc Tap | Dong |
|---|------|------|----------|------|
| 1 | Database Migration | Tao + Sua | 2/5 | ~50 SQL |
| 2 | `usePostLike.ts` | Tao moi | 2/5 | ~120 |
| 3 | `PostEmojiPicker.tsx` | Tao moi | 1/5 | ~40 |
| 4 | `PostReactions.tsx` | Tao moi | 2/5 | ~70 |
| 5 | `usePostComments.ts` | Cap nhat | 3/5 | ~50 thay doi |
| 6 | `PostCommentItem.tsx` | Cap nhat | 3/5 | ~60 thay doi |
| 7 | `PostCommentInput.tsx` | Cap nhat | 2/5 | ~40 thay doi |
| 8 | `PostCommentList.tsx` | Cap nhat | 1/5 | ~10 thay doi |
| 9 | `PostComments.tsx` | Cap nhat | 1/5 | ~10 thay doi |

**Tong**: 9 thay doi (3 file moi + 5 cap nhat + 1 migration)

---

## IV. KHONG CAN THAY DOI (DA DAY DU)

Cac file sau trong package da co trong du an va **KHONG can cap nhat**:
- useVideoComments.ts (da day du)
- Video/Comments/* (8 components)
- ShortsCommentSheet.tsx
- MusicComments.tsx
- useMentionSearch.ts
- useAutoReward.ts
- CommentLikesList.tsx

---

## V. GHI CHU

- **FunProfileTabs.tsx**: Package chi de cap nhung khong cung cap ma nguon day du. Se khong tao file nay trong dot nay.
- Tat ca code lay truc tiep tu file package `YOUTUBE-FEATURES-FULL-PACKAGE.md` do user cung cap.
- Emoji mac dinh dung "tim do" (heart emoji) trong database.
- Realtime da duoc bat cho `comments` va `post_comments` truoc do.

