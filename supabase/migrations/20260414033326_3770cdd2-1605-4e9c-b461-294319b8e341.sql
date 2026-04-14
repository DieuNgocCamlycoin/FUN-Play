
-- =============================================
-- Zoom / Love House Attendance System
-- PRD Section 9
-- =============================================

-- 1. Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  platform_links JSONB DEFAULT '[]'::jsonb,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  recording_hash VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events they host"
  ON public.events FOR SELECT
  USING (auth.uid() = host_user_id);

CREATE POLICY "Authenticated users can view active events"
  ON public.events FOR SELECT
  TO authenticated
  USING (status IN ('scheduled', 'live', 'completed'));

CREATE POLICY "Users can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_user_id);

CREATE INDEX idx_events_host ON public.events(host_user_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start ON public.events(start_at);

-- 2. Love House Groups table
CREATE TABLE public.love_house_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  leader_user_id UUID NOT NULL,
  love_house_id VARCHAR(100),
  location TEXT,
  expected_count INT DEFAULT 0,
  actual_count INT DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.love_house_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders can view their groups"
  ON public.love_house_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = leader_user_id);

CREATE POLICY "Event hosts can view groups"
  ON public.love_house_groups FOR SELECT
  TO authenticated
  USING (event_id IN (SELECT id FROM public.events WHERE host_user_id = auth.uid()));

CREATE POLICY "Authenticated can view groups for active events"
  ON public.love_house_groups FOR SELECT
  TO authenticated
  USING (event_id IN (SELECT id FROM public.events WHERE status IN ('scheduled', 'live', 'completed')));

CREATE POLICY "Leaders can create groups"
  ON public.love_house_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = leader_user_id);

CREATE POLICY "Leaders can update their groups"
  ON public.love_house_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = leader_user_id);

CREATE INDEX idx_groups_event ON public.love_house_groups(event_id);
CREATE INDEX idx_groups_leader ON public.love_house_groups(leader_user_id);

-- 3. Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.love_house_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 0,
  confirmation_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  participation_factor NUMERIC(3,2) DEFAULT 0.00,
  leader_confirmed BOOLEAN DEFAULT FALSE,
  reflection_submitted BOOLEAN DEFAULT FALSE,
  reflection_text TEXT,
  linked_action_id UUID REFERENCES public.user_actions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Group leaders can view attendance in their groups"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (group_id IN (SELECT id FROM public.love_house_groups WHERE leader_user_id = auth.uid()));

CREATE POLICY "Users can check in (insert attendance)"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can update attendance in their groups"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (group_id IN (SELECT id FROM public.love_house_groups WHERE leader_user_id = auth.uid()));

CREATE INDEX idx_attendance_group ON public.attendance(group_id);
CREATE INDEX idx_attendance_user ON public.attendance(user_id);
CREATE INDEX idx_attendance_status ON public.attendance(confirmation_status);

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.love_house_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
