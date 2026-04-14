
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'zoom_session',
  ADD COLUMN IF NOT EXISTS source_platform text,
  ADD COLUMN IF NOT EXISTS zoom_meeting_id text;
