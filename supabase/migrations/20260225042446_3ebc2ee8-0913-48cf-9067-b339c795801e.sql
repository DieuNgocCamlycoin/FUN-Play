
-- 1. Thêm cột slug vào bảng posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Backfill slug cho posts hiện có (từ 80 ký tự đầu content)
-- Step 2a: Generate base slugs
UPDATE public.posts SET slug = 
  regexp_replace(
    regexp_replace(
      lower(
        regexp_replace(
          normalize(
            replace(replace(left(regexp_replace(content, E'[\\n\\r]+', ' ', 'g'), 80), 'đ', 'd'), 'Đ', 'D'),
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

-- Step 2b: Fallback cho slug rỗng
UPDATE public.posts SET slug = 'post-' || substr(id::text, 1, 8) 
WHERE slug IS NULL OR slug = '';

-- Step 2c: Xử lý trùng lặp slug trong cùng user (thêm hậu tố -2, -3...)
WITH duplicates AS (
  SELECT id, user_id, slug,
    ROW_NUMBER() OVER (PARTITION BY user_id, slug ORDER BY created_at) as rn
  FROM public.posts
)
UPDATE public.posts p
SET slug = p.slug || '-' || d.rn
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- 3. Unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_user_slug ON public.posts(user_id, slug);

-- 4. Bảng lịch sử slug
CREATE TABLE IF NOT EXISTS public.post_slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, old_slug)
);

CREATE INDEX IF NOT EXISTS idx_post_slug_history_lookup 
  ON public.post_slug_history(user_id, old_slug);

-- 5. RLS cho post_slug_history
ALTER TABLE public.post_slug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post slug history readable by everyone"
  ON public.post_slug_history FOR SELECT USING (true);

-- 6. Trigger function tạo slug tự động
CREATE OR REPLACE FUNCTION public.generate_post_slug()
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

  -- Tạo slug
  base_slug := replace(replace(content_title, 'đ', 'd'), 'Đ', 'D');
  base_slug := normalize(base_slug, NFD);
  base_slug := regexp_replace(base_slug, '[\u0300-\u036f]', '', 'g');
  base_slug := lower(base_slug);
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

  -- Giới hạn 150 ký tự, cắt tại ranh giới từ
  IF length(base_slug) > 150 THEN
    base_slug := left(base_slug, 150);
    IF position('-' in base_slug) > 0 THEN
      base_slug := left(base_slug, length(base_slug) - position('-' in reverse(base_slug)));
    END IF;
  END IF;

  -- Fallback cho slug rỗng
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'post-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  -- Chống trùng lặp trong cùng user
  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.posts 
    WHERE user_id = NEW.user_id AND slug = final_slug AND id != NEW.id
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := final_slug;

  -- Lưu slug cũ vào lịch sử (chỉ khi UPDATE và slug thay đổi)
  IF old_slug_val IS NOT NULL AND old_slug_val != final_slug THEN
    INSERT INTO public.post_slug_history (post_id, user_id, old_slug)
    VALUES (NEW.id, NEW.user_id, old_slug_val)
    ON CONFLICT (user_id, old_slug) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7. Tạo trigger
CREATE TRIGGER trg_generate_post_slug
  BEFORE INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.generate_post_slug();
