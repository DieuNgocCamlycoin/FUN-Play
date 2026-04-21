DELETE FROM public.pplp_mint_requests
WHERE amount_wei IS NULL
   OR amount_wei = ''
   OR CAST(amount_wei AS NUMERIC) <= 0;