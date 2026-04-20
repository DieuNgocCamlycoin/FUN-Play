CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='process-fun-claims-30min') THEN
    PERFORM cron.unschedule('process-fun-claims-30min');
  END IF;
END $$;

SELECT cron.schedule(
  'process-fun-claims-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fzgjmvxtgrlwrluxdwjq.supabase.co/functions/v1/process-fun-claims',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Z2ptdnh0Z3Jsd3JsdXhkd2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDQxMjAsImV4cCI6MjA3OTM4MDEyMH0.EJCatnPgh6bGQq21Ik45pq8lXtnlg-FtD2r2VW-gHdM"}'::jsonb,
    body := jsonb_build_object('cron', true, 'time', now())
  );
  $$
);