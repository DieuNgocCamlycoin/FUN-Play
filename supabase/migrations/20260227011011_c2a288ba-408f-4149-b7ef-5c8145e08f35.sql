
-- =============================================
-- DAILY CHECKINS TABLE
-- Tracks daily spiritual check-ins for Light Score
-- =============================================

CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT CHECK (mood IN ('peaceful', 'grateful', 'joyful', 'reflective', 'hopeful', 'compassionate')),
  intention TEXT CHECK (char_length(intention) <= 500),
  streak_count INTEGER NOT NULL DEFAULT 1,
  light_score_snapshot INTEGER DEFAULT 0,
  light_level_snapshot TEXT DEFAULT 'presence',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each user can only check in once per day
  UNIQUE (user_id, checkin_date)
);

-- Indexes
CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins (user_id, checkin_date DESC);
CREATE INDEX idx_daily_checkins_date ON public.daily_checkins (checkin_date);

-- RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-ins
CREATE POLICY "Users can view own checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own check-in
CREATE POLICY "Users can insert own checkin"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all check-ins
CREATE POLICY "Admins can view all checkins"
  ON public.daily_checkins FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to auto-calculate streak on insert
CREATE OR REPLACE FUNCTION public.calculate_checkin_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_checkin DATE;
  v_last_streak INTEGER;
BEGIN
  -- Get previous check-in
  SELECT checkin_date, streak_count
  INTO v_last_checkin, v_last_streak
  FROM daily_checkins
  WHERE user_id = NEW.user_id
    AND checkin_date < NEW.checkin_date
  ORDER BY checkin_date DESC
  LIMIT 1;

  -- Calculate streak
  IF v_last_checkin IS NOT NULL AND (NEW.checkin_date - v_last_checkin) = 1 THEN
    NEW.streak_count := v_last_streak + 1;
  ELSE
    NEW.streak_count := 1;
  END IF;

  -- Snapshot current light score
  SELECT light_score, COALESCE(light_level, 'presence')
  INTO NEW.light_score_snapshot, NEW.light_level_snapshot
  FROM profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_checkin_streak
  BEFORE INSERT ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_checkin_streak();

-- Update consistency_days on profiles after check-in
CREATE OR REPLACE FUNCTION public.update_consistency_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET consistency_days = NEW.streak_count
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_consistency_on_checkin
  AFTER INSERT ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consistency_on_checkin();
