-- Trust Graph table
CREATE TABLE public.trust_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight numeric NOT NULL DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_edges_no_self CHECK (from_user_id <> to_user_id),
  CONSTRAINT trust_edges_unique_pair UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX idx_trust_edges_to ON public.trust_edges(to_user_id);
CREATE INDEX idx_trust_edges_from ON public.trust_edges(from_user_id);

ALTER TABLE public.trust_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_edges_public_read" ON public.trust_edges FOR SELECT USING (true);
CREATE POLICY "trust_edges_owner_insert" ON public.trust_edges FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "trust_edges_owner_update" ON public.trust_edges FOR UPDATE USING (auth.uid() = from_user_id);
CREATE POLICY "trust_edges_owner_delete" ON public.trust_edges FOR DELETE USING (auth.uid() = from_user_id);

CREATE TRIGGER trg_trust_edges_updated_at
  BEFORE UPDATE ON public.trust_edges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI Trust Evaluations
CREATE TABLE public.ai_trust_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fake_probability numeric NOT NULL DEFAULT 0 CHECK (fake_probability >= 0 AND fake_probability <= 1),
  quality_score numeric NOT NULL DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
  tc_adjustment numeric NOT NULL DEFAULT 0 CHECK (tc_adjustment >= -0.1 AND tc_adjustment <= 0.1),
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  evaluated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_trust_eval_user ON public.ai_trust_evaluations(user_id, evaluated_at DESC);

ALTER TABLE public.ai_trust_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_trust_eval_public_read" ON public.ai_trust_evaluations FOR SELECT USING (true);

-- RPC: trust graph stats for a user
CREATE OR REPLACE FUNCTION public.get_trust_graph_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_incoming_count int;
  v_outgoing_count int;
  v_avg_weight numeric;
  v_top_vouchers jsonb;
BEGIN
  SELECT COUNT(*), COALESCE(AVG(weight), 0)
    INTO v_incoming_count, v_avg_weight
    FROM trust_edges WHERE to_user_id = p_user_id;

  SELECT COUNT(*) INTO v_outgoing_count
    FROM trust_edges WHERE from_user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_vouchers
  FROM (
    SELECT te.from_user_id AS user_id, te.weight, te.reason, te.created_at,
           p.display_name, p.username, p.avatar_url,
           COALESCE(tp.tc, 0.5) AS voucher_tc
    FROM trust_edges te
    LEFT JOIN profiles p ON p.id = te.from_user_id
    LEFT JOIN trust_profile tp ON tp.user_id = te.from_user_id
    WHERE te.to_user_id = p_user_id
    ORDER BY (te.weight * COALESCE(tp.tc, 0.5)) DESC, te.created_at DESC
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    'incoming_count', v_incoming_count,
    'outgoing_count', v_outgoing_count,
    'avg_incoming_weight', ROUND(v_avg_weight::numeric, 4),
    'top_vouchers', v_top_vouchers
  );
END;
$$;

-- Anti-abuse: limit 50 vouches/month per user
CREATE OR REPLACE FUNCTION public.check_vouch_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM trust_edges
  WHERE from_user_id = NEW.from_user_id
    AND created_at > now() - interval '30 days';
  IF v_count >= 50 THEN
    RAISE EXCEPTION 'Vouch rate limit exceeded: max 50 per 30 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vouch_rate_limit
  BEFORE INSERT ON public.trust_edges
  FOR EACH ROW EXECUTE FUNCTION public.check_vouch_rate_limit();