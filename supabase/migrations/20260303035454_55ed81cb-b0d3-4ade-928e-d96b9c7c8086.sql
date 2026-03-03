
-- Thêm cột ghim tin nhắn vào chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid;

-- Index cho tìm tin nhắn ghim nhanh
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON public.chat_messages (chat_id, is_pinned) WHERE is_pinned = true;

-- RLS policy: cho phép thành viên chat cập nhật trạng thái ghim
CREATE POLICY "Chat members can pin messages"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_chats uc
    WHERE uc.id = chat_messages.chat_id
    AND (uc.user1_id = auth.uid() OR uc.user2_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_chats uc
    WHERE uc.id = chat_messages.chat_id
    AND (uc.user1_id = auth.uid() OR uc.user2_id = auth.uid())
  )
);
