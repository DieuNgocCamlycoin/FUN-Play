

## Phân tích: Đã triển khai vs Cần triển khai

### ĐÃ CÓ (từ các bước trước)
- Công thức PPLP Score với Reputation Weight × Consistency Multiplier × Sequence Multiplier – Integrity Penalty
- Light Level classification (presence/contributor/builder/guardian/architect) trong RPC
- Server-side `calculate_user_light_score` đầy đủ 6 trụ + multipliers
- `useLightActivity.ts` và `LightActivityBreakdown.tsx` đã cập nhật

### CẦN TRIỂN KHAI NGAY (3 thay đổi)

#### 1. Ẩn điểm chi tiết trên profile công khai (Channel.tsx)
Hiện tại `ProfileHeader` nhận `lightScore` số và truyền vào `DiamondBadge`. Cần:
- Thêm `lightLevel` prop vào `ProfileHeader`
- Hiển thị Light Level badge (text label) thay vì số điểm trên profile công khai
- DiamondBadge vẫn dùng `lightScore` cho hiệu ứng glow (không hiển thị số)

#### 2. Bỏ bảng xếp hạng cạnh tranh Top Ranking
Hiện tại `TopRankingCard` và `MobileTopRankingCard` hiển thị "TOP RANKING" theo `total_camly_rewards`. Theo tài liệu: "Không Top 1 – Top 2. Chỉ hiển thị Light Level cá nhân và xu hướng tăng trưởng."
- Chuyển từ ranking CAMLY sang hiển thị "Light Community" - danh sách Light Builders/Guardians
- Hoặc đổi thành hiển thị Light Level + growth trend thay vì số CAMLY

#### 3. Cập nhật plan.md và constitution docs
Ghi nhận các thay đổi đã triển khai và các mục tương lai.

### GHI NHỚ TƯƠNG LAI (chưa triển khai)
| Tính năng | Lý do |
|---|---|
| Mint Pool theo chu kỳ tuần/tháng | Cần thiết kế Mint Pool engine + cron job |
| 8 Câu Thần Chú PPLP | Cần UI flow + bảng `pplp_mantras_confirmed` |
| Cam kết 5 lời hứa cộng đồng | Cần UI + bảng tracking |
| Staking CAMLY tăng Reputation Weight | Chưa có smart contract |
| Mint không tức thì (delay mechanism) | Cần redesign mint flow |
| AI phát hiện spam cảm xúc giả | Cần tích hợp AI riêng |

### Thứ tự triển khai
1. Cập nhật `ProfileHeader.tsx` + `Channel.tsx` - hiển thị Light Level badge công khai
2. Cập nhật `TopRankingCard` + `MobileTopRankingCard` - đổi từ ranking cạnh tranh sang Light Community
3. Cập nhật `plan.md`

