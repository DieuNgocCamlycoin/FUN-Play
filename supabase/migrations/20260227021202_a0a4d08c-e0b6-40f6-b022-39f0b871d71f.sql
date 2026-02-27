-- Add unique constraint for mint_allocations upsert
ALTER TABLE public.mint_allocations 
  ADD CONSTRAINT uq_mint_allocations_epoch_user UNIQUE (epoch_id, user_id);