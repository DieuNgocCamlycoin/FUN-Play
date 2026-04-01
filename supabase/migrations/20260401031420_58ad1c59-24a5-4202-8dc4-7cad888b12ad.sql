-- Reopen March epoch to recalculate with newly PPLP-accepted users
UPDATE public.mint_epochs
SET status = 'draft', finalized_at = NULL
WHERE epoch_id = '617d3f5a-7e30-4d2a-a361-fdf8a2d30f31';

-- Also delete existing zero-allocations so they can be recalculated
DELETE FROM public.mint_allocations
WHERE epoch_id = '617d3f5a-7e30-4d2a-a361-fdf8a2d30f31';