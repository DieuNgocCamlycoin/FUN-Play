-- =============================================
-- PHASE 1: DONATION SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. Table: donate_tokens - Quản lý các loại token hỗ trợ
CREATE TABLE public.donate_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('internal', 'bsc')),
  contract_address TEXT,
  decimals INTEGER NOT NULL DEFAULT 18,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 99,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: internal_wallets - Balance nội bộ cho token off-chain
CREATE TABLE public.internal_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.donate_tokens(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token_id)
);

-- 3. Table: donation_transactions - Giao dịch tặng toàn diện
CREATE TABLE public.donation_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.donate_tokens(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  amount_usd NUMERIC,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  context_type TEXT NOT NULL DEFAULT 'global' CHECK (context_type IN ('global', 'post', 'video', 'comment')),
  context_id UUID,
  message TEXT,
  receipt_public_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  chain TEXT NOT NULL CHECK (chain IN ('internal', 'bsc')),
  tx_hash TEXT,
  block_number BIGINT,
  explorer_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT no_self_donation CHECK (sender_id != receiver_id)
);

-- 4. Table: user_chats - Quản lý chat giữa 2 users
CREATE TABLE public.user_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- 5. Table: chat_messages - Tin nhắn trong chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.user_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'donation', 'system')),
  content TEXT,
  donation_transaction_id UUID REFERENCES public.donation_transactions(id) ON DELETE SET NULL,
  deep_link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_donation_tx_sender ON public.donation_transactions(sender_id, created_at DESC);
CREATE INDEX idx_donation_tx_receiver ON public.donation_transactions(receiver_id, created_at DESC);
CREATE INDEX idx_donation_tx_status ON public.donation_transactions(status, created_at DESC);
CREATE INDEX idx_donation_tx_context ON public.donation_transactions(context_type, context_id);
CREATE INDEX idx_donation_tx_receipt ON public.donation_transactions(receipt_public_id);
CREATE INDEX idx_internal_wallets_user ON public.internal_wallets(user_id);
CREATE INDEX idx_chat_messages_chat ON public.chat_messages(chat_id, created_at DESC);
CREATE INDEX idx_user_chats_users ON public.user_chats(user1_id, user2_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.donate_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- donate_tokens: Public read, admin write
CREATE POLICY "Tokens are viewable by everyone"
  ON public.donate_tokens FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tokens"
  ON public.donate_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- internal_wallets: Owner and admin can view
CREATE POLICY "Users can view own internal wallet"
  ON public.internal_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all internal wallets"
  ON public.internal_wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own internal wallet"
  ON public.internal_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage internal wallets"
  ON public.internal_wallets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- donation_transactions: Sender/receiver can view, public via receipt_public_id
CREATE POLICY "Users can view own sent donations"
  ON public.donation_transactions FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view own received donations"
  ON public.donation_transactions FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Anyone can view donation by receipt_public_id"
  ON public.donation_transactions FOR SELECT
  USING (receipt_public_id IS NOT NULL);

CREATE POLICY "Admins can view all donations"
  ON public.donation_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create donations"
  ON public.donation_transactions FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can update donations"
  ON public.donation_transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- user_chats: Only participants can view
CREATE POLICY "Users can view own chats"
  ON public.user_chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats"
  ON public.user_chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own chats"
  ON public.user_chats FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- chat_messages: Only chat participants can view/create
CREATE POLICY "Users can view messages in their chats"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_chats
      WHERE id = chat_messages.chat_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in their chats"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.user_chats
      WHERE id = chat_messages.chat_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- =============================================
-- SEED DATA: TOKENS
-- =============================================

INSERT INTO public.donate_tokens (symbol, name, chain, contract_address, decimals, is_enabled, priority, icon_url)
VALUES 
  ('FUNM', 'FUN Money', 'internal', NULL, 0, true, 1, '/images/fun-wallet-logo.png'),
  ('CAMLY', 'Camly Coin', 'bsc', '0x0910320181889fefde0bb1ca63962b0a8882e413', 3, true, 2, '/images/camly-coin.png'),
  ('BNB', 'Binance Coin', 'bsc', 'native', 18, true, 3, 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035'),
  ('USDT', 'Tether USD', 'bsc', '0x55d398326f99059fF775485246999027B3197955', 18, true, 4, 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035');

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_wallets;

-- =============================================
-- TRIGGER: Update internal_wallets.updated_at
-- =============================================

CREATE TRIGGER update_internal_wallets_updated_at
  BEFORE UPDATE ON public.internal_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_chats_updated_at
  BEFORE UPDATE ON public.user_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();