
-- ============= 1. PARAMETER OVERRIDES =============
CREATE TABLE public.parameter_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  param_type TEXT NOT NULL CHECK (param_type IN (
    'event_base', 'quality', 'trust', 'iis', 'impact', 'aaf', 'erp',
    'consistency', 'reliability', 'network_quality', 'network_trust',
    'network_diversity', 'phase_weights', 'activation_threshold'
  )),
  param_key TEXT NOT NULL,
  override_min NUMERIC,
  override_max NUMERIC,
  override_default NUMERIC,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(param_type, param_key, is_active) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_param_overrides_active ON public.parameter_overrides(param_type, param_key) WHERE is_active = true;

ALTER TABLE public.parameter_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active overrides"
  ON public.parameter_overrides FOR SELECT
  USING (true);

CREATE POLICY "Owner/Admin can insert overrides"
  ON public.parameter_overrides FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

CREATE POLICY "Owner/Admin can update overrides"
  ON public.parameter_overrides FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

CREATE POLICY "Owner/Admin can delete overrides"
  ON public.parameter_overrides FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============= 2. PARAMETER CHANGE LOG (AUDIT) =============
CREATE TABLE public.parameter_change_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  override_id UUID REFERENCES public.parameter_overrides(id) ON DELETE SET NULL,
  param_type TEXT NOT NULL,
  param_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'expire')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_param_log_changed_at ON public.parameter_change_log(changed_at DESC);
CREATE INDEX idx_param_log_param ON public.parameter_change_log(param_type, param_key);

ALTER TABLE public.parameter_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/Admin can view audit log"
  ON public.parameter_change_log FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

CREATE POLICY "System can insert audit log"
  ON public.parameter_change_log FOR INSERT
  WITH CHECK (true);

-- Trigger: auto-log changes
CREATE OR REPLACE FUNCTION public.log_parameter_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO parameter_change_log (override_id, param_type, param_key, action, new_value, reason, changed_by)
    VALUES (NEW.id, NEW.param_type, NEW.param_key, 'create',
      jsonb_build_object('min', NEW.override_min, 'max', NEW.override_max, 'default', NEW.override_default),
      NEW.reason, NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO parameter_change_log (override_id, param_type, param_key, action, old_value, new_value, reason, changed_by)
    VALUES (NEW.id, NEW.param_type, NEW.param_key, 
      CASE WHEN NEW.is_active = false AND OLD.is_active = true THEN 'expire' ELSE 'update' END,
      jsonb_build_object('min', OLD.override_min, 'max', OLD.override_max, 'default', OLD.override_default, 'is_active', OLD.is_active),
      jsonb_build_object('min', NEW.override_min, 'max', NEW.override_max, 'default', NEW.override_default, 'is_active', NEW.is_active),
      NEW.reason, COALESCE(auth.uid(), NEW.created_by));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO parameter_change_log (override_id, param_type, param_key, action, old_value, changed_by)
    VALUES (OLD.id, OLD.param_type, OLD.param_key, 'delete',
      jsonb_build_object('min', OLD.override_min, 'max', OLD.override_max, 'default', OLD.override_default),
      COALESCE(auth.uid(), OLD.created_by));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_log_parameter_change
  AFTER INSERT OR UPDATE OR DELETE ON public.parameter_overrides
  FOR EACH ROW EXECUTE FUNCTION public.log_parameter_change();

-- ============= 3. SYSTEM PHASE STATE =============
CREATE TABLE public.system_phase_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_phase TEXT NOT NULL DEFAULT 'early' CHECK (current_phase IN ('early', 'growth', 'mature')),
  previous_phase TEXT CHECK (previous_phase IN ('early', 'growth', 'mature')),
  switched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  switched_by UUID,
  switch_reason TEXT,
  kpi_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_current BOOLEAN NOT NULL DEFAULT true,
  auto_switch_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_phase_state_current ON public.system_phase_state(is_current) WHERE is_current = true;

ALTER TABLE public.system_phase_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view phase state"
  ON public.system_phase_state FOR SELECT USING (true);

CREATE POLICY "Owner can manage phase state"
  ON public.system_phase_state FOR ALL
  USING (is_owner(auth.uid()));

-- Seed initial phase
INSERT INTO public.system_phase_state (current_phase, switch_reason, kpi_snapshot, switched_by)
VALUES ('early', 'Initial system phase', '{"dau": 0, "total_mint": 0, "active_users": 0}'::jsonb, NULL);

-- ============= 4. STABILITY SNAPSHOTS =============
CREATE TABLE public.stability_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stability_index NUMERIC NOT NULL DEFAULT 1.0 CHECK (stability_index >= 0 AND stability_index <= 1.5),
  variance NUMERIC NOT NULL DEFAULT 0,
  mean_ls_30d NUMERIC NOT NULL DEFAULT 0,
  std_dev NUMERIC NOT NULL DEFAULT 0,
  data_points INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_stability_user_date ON public.stability_snapshots(user_id, snapshot_date DESC);

ALTER TABLE public.stability_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stability"
  ON public.stability_snapshots FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

CREATE POLICY "System can insert stability"
  ON public.stability_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update stability"
  ON public.stability_snapshots FOR UPDATE USING (true);

-- ============= 5. STABILITY COMPUTE FUNCTION =============
CREATE OR REPLACE FUNCTION public.compute_stability_index(_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scores NUMERIC[];
  v_mean NUMERIC := 0;
  v_variance NUMERIC := 0;
  v_std_dev NUMERIC := 0;
  v_stability NUMERIC := 1.0;
  v_count INT := 0;
  v_score NUMERIC;
BEGIN
  -- Collect last 30 days of light scores
  SELECT array_agg(final_light_score::numeric ORDER BY period_start)
  INTO v_scores
  FROM light_score_ledger
  WHERE user_id = _user_id
    AND period_start >= CURRENT_DATE - INTERVAL '30 days';

  IF v_scores IS NULL OR array_length(v_scores, 1) < 3 THEN
    -- Not enough data → neutral stability
    INSERT INTO stability_snapshots (user_id, stability_index, variance, mean_ls_30d, std_dev, data_points)
    VALUES (_user_id, 1.0, 0, 0, 0, COALESCE(array_length(v_scores, 1), 0))
    ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
      stability_index = 1.0,
      data_points = EXCLUDED.data_points,
      computed_at = now();
    RETURN 1.0;
  END IF;

  v_count := array_length(v_scores, 1);

  -- Calculate mean
  FOREACH v_score IN ARRAY v_scores LOOP
    v_mean := v_mean + v_score;
  END LOOP;
  v_mean := v_mean / v_count;

  -- Calculate variance
  FOREACH v_score IN ARRAY v_scores LOOP
    v_variance := v_variance + POWER(v_score - v_mean, 2);
  END LOOP;
  v_variance := v_variance / v_count;
  v_std_dev := SQRT(v_variance);

  -- Stability Index: 1.0 = stable, lower = volatile
  -- Coefficient of variation (CV) inverted, clamped 0.5-1.2
  IF v_mean > 0 THEN
    -- CV = std_dev / mean
    -- stability = 1.0 - min(0.5, CV * 0.5)  → range 0.5-1.0
    -- + bonus if very stable (CV < 0.1) → up to 1.2
    DECLARE
      v_cv NUMERIC := v_std_dev / v_mean;
    BEGIN
      IF v_cv < 0.1 THEN
        v_stability := 1.0 + LEAST(0.2, (0.1 - v_cv) * 2);
      ELSE
        v_stability := GREATEST(0.5, 1.0 - LEAST(0.5, v_cv * 0.5));
      END IF;
    END;
  END IF;

  -- Upsert snapshot
  INSERT INTO stability_snapshots (user_id, stability_index, variance, mean_ls_30d, std_dev, data_points)
  VALUES (_user_id, ROUND(v_stability::numeric, 4), ROUND(v_variance::numeric, 4), ROUND(v_mean::numeric, 4), ROUND(v_std_dev::numeric, 4), v_count)
  ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
    stability_index = EXCLUDED.stability_index,
    variance = EXCLUDED.variance,
    mean_ls_30d = EXCLUDED.mean_ls_30d,
    std_dev = EXCLUDED.std_dev,
    data_points = EXCLUDED.data_points,
    computed_at = now();

  RETURN v_stability;
END;
$$;

-- ============= 6. PHASE AUTO-SWITCH FUNCTION =============
CREATE OR REPLACE FUNCTION public.evaluate_phase_switch()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_phase TEXT;
  v_auto_enabled BOOLEAN;
  v_dau INT;
  v_total_mint NUMERIC;
  v_active_users INT;
  v_new_phase TEXT;
  v_kpi JSONB;
  v_switched BOOLEAN := false;
BEGIN
  SELECT current_phase, auto_switch_enabled INTO v_current_phase, v_auto_enabled
  FROM system_phase_state WHERE is_current = true;

  IF NOT v_auto_enabled THEN
    RETURN jsonb_build_object('switched', false, 'reason', 'auto_switch_disabled');
  END IF;

  -- Compute KPIs (last 7 days DAU avg, all-time mint, all-time active users)
  SELECT COALESCE(AVG(dau), 0)::int INTO v_dau
  FROM (
    SELECT DATE(created_at) d, COUNT(DISTINCT user_id) dau
    FROM pplp_mint_requests
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
  ) sub;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_mint
  FROM pplp_mint_requests WHERE status = 'confirmed';

  SELECT COUNT(*) INTO v_active_users
  FROM profiles WHERE COALESCE(banned, false) = false;

  v_kpi := jsonb_build_object('dau', v_dau, 'total_mint', v_total_mint, 'active_users', v_active_users, 'evaluated_at', now());

  -- Phase rules:
  -- early → growth: DAU >= 1000 AND total_mint >= 1M FUN AND active_users >= 5000
  -- growth → mature: DAU >= 10000 AND total_mint >= 50M FUN AND active_users >= 50000
  v_new_phase := v_current_phase;
  IF v_current_phase = 'early' AND v_dau >= 1000 AND v_total_mint >= 1000000 AND v_active_users >= 5000 THEN
    v_new_phase := 'growth';
  ELSIF v_current_phase = 'growth' AND v_dau >= 10000 AND v_total_mint >= 50000000 AND v_active_users >= 50000 THEN
    v_new_phase := 'mature';
  END IF;

  IF v_new_phase <> v_current_phase THEN
    UPDATE system_phase_state SET is_current = false WHERE is_current = true;
    INSERT INTO system_phase_state (current_phase, previous_phase, switch_reason, kpi_snapshot, is_current, auto_switch_enabled)
    VALUES (v_new_phase, v_current_phase, 'auto_kpi_threshold', v_kpi, true, true);
    v_switched := true;
  END IF;

  RETURN jsonb_build_object(
    'switched', v_switched,
    'current_phase', v_new_phase,
    'previous_phase', v_current_phase,
    'kpi', v_kpi
  );
END;
$$;

-- ============= 7. UPDATED_AT TRIGGERS =============
CREATE TRIGGER trg_param_overrides_updated_at
  BEFORE UPDATE ON public.parameter_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
