-- Create wallet_links table for cross-platform wallet synchronization
CREATE TABLE public.wallet_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'fun_wallet',
  linked_at TIMESTAMPTZ DEFAULT now(),
  is_primary BOOLEAN DEFAULT false,
  sync_status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.wallet_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wallet links"
  ON public.wallet_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet links"
  ON public.wallet_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet links"
  ON public.wallet_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallet links"
  ON public.wallet_links FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for cross-platform sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_links;

-- Create index for faster queries
CREATE INDEX idx_wallet_links_user_id ON public.wallet_links(user_id);
CREATE INDEX idx_wallet_links_wallet_address ON public.wallet_links(wallet_address);