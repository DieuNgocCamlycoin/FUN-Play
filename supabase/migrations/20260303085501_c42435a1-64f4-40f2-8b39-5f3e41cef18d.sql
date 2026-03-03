
-- Add is_deleted column to livestream_chat
ALTER TABLE public.livestream_chat ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

-- Create livestream_bans table
CREATE TABLE public.livestream_bans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livestream_id uuid NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(livestream_id, user_id)
);

-- Enable RLS
ALTER TABLE public.livestream_bans ENABLE ROW LEVEL SECURITY;

-- RLS: Streamer can update own livestream chat (to soft-delete)
CREATE POLICY "Streamer can soft-delete chat messages"
ON public.livestream_chat
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.livestreams
    WHERE livestreams.id = livestream_chat.livestream_id
    AND livestreams.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.livestreams
    WHERE livestreams.id = livestream_chat.livestream_id
    AND livestreams.user_id = auth.uid()
  )
);

-- RLS: Streamer can ban users in their livestream
CREATE POLICY "Streamer can ban users"
ON public.livestream_bans
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.livestreams
    WHERE livestreams.id = livestream_bans.livestream_id
    AND livestreams.user_id = auth.uid()
  )
  AND auth.uid() = banned_by
);

-- RLS: Anyone can view bans (needed to check if banned before sending)
CREATE POLICY "Anyone can view livestream bans"
ON public.livestream_bans
FOR SELECT
USING (true);

-- RLS: Streamer can delete bans (unban)
CREATE POLICY "Streamer can unban users"
ON public.livestream_bans
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.livestreams
    WHERE livestreams.id = livestream_bans.livestream_id
    AND livestreams.user_id = auth.uid()
  )
);

-- Update INSERT policy on livestream_chat to check ban
DROP POLICY IF EXISTS "Authenticated users can send chat" ON public.livestream_chat;
CREATE POLICY "Authenticated users can send chat if not banned"
ON public.livestream_chat
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.livestream_bans
    WHERE livestream_bans.livestream_id = livestream_chat.livestream_id
    AND livestream_bans.user_id = auth.uid()
  )
);

-- Enable realtime for livestream_bans
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_bans;
