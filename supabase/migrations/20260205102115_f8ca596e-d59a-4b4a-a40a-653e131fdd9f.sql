-- Enable realtime for remaining tables (profiles already added)
-- Using DO block to handle cases where table might already be in publication

DO $$
BEGIN
  -- videos
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'videos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
  END IF;
  
  -- comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  
  -- subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
  
  -- reward_transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'reward_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_transactions;
  END IF;
END $$;