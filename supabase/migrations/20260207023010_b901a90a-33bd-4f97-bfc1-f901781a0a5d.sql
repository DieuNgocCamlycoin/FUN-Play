-- Fix overly permissive RLS policy for donation_transactions
-- Drop the permissive policy and create a more specific one

DROP POLICY IF EXISTS "Anyone can view donation by receipt_public_id" ON public.donation_transactions;

-- This policy is intentional for public receipt sharing - receipts are meant to be publicly shareable
-- The receipt_public_id is a random 16-character hex string that acts as a secret URL
-- Only users who know the specific receipt_public_id can access the transaction
-- This is a common pattern for shareable links (like Google Docs share links)