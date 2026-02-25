

# Triển khai URL sạch cho Bài đăng (Posts)

**Mục tiêu**: Chuyển từ `play.fun.rich/post/{uuid}` sang `play.fun.rich/{username}/post/{slug}`

---

## Tổng quan thay đổi

| # | Hạng mục | Loại | File |
|---|----------|------|------|
| 1 | Thêm cột `slug` + backfill + unique index | DB Migration | SQL |
| 2 | Tạo bảng `post_slug_history` + RLS | DB Migration | SQL |
| 3 | Tạo trigger `trg_generate_post_slug` | DB Migration | SQL |
| 4 | Tạo `postNavigation.ts` | Code mới | `src/lib/postNavigation.ts` |
| 5 | Tạo `PostBySlug.tsx` | Code mới | `src/pages/PostBySlug.tsx` |
| 6 | Tạo `PostLegacyRedirect.tsx` | Code mới | `src/pages/PostLegacyRedirect.tsx` |
| 7 | Tạo `PostJsonLd.tsx` + cập nhật `PostDetail.tsx` | Code mới + sửa | `src/components/SEO/PostJsonLd.tsx`, `src/pages/PostDetail.tsx` |
| 8 | Cập nhật routing + sitemap + share links | Sửa | `src/App.tsx`, `generate-sitemap/index.ts`, `PostCard.tsx`, `PostReactions.tsx`, v.v. |

---

## Chi tiết kỹ thuật

### Bước 1-3: Database Migration (1 file SQL)

```sql
-- 1. Thêm cột slug vào bảng posts
ALTER TABLE public.posts ADD COLUMN slug TEXT;

-- 2. Backfill slug cho posts hiện có (từ 80 ký tự đầu content)
UPDATE public.posts SET slug = 
  regexp_replace(
    regexp_replace(
      lower(
        regexp_replace(
          normalize(
            replace(replace(left(regexp_replace(content, '[^\w\s]', '', 'g'), 80), 'đ', 'd'), 'Đ', 'D'),
            NFD
          ),
          '[\u0300-\u036f]', '', 'g'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
WHERE slug IS NULL;

-- Fallback cho slug rỗng
UPDATE public.posts SET slug = 'post-' || substr(id::text, 1, 8) 
WHERE slug IS NULL OR slug = '';

-- 3. Xử lý trùng lặp slug trong cùng user
-- (Sử dụng window function để thêm hậu tố)

-- 4. Unique index
CREATE UNIQUE INDEX idx_posts_user_slug ON public.posts(user_id, slug);

-- 5. Bảng lịch sử slug
CREATE TABLE public.post_slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, old_slug)
);

CREATE INDEX idx_post_slug_history_lookup 
  ON public.post_slug_history(user_id, old_slug);

-- 6. RLS
ALTER TABLE public.post_slug_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post slug history readable by everyone"
  ON public.post_slug_history FOR SELECT USING (true);

-- 7. Trigger tạo slug tự động
CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  old_slug_val TEXT;
  content_title TEXT;
BEGIN
  -- Lưu slug cũ nếu đang UPDATE
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL AND OLD.slug != '' THEN
    old_slug_val := OLD.slug;
  END IF;

  -- Giữ nguyên slug nếu INSERT có sẵn slug
  IF TG_OP = 'INSERT' AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Không đổi slug nếu content không thay đổi
  IF TG_OP = 'UPDATE' AND (NEW.content = OLD.content) AND NEW.slug IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Lấy 80 ký tự đầu content làm "title"
  content_title := left(regexp_replace(NEW.content, E'[\\n\\r]+', ' ', 'g'), 80);

  -- Tạo slug (giống generate_video_slug)
  base_slug := replace(replace(content_title, 'đ', 'd'), 'Đ', 'D');
  base_slug := normalize(base_slug, NFD);
  base_slug := regexp_replace(base_slug, '[\u0300-\u036f]', '', 'g');
  base_slug := lower(base_slug);
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

  IF length(base_slug) > 150 THEN
    base_slug := left(base_slug, 150);
    IF position('-' in base_slug) > 0 THEN
      base_slug := left(base_slug, length(base_slug) - position('-' in reverse(base_slug)));
    END IF;
  END IF;

  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'post-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  -- Chống trùng lặp
  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.posts 
    WHERE user_id = NEW.user_id AND slug = final_slug AND id != NEW.id
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := final_slug;

  -- Lưu slug cũ vào lịch sử
  IF old_slug_val IS NOT NULL AND old_slug_val != final_slug THEN
    INSERT INTO public.post_slug_history (post_id, user_id, old_slug)
    VALUES (NEW.id, NEW.user_id, old_slug_val)
    ON CONFLICT (user_id, old_slug) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_post_slug
  BEFORE INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION generate_post_slug();
```

