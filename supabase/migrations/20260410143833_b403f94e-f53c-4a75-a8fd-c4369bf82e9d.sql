-- First delete referencing rows in pplp_mint_requests
DELETE FROM public.pplp_mint_requests 
WHERE source_mint_request_id IN (
  SELECT id FROM public.mint_requests 
  WHERE calculated_amount_atomic = '0' 
     OR calculated_amount_atomic = '' 
     OR calculated_amount_atomic IS NULL
);

-- Then delete the 0 FUN mint requests
DELETE FROM public.mint_requests 
WHERE calculated_amount_atomic = '0' 
   OR calculated_amount_atomic = '' 
   OR calculated_amount_atomic IS NULL;