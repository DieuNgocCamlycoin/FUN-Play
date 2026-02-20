

## Them nut quay lai (Back Button) cho tat ca cac trang

### Phan tich hien trang

**Cac trang DA CO nut quay lai (15 trang):**
- Transactions, ProfileSettings, WatchLater, Shorts, YourVideosMobile, WatchHistory, CreatePost, PostDetail, Subscriptions, MusicDetail, Notifications, Messages, Wallet, LikedVideos, RewardHistory

**Cac trang CHUA CO nut quay lai (can them):**

| STT | Trang | Ghi chu |
|-----|-------|---------|
| 1 | UsersDirectory | Header co logo + tieu de, thieu nut quay lai |
| 2 | Leaderboard | Header text-center, thieu nut quay lai |
| 3 | NFTGallery | Header co icon + tieu de, thieu nut quay lai |
| 4 | Bounty | Header text-center, thieu nut quay lai |
| 5 | FunMoneyPage | Header co tieu de, thieu nut quay lai |
| 6 | CAMLYPrice | Header co token info, thieu nut quay lai |
| 7 | Meditate | Header text-center, thieu nut quay lai |
| 8 | BrowseMusic | Header co tieu de, thieu nut quay lai |
| 9 | Referral | Header text-center, thieu nut quay lai |
| 10 | PlatformDocs | Header co tabs, thieu nut quay lai |
| 11 | Library | Header co tieu de, thieu nut quay lai |
| 12 | Search | Can kiem tra them |
| 13 | Channel | Can kiem tra them |

**Trang KHONG CAN nut quay lai** (trang chinh):
- Index (Home) - trang chu

---

### Chien luoc

**Tao 1 component `BackButton` tai su dung**, sau do them vao tung trang thieu.

### Thay doi 1: Tao component BackButton

**Tep moi**: `src/components/ui/back-button.tsx`

Component don gian:
- Su dung `useNavigate` tu react-router-dom
- Icon `ArrowLeft` tu lucide-react
- Goi `navigate(-1)` khi click
- Style giong voi cac trang da co: `Button variant="ghost" size="icon"`

### Thay doi 2-13: Them BackButton vao cac trang

Moi trang se duoc them nut quay lai vao phan header, truoc tieu de. Logic:
- Trang co header ngang (flex row): them BackButton vao dau hang
- Trang co header giua (text-center): them BackButton phia tren ben trai

### Danh sach tep thay doi

| STT | Tep | Noi dung |
|-----|-----|---------|
| 1 | `src/components/ui/back-button.tsx` | Tao component moi |
| 2 | `src/pages/UsersDirectory.tsx` | Them BackButton vao header |
| 3 | `src/pages/Leaderboard.tsx` | Them BackButton phia tren trai |
| 4 | `src/pages/NFTGallery.tsx` | Them BackButton vao header |
| 5 | `src/pages/Bounty.tsx` | Them BackButton phia tren trai |
| 6 | `src/pages/FunMoneyPage.tsx` | Them BackButton vao header |
| 7 | `src/pages/CAMLYPrice.tsx` | Them BackButton vao header |
| 8 | `src/pages/Meditate.tsx` | Them BackButton phia tren trai |
| 9 | `src/pages/BrowseMusic.tsx` | Them BackButton vao header |
| 10 | `src/pages/Referral.tsx` | Them BackButton phia tren trai |
| 11 | `src/pages/PlatformDocs.tsx` | Them BackButton vao header |
| 12 | `src/pages/Library.tsx` | Them BackButton vao header |
| 13 | `src/pages/Channel.tsx` | Them BackButton vao header |

### Ket qua

- Tat ca trang phu deu co nut mui ten quay lai
- Nguoi dung co the de dang quay ve trang truoc do
- Thong nhat UX tren toan bo ung dung
- Component tai su dung, de bao tri

