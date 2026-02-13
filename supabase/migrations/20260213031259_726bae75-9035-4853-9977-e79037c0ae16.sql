
-- Bật RLS cho bảng snapshot (chỉ admin xem được)
ALTER TABLE reward_snapshot_20260213 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view snapshot"
ON reward_snapshot_20260213
FOR SELECT
USING (has_role(auth.uid(), 'admin'));
