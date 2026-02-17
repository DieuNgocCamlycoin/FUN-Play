
CREATE OR REPLACE FUNCTION public.bulk_notify_system_usernames(p_admin_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Admin check
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can send bulk notifications';
  END IF;

  -- Insert notifications for all users with system usernames
  WITH inserted AS (
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      p.id,
      'system',
      'Cập nhật hồ sơ của bạn! 🌟',
      'Bạn đang dùng username hệ thống. Hãy chọn username đẹp và cập nhật ảnh đại diện để nhận thưởng CAMLY!',
      '/settings'
    FROM profiles p
    WHERE p.username LIKE 'user_%'
      AND COALESCE(p.banned, false) = false
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM inserted;

  RETURN v_count;
END;
$$;
