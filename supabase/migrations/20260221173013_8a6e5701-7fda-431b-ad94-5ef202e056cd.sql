DROP FUNCTION IF EXISTS public.get_public_suspended_list();

CREATE OR REPLACE FUNCTION public.get_public_suspended_list()
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, ban_reason text, banned_at timestamp with time zone, violation_level integer, total_camly_rewards numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, username, display_name, avatar_url, ban_reason, banned_at, violation_level,
         COALESCE(total_camly_rewards, 0)
  FROM profiles
  WHERE COALESCE(banned, false) = true
  ORDER BY banned_at DESC NULLS LAST;
$function$