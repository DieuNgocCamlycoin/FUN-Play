
-- Sửa 4 giao dịch LIKE còn ở mức 5.000 về 2.000
UPDATE reward_transactions
SET amount = 2000
WHERE reward_type = 'LIKE'
  AND claimed = false
  AND amount != 2000;

-- Đồng bộ lại số dư cho tất cả người dùng
SELECT sync_reward_totals();
