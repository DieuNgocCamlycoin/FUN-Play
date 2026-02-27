

## Plan: Chuyển đổi Bảng Xếp Hạng CAMLY thành Light Community

### Vấn đề hiện tại
- Sidebar "LIGHT COMMUNITY" hiển thị đúng: Light Level (Seed, Sprout, Builder...) theo policy No Ego
- Nhưng khi click "Xem Light Community" → dẫn đến `/leaderboard` hiển thị **ranking theo CAMLY Rewards** (vi phạm No Ego)
- Hai nơi hiển thị mâu thuẫn: sidebar = Light Level, trang đích = CAMLY ranking

### Thay đổi cần thực hiện

#### 1. Chuyển đổi `Leaderboard.tsx` thành Light Community page
- Đổi tiêu đề: "Bảng Xếp Hạng" → "Light Community"
- Thay data source: từ `mv_top_ranking` (CAMLY) → `profiles` query theo `light_score` (giống `useLightCommunity`)
- Hiển thị Light Level + label thay vì số CAMLY Rewards
- Bỏ ranking numbers (#1, #2, #3) → chỉ hiển thị emoji level + tên + Light Level label
- Giữ avatar, tên, username nhưng không hiển thị điểm số thô
- Mô tả: "Những người đóng góp bền vững trong hệ sinh thái FUN Play"

#### 2. Cập nhật `useTopRanking.ts` → dùng cho Light Community
- Hook này đang query `mv_top_ranking` theo CAMLY — sẽ không còn dùng cho trang chính
- Trang Leaderboard sẽ dùng `useLightCommunity` hook (đã có sẵn) với limit=20

#### 3. Cập nhật route naming
- Giữ route `/leaderboard` nhưng component hiển thị Light Community
- Hoặc thêm redirect `/light-community` → cùng component

#### 4. Sidebar link giữ nguyên
- `TopRankingCard.tsx` và `MobileTopRankingCard.tsx` đã navigate đúng `/leaderboard`
- Chỉ cần trang đích hiển thị đúng Light Community

### Nguyên tắc No Ego được áp dụng
- Không hiển thị điểm số thô (light_score number)
- Không ranking #1, #2, #3
- Chỉ hiển thị: avatar, tên, Light Level label (Seed/Sprout/Builder/Guardian/Architect)
- Tôn vinh đóng góp bền vững, không cạnh tranh

