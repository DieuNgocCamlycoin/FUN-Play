
-- Remove 4 invalid pplp_mint_requests with amount_wei = 0
DELETE FROM pplp_mint_requests 
WHERE id IN (
  '4b37c442-98c6-4441-9121-bf9f541d135d',
  '724191b4-939d-424c-809d-42be9ecafafb',
  'f0e3b822-0f80-4197-bc16-43eba0ae11ad',
  '0f674f5f-7e1b-4b06-958d-f3cf7a504850'
);

-- Reset corresponding mint_requests back to 'authorized' so admin can re-route after recalculation
UPDATE mint_requests 
SET status = 'pending', updated_at = now()
WHERE user_id IN (
  'fe573b23-b282-4c80-b750-b6fd4ad849af',
  '19f49a12-6b83-4037-97a1-3342d2ffc648',
  '02ed6b21-42d4-4553-b8d9-7e424be94464',
  '67c63c2b-567c-4604-8822-ac6c63239f4d'
)
AND status = 'approved'
AND calculated_amount_atomic = '0';
