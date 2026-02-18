
-- Create admin_rate_limits table for rate limiting admin refreshes
CREATE TABLE public.admin_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  request_count integer DEFAULT 1,
  UNIQUE (admin_id, action, window_start)
);

-- Enable RLS
ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can access their own rate limit records
CREATE POLICY "Admins can manage own rate limits"
  ON public.admin_rate_limits
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- Auto-cleanup old records (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(p_admin_id uuid, p_action text, p_max_requests integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window timestamptz;
  v_count integer;
BEGIN
  -- Must be admin
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Not admin');
  END IF;

  v_window := date_trunc('minute', now());

  -- Cleanup old entries (> 5 min)
  DELETE FROM admin_rate_limits WHERE window_start < now() - interval '5 minutes';

  -- Upsert current window
  INSERT INTO admin_rate_limits (admin_id, action, window_start, request_count)
  VALUES (p_admin_id, p_action, v_window, 1)
  ON CONFLICT (admin_id, action, window_start)
  DO UPDATE SET request_count = admin_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  IF v_count > p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Rate limit exceeded',
      'retry_after', 60 - EXTRACT(SECOND FROM now())::integer,
      'current_count', v_count
    );
  END IF;

  RETURN jsonb_build_object('allowed', true, 'current_count', v_count);
END;
$$;
