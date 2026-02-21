CREATE OR REPLACE FUNCTION public.get_public_suspended_list()
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  ban_reason text,
  banned_at timestamptz,
  violation_level int
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, display_name, avatar_url, ban_reason, banned_at, violation_level
  FROM profiles
  WHERE COALESCE(banned, false) = true
  ORDER BY banned_at DESC NULLS LAST;
$$;