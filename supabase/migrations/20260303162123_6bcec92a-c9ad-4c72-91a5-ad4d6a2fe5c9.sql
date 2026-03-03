ALTER TABLE public.pplp_mint_requests 
ADD COLUMN IF NOT EXISTS source_mint_request_id UUID REFERENCES public.mint_requests(id);