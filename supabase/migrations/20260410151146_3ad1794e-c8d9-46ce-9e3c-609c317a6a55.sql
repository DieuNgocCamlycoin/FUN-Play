
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function that calls the edge function
CREATE OR REPLACE FUNCTION public.trigger_auto_route_multisig()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_url text;
  service_key text;
BEGIN
  -- Only fire when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Skip if already routed (decision_reason mentions Multisig)
    IF NEW.decision_reason IS NOT NULL AND NEW.decision_reason LIKE '%Multisig%' THEN
      RETURN NEW;
    END IF;
    
    -- Skip 0 FUN requests
    IF NEW.calculated_amount_atomic IS NULL OR NEW.calculated_amount_atomic = '0' OR NEW.calculated_amount_atomic = '' THEN
      RETURN NEW;
    END IF;
    
    edge_url := rtrim(current_setting('app.settings.supabase_url', true), '/') || '/functions/v1/auto-route-multisig';
    
    -- If app.settings not available, construct from project ref
    IF edge_url IS NULL OR edge_url = '' OR edge_url = '/functions/v1/auto-route-multisig' THEN
      edge_url := 'https://fzgjmvxtgrlwrluxdwjq.supabase.co/functions/v1/auto-route-multisig';
    END IF;
    
    service_key := coalesce(
      current_setting('app.settings.service_role_key', true),
      current_setting('supabase.service_role_key', true)
    );
    
    -- Call edge function async via pg_net
    PERFORM net.http_post(
      url := edge_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claim.sub', true))
      ),
      body := jsonb_build_object('ids', ARRAY[NEW.id::text])
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_mint_request_approved ON public.mint_requests;
CREATE TRIGGER on_mint_request_approved
  AFTER UPDATE ON public.mint_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_route_multisig();
