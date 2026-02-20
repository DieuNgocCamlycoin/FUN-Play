

## Biến Honor Board thành Clickable + Tăng cường Minh bạch Hệ thống

### Phân tích hiện trạng

Sau khi kiểm tra kỹ toàn bộ mã nguồn, hệ thống FUN PLAY **ĐÃ CÓ SẴN** phần lớn các tính năng được yêu cầu:

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Admin Dashboard | DA CO | 20+ tab: Users, Videos, Rewards, Abuse Detection, Banned Users, IP Tracking... |
| Users Directory | DA CO | Trang `/users` - danh sach cong khai, tim kiem, sap xep, filter |
| Report system | DA CO | Bang `video_reports`, component `ReportSpamButton` tren trang Watch va Mobile |
| Ban system | DA CO | Truong `banned`, `violation_level`, ban log, BannedScreen |
| Abuse detection | DA CO | IP tracking, suspicious scoring, Wallet Detective, fraud rings |
| Reward moderation | DA CO | Tab RewardApproval, FunMoneyApproval, RewardPool |

### Phan can lam MOI

Chi can **1 thay doi chinh**: Bien cac chi so Honor Board thanh **clickable** de dieu huong den cac trang tuong ung da co san.

---

### Thay doi 1: HonorBoardCard.tsx - Them onClick cho tung StatPill

**Tep**: `src/components/Layout/HonorBoardCard.tsx`

Them prop `onClick` vao component `StatPill` va gan hanh dong dieu huong:

| Chi so | Click vao | Dieu huong den |
|--------|-----------|----------------|
| TOTAL USERS | Trang danh sach nguoi dung | `/users` (da co san) |
| TOTAL POSTS | Trang chu (feed bai viet) | `/` (Home feed) |
| TOTAL PHOTOS | Trang chu | `/` |
| TOTAL VIDEOS | Trang chu (video tab) | `/` |
| TOTAL REWARD | Trang giao dich minh bach | `/transactions` (da co san) |

Logic:
- Import `useNavigate` tu react-router-dom
- Them prop `onClick?: () => void` vao `StatPill`
- Them `cursor-pointer` class khi co onClick
- Gan `navigate('/users')` cho TOTAL USERS
- Gan `navigate('/transactions')` cho TOTAL REWARD
- Cac chi so con lai dieu huong ve Home

### Thay doi 2: HonoboardRightSidebar.tsx - Truyen navigate xuong

Khong can thay doi file nay vi `HonorBoardCard` tu quan ly navigation ben trong.

---

### Danh sach tep thay doi

| STT | Tep | Noi dung |
|-----|-----|---------|
| 1 | `src/components/Layout/HonorBoardCard.tsx` | Them onClick cho StatPill, useNavigate, cursor-pointer |

### Ket qua

- Honor Board clickable, moi chi so dan den trang chi tiet tuong ung
- Tan dung toan bo cac trang va tinh nang DA CO SAN
- Khong tao them trang moi khong can thiet
- Khong anh huong hieu suat

### Ghi chu ve cac yeu cau khac

Cac tinh nang Admin Dashboard, Report, Ban, Abuse Detection da duoc xay dung day du truoc do. Neu can bo sung them tinh nang cu the nao trong Admin Dashboard (vi du: tab moi, filter moi), hay chi ro de trien khai rieng.

