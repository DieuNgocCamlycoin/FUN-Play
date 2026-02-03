-- Tạo function kiểm tra owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

-- Function thêm admin mới (chỉ Owner được gọi)
CREATE OR REPLACE FUNCTION public.add_admin_role(
  p_owner_id uuid, 
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner(p_owner_id) THEN
    RAISE EXCEPTION 'Only owners can add admins';
  END IF;
  
  INSERT INTO user_roles (user_id, role)
  VALUES (p_target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Function xóa admin (chỉ Owner được gọi)
CREATE OR REPLACE FUNCTION public.remove_admin_role(
  p_owner_id uuid, 
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner(p_owner_id) THEN
    RAISE EXCEPTION 'Only owners can remove admins';
  END IF;
  
  -- Không cho xóa Owner
  IF public.is_owner(p_target_user_id) THEN
    RAISE EXCEPTION 'Cannot remove owner role';
  END IF;
  
  DELETE FROM user_roles 
  WHERE user_id = p_target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;