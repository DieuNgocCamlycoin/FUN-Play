ALTER TABLE donation_transactions 
DROP CONSTRAINT IF EXISTS donation_transactions_context_type_check;

ALTER TABLE donation_transactions 
ADD CONSTRAINT donation_transactions_context_type_check 
CHECK (context_type = ANY (ARRAY['global','post','video','comment','claim']));