
-- Add columns to attendance table
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id),
  ADD COLUMN IF NOT EXISTS attendance_confidence numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendance_mode text DEFAULT 'manual';

-- Add columns to love_house_groups table
ALTER TABLE public.love_house_groups
  ADD COLUMN IF NOT EXISTS group_name text,
  ADD COLUMN IF NOT EXISTS estimated_participants integer DEFAULT 0;

-- Add validation_digest to mint_records table
ALTER TABLE public.mint_records
  ADD COLUMN IF NOT EXISTS validation_digest text;
