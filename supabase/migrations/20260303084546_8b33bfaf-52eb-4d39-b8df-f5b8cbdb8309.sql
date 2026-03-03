
-- Thêm cột last_heartbeat_at vào bảng livestreams
ALTER TABLE public.livestreams ADD COLUMN last_heartbeat_at timestamptz;

-- Tạo DB function update_livestream_viewers dùng GREATEST cho peak_viewers
CREATE OR REPLACE FUNCTION public.update_livestream_viewers(p_livestream_id uuid, p_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.livestreams
  SET viewer_count = p_count,
      peak_viewers = GREATEST(peak_viewers, p_count),
      updated_at = now()
  WHERE id = p_livestream_id;
END;
$$;
