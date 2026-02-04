-- Bảng sessions
CREATE TABLE public.angel_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Cuộc trò chuyện mới',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bảng messages  
CREATE TABLE public.angel_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.angel_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  provider text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.angel_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angel_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho sessions (users quản lý session của mình)
CREATE POLICY "Users can view own sessions" 
  ON public.angel_chat_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" 
  ON public.angel_chat_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
  ON public.angel_chat_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
  ON public.angel_chat_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies cho messages (thông qua session ownership)
CREATE POLICY "Users can view own messages" 
  ON public.angel_chat_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.angel_chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages" 
  ON public.angel_chat_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.angel_chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_angel_chat_sessions_user_id ON public.angel_chat_sessions(user_id);
CREATE INDEX idx_angel_chat_sessions_updated_at ON public.angel_chat_sessions(updated_at DESC);
CREATE INDEX idx_angel_chat_messages_session_id ON public.angel_chat_messages(session_id);
CREATE INDEX idx_angel_chat_messages_created_at ON public.angel_chat_messages(created_at);