## Trạng thái triển khai PPLP Light Score & FUN Money

### ĐÃ HOÀN THÀNH ✅
- Công thức PPLP Score: 6 trụ × Reputation Weight × Consistency Multiplier – Integrity Penalty
- Light Level classification (presence/contributor/builder/guardian/architect) trong RPC
- Server-side `calculate_user_light_score` đầy đủ multipliers
- `useLightActivity.ts` và `LightActivityBreakdown.tsx` cập nhật với multipliers
- **Ẩn điểm chi tiết trên profile công khai** - chỉ hiển thị Light Level badge
- **Bỏ bảng xếp hạng cạnh tranh** - đổi từ "TOP RANKING" (CAMLY) sang "LIGHT COMMUNITY"
- `LightLevelBadge.tsx` component hiển thị level label trên avatar
- `useLightCommunity.ts` hook thay thế `useTopRanking.ts` cho sidebar cards

### GHI NHỚ TƯƠNG LAI (chưa triển khai)
| Tính năng | Lý do |
|---|---|
| Mint Pool theo chu kỳ tuần/tháng | Cần thiết kế Mint Pool engine + cron job |
| 8 Câu Thần Chú PPLP | Cần UI flow + bảng `pplp_mantras_confirmed` |
| Cam kết 5 lời hứa cộng đồng | Cần UI + bảng tracking |
| Staking CAMLY tăng Reputation Weight | Chưa có smart contract |
| Mint không tức thì (delay mechanism) | Cần redesign mint flow |
| AI phát hiện spam cảm xúc giả | Cần tích hợp AI riêng |
| ~~Light Check-in hàng ngày~~ | ✅ Bảng `daily_checkins` đã tạo + tích hợp vào `calculate_user_light_score` RPC (checkin_bonus max 10 điểm) |
| Cross-platform contribution score | Chưa có FUN Academy, FUN Earth, FUN Legal |
