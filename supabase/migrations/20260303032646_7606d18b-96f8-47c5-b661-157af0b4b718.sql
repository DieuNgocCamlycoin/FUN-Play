
-- Create chat_message_reactions table
CREATE TABLE public.chat_message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view reactions in their chats
CREATE POLICY "Users can view reactions in their chats"
ON public.chat_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.user_chats uc ON uc.id = cm.chat_id
    WHERE cm.id = chat_message_reactions.message_id
    AND (uc.user1_id = auth.uid() OR uc.user2_id = auth.uid())
  )
);

-- RLS: Users can add reactions
CREATE POLICY "Users can add reactions"
ON public.chat_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.user_chats uc ON uc.id = cm.chat_id
    WHERE cm.id = chat_message_reactions.message_id
    AND (uc.user1_id = auth.uid() OR uc.user2_id = auth.uid())
  )
);

-- RLS: Users can remove own reactions
CREATE POLICY "Users can remove own reactions"
ON public.chat_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;

-- Add reply_to_id to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN reply_to_id uuid REFERENCES public.chat_messages(id);