### Bước 4: `src/lib/postNavigation.ts`

Tạo file mới, tương tự `videoNavigation.ts`:
- `buildPostPath(username, slug)` -> `/{username}/post/{slug}`
- `getPostPath(postId)` -> async, tra cứu DB lấy username + slug
- `resolvePostSlugRedirect(username, slug)` -> tra cứu `post_slug_history`
- `usePostNavigation()` hook cho navigation
- `getPostShareUrl(username, slug)` -> `https://play.fun.rich/{username}/post/{slug}`

### Bước 5: `src/pages/PostBySlug.tsx`

Tạo trang mới, tương tự `VideoBySlug.tsx`:
- Nhận params `/:username/post/:slug`
- Tra cứu profile theo username -> tìm post theo `user_id + slug`
- Nếu không thấy: tra cứu `post_slug_history` -> chuyển hướng 301
- Nếu vẫn không thấy: hiển thị NotFound
- Render `PostDetail` inline (truyền `postIdProp`)

### Bước 6: `src/pages/PostLegacyRedirect.tsx`

Tạo trang redirect cho URL cũ `/post/:id`:
- Tra cứu post by UUID -> lấy username + slug
- Chuyển hướng 301 sang `/{username}/post/{slug}`
- Hiển thị NotFound nếu không tìm thấy

### Bước 7: SEO Components

**`src/components/SEO/PostJsonLd.tsx`** (mới):
- Schema type: `Article` hoặc `SocialMediaPosting`
- Bao gồm: `headline` (80 ký tự đầu content), `author`, `datePublished`, `image`, `url`

**`src/pages/PostDetail.tsx`** (cập nhật):
- Thêm prop `postIdProp?: string` (để PostBySlug truyền ID)
- Sử dụng `postIdProp || id` từ useParams
- Tích hợp `DynamicMeta` với `canonicalUrl`
- Tích hợp `PostJsonLd`
- Cập nhật link chia sẻ sang URL sạch

### Bước 8: Routing & Sitemap

**`src/App.tsx`**:
- Thêm lazy import `PostBySlug` và `PostLegacyRedirect`
- Thêm route `/:username/post/:slug` -> `PostBySlug` (trước các dynamic routes cuối)
- Đổi `/post/:id` -> `PostLegacyRedirect` (thay vì `PostDetail` trực tiếp)

**`supabase/functions/generate-sitemap/index.ts`**:
- Thêm biến `POSTS_PER_PAGE = 1000`
- Thêm đếm posts vào sitemap index
- Thêm section `type=posts` với phân trang
- Truy vấn posts có slug, join username

**Cập nhật share links** trong:
- `src/components/Profile/PostCard.tsx` — đổi `/post/${post.id}` sang `/{username}/post/{slug}`
- `src/components/Post/PostReactions.tsx` — tương tự
- `src/pages/YourVideosMobile.tsx` — tương tự
- `src/pages/Receipt.tsx` — tương tự

---

## Thứ tự thực hiện

1. Chạy DB Migration (bước 1-3) - phải chờ hoàn tất trước
2. Tạo song song: `postNavigation.ts`, `PostJsonLd.tsx` (bước 4, 7a)
3. Tạo song song: `PostBySlug.tsx`, `PostLegacyRedirect.tsx` (bước 5, 6)
4. Cập nhật `PostDetail.tsx` + thêm `postIdProp` (bước 7b)
5. Cập nhật `App.tsx` routing + sitemap + share links (bước 8)
6. Deploy Edge Function `generate-sitemap`

