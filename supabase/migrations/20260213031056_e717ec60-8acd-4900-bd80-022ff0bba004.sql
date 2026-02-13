
-- =====================================================
-- BƯỚC 1: LƯU BẢN SAO DỰ PHÒNG (SNAPSHOT)
-- =====================================================
CREATE TABLE IF NOT EXISTS reward_snapshot_20260213 AS 
SELECT * FROM reward_transactions;

-- =====================================================
-- BƯỚC 2: XÓA TẤT CẢ GIAO DỊCH TRÙNG LẶP
-- Giữ lại bản đầu tiên (cũ nhất) cho mỗi (user_id, video_id, reward_type)
-- =====================================================
DELETE FROM reward_transactions WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, video_id, reward_type
      ORDER BY created_at ASC
    ) as rn
    FROM reward_transactions
    WHERE reward_type IN ('LIKE','VIEW','COMMENT')
      AND video_id IS NOT NULL
  ) sub WHERE rn > 1
);

-- =====================================================
-- BƯỚC 3: CẬP NHẬT MỨC THƯỞNG THEO CÔNG THỨC MỚI
-- Chỉ áp dụng cho phần CHƯA CLAIM
-- =====================================================

-- LIKE: 5.000 -> 2.000
UPDATE reward_transactions
SET amount = 2000
WHERE reward_type = 'LIKE' AND claimed = false AND amount != 2000;

-- VIEW: chuẩn hóa về 5.000
UPDATE reward_transactions
SET amount = 5000
WHERE reward_type = 'VIEW' AND claimed = false AND amount != 5000;

-- =====================================================
-- BƯỚC 4: MỞ RỘNG CHECK CONSTRAINT CHO reward_actions
-- =====================================================
ALTER TABLE reward_actions
  DROP CONSTRAINT IF EXISTS reward_actions_action_type_check;
ALTER TABLE reward_actions
  ADD CONSTRAINT reward_actions_action_type_check
  CHECK (action_type IN ('VIEW', 'LIKE', 'SHARE', 'COMMENT'));

-- =====================================================
-- BƯỚC 5: BACKFILL reward_actions TỪ LỊCH SỬ HỢP LỆ
-- =====================================================
INSERT INTO reward_actions (user_id, video_id, action_type)
SELECT DISTINCT user_id, video_id, reward_type
FROM reward_transactions
WHERE reward_type IN ('LIKE','SHARE','VIEW','COMMENT')
  AND video_id IS NOT NULL
ON CONFLICT (user_id, video_id, action_type) DO NOTHING;

-- =====================================================
-- BƯỚC 6: TÍNH LẠI TOÀN BỘ SỐ DƯ NGƯỜI DÙNG
-- =====================================================
SELECT sync_reward_totals();
