
-- Xóa 2 pplp_mint_requests có amount = 0 (Tú Nguyễn và Đức Thắng)
DELETE FROM pplp_mint_requests WHERE id IN ('19b2c2bd-7ac1-4e61-bfd7-927f0658cae6', '97d4de5d-9217-45f9-93af-870881deaa2a');

-- Cập nhật mint_requests gốc về trạng thái approved (không còn tham chiếu multisig)
UPDATE mint_requests SET status = 'approved', decision_reason = 'Reset: multisig request had 0 FUN' WHERE id IN ('123ee239-e709-46d3-93f5-a56a260ffd70', '1467b4fc-5a80-4602-bf80-4700c866a858');
