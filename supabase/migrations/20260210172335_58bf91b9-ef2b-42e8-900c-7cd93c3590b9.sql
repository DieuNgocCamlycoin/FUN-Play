
-- Thêm cột action_type và action_status cho notification receiver approval
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS action_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS action_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- Thêm comment giải thích
COMMENT ON COLUMN public.notifications.action_type IS 'Loại hành động yêu cầu: share_celebration, etc.';
COMMENT ON COLUMN public.notifications.action_status IS 'Trạng thái: pending, accepted, declined';
COMMENT ON COLUMN public.notifications.metadata IS 'Dữ liệu bổ sung: transaction_id, theme, background, music, etc.';
