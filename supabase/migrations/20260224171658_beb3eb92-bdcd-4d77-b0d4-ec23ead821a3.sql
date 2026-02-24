
-- =============================================
-- 1. Create video_slug_history table
-- =============================================
CREATE TABLE IF NOT EXISTS public.video_slug_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_slug_history_user_slug 
  ON public.video_slug_history (user_id, old_slug);
CREATE INDEX IF NOT EXISTS idx_video_slug_history_video_id 
  ON public.video_slug_history (video_id);

ALTER TABLE public.video_slug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slug history is viewable by everyone"
  ON public.video_slug_history FOR SELECT USING (true);

CREATE POLICY "Users can insert own slug history"
  ON public.video_slug_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. Replace generate_video_slug() with NFD-safe version
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_video_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  old_slug_val TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL AND OLD.slug != '' THEN
    old_slug_val := OLD.slug;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' AND (NEW.title = OLD.title) AND NEW.slug IS NOT NULL THEN
    RETURN NEW;
  END IF;

  base_slug := replace(replace(NEW.title, 'đ', 'd'), 'Đ', 'D');
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
    base_slug := 'untitled-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;

  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.videos 
    WHERE user_id = NEW.user_id AND slug = final_slug AND id != NEW.id
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := final_slug;

  IF old_slug_val IS NOT NULL AND old_slug_val != final_slug THEN
    INSERT INTO public.video_slug_history (video_id, user_id, old_slug)
    VALUES (NEW.id, NEW.user_id, old_slug_val)
    ON CONFLICT (user_id, old_slug) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 3. Update trigger to fire on INSERT and UPDATE of title
-- =============================================
DROP TRIGGER IF EXISTS trg_generate_video_slug ON public.videos;
CREATE TRIGGER trg_generate_video_slug
  BEFORE INSERT OR UPDATE OF title ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_video_slug();

-- =============================================
-- 4. Regenerate slugs (disable validation trigger temporarily)
-- =============================================
ALTER TABLE public.videos DISABLE TRIGGER trg_validate_video_title;
ALTER TABLE public.videos DISABLE TRIGGER trg_generate_video_slug;

DO $$
DECLARE
  vid RECORD;
  base_slug TEXT;
  counter INTEGER;
  final_slug TEXT;
BEGIN
  FOR vid IN SELECT id, title, slug, user_id FROM public.videos WHERE title IS NOT NULL LOOP
    IF vid.slug IS NOT NULL AND vid.slug != '' THEN
      INSERT INTO public.video_slug_history (video_id, user_id, old_slug)
      VALUES (vid.id, vid.user_id, vid.slug)
      ON CONFLICT (user_id, old_slug) DO NOTHING;
    END IF;

    base_slug := replace(replace(vid.title, 'đ', 'd'), 'Đ', 'D');
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
      base_slug := 'untitled-' || substr(gen_random_uuid()::text, 1, 4);
    END IF;

    final_slug := base_slug;
    counter := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.videos 
      WHERE user_id = vid.user_id AND slug = final_slug AND id != vid.id
    ) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE public.videos SET slug = final_slug WHERE id = vid.id;
  END LOOP;
END $$;

ALTER TABLE public.videos ENABLE TRIGGER trg_validate_video_title;
ALTER TABLE public.videos ENABLE TRIGGER trg_generate_video_slug;
