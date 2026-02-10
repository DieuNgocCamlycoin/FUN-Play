

# Mở cửa toàn bộ trang cho khách xem — chỉ popup khi tương tác

---

## Tổng quan

Hiện tại nhiều trang đang redirect về `/auth` khi chưa đăng nhập. Cần thay đổi để:

1. **Tất cả trang nội dung** — cho khách vào xem tự do, không redirect.
2. **Các trang quản lý cá nhân** — giữ redirect vì cần thao tác cá nhân.
3. **Khi khách bấm tương tác** (like, comment, subscribe, donate, save...) — hiện **popup giữa màn hình** thay vì redirect.

---

## Chi tiết kỹ thuật

### 1. Tạo component `AuthRequiredDialog`

**File mới: `src/components/Auth/AuthRequiredDialog.tsx`**

- Dialog hiện giữa màn hình
- Nội dung: "VUI LÒNG ĐĂNG KÝ ĐỂ ĐƯỢC CHƠI, ĐƯỢC HỌC, ĐƯỢC VỌC, ĐƯỢC LÌ XÌ 🧧"
- 2 nút: "Đăng ký / Đăng nhập" (navigate tới /auth) và "Đóng"
- Thiết kế theo FUN PLAY Design System (gradient border, nền tối, chữ holographic)

### 2. Tạo hook `useRequireAuth`

**File mới: `src/hooks/useRequireAuth.ts`**

```typescript
const { user } = useAuth();
const [showAuthDialog, setShowAuthDialog] = useState(false);

const requireAuth = useCallback((action: () => void) => {
  if (user) { action(); }
  else { setShowAuthDialog(true); }
}, [user]);

return { requireAuth, showAuthDialog, setShowAuthDialog, AuthDialog };
```

Hook này trả về hàm `requireAuth(callback)` — nếu chưa đăng nhập thì hiện popup, nếu đã đăng nhập thì chạy callback.

### 3. Cập nhật các trang nội dung — bỏ redirect, cho xem tự do

| Trang | Thay đổi |
|-------|----------|
| `Watch.tsx` | Bỏ redirect. Wrap handleLike, handleDislike, handleSubscribe, handleComment với `requireAuth()` |
| `Shorts.tsx` | Bỏ redirect. Wrap like/comment/subscribe với `requireAuth()` |
| `Channel.tsx` | Đã open. Wrap handleSubscribe với `requireAuth()` |
| `UserProfile.tsx` | Đã open. Wrap handleSubscribe với `requireAuth()` |
| `MusicDetail.tsx` | Bỏ redirect. Wrap handleLike với `requireAuth()` |
| `PostDetail.tsx` | Bỏ redirect. Wrap like/comment với `requireAuth()` |
| `Wallet.tsx` | Bỏ redirect, hiện nội dung public (giá CAMLY, top sponsors). Wrap claim/connect wallet với `requireAuth()` |
| `Transactions.tsx` | Bỏ redirect, hiện empty state "Đăng nhập để xem lịch sử" |
| `Library.tsx` | Đã có empty state. Giữ nguyên |
| `Subscriptions.tsx` | Đã có empty state. Giữ nguyên |
| `LikedVideos.tsx` | Đã có empty state. Giữ nguyên |
| `WatchHistory.tsx` | Bỏ redirect, hiện empty state |
| `WatchLater.tsx` | Bỏ redirect, hiện empty state |
| `MyAIMusic.tsx` | Đã có empty state. Giữ nguyên |
| `Leaderboard.tsx` | Đã open. Không cần thay đổi |
| `CAMLYPrice.tsx` | Đã open. Không cần thay đổi |
| `Meditate.tsx` | Đã open. Không cần thay đổi |
| `BrowseMusic.tsx` | Đã open. Không cần thay đổi |
| `Search.tsx` | Đã open. Không cần thay đổi |
| `Bounty.tsx` | Đã open. Không cần thay đổi |
| `PlatformDocs.tsx` | Đã open. Không cần thay đổi |
| `NFTGallery.tsx` | Đã open. Không cần thay đổi |
| `Referral.tsx` | Bỏ redirect, hiện nội dung public |
| `FunWallet.tsx` | Bỏ redirect, hiện nội dung public |
| `FunMoneyPage.tsx` | Bỏ redirect, hiện nội dung public |
| `UserDashboard.tsx` | Đã có empty state. Giữ nguyên |
| `RewardHistory.tsx` | Bỏ redirect, hiện empty state |

### 4. Giữ nguyên các trang quản lý (vẫn redirect /auth)

- Profile, ProfileSettings, Upload, CreatePost, EditVideo, EditPost
- ManagePosts, ManagePlaylists, ManageChannel, Studio, YourVideos, YourVideosMobile
- Messages, Notifications, UnifiedAdminDashboard

---

## Tóm tắt file cần thay đổi

| # | File | Loại thay đổi |
|---|------|---------------|
| 1 | `src/components/Auth/AuthRequiredDialog.tsx` | **Tạo mới** — popup "Vui lòng đăng ký" |
| 2 | `src/hooks/useRequireAuth.ts` | **Tạo mới** — hook bảo vệ tương tác |
| 3 | `src/pages/Watch.tsx` | Bỏ redirect, wrap interactions với requireAuth |
| 4 | `src/pages/Shorts.tsx` | Bỏ redirect, wrap interactions với requireAuth |
| 5 | `src/pages/MusicDetail.tsx` | Bỏ redirect, wrap handleLike |
| 6 | `src/pages/PostDetail.tsx` | Bỏ redirect, wrap interactions |
| 7 | `src/pages/Wallet.tsx` | Bỏ redirect, hiện nội dung public |
| 8 | `src/pages/Transactions.tsx` | Bỏ redirect, hiện empty state |
| 9 | `src/pages/WatchHistory.tsx` | Bỏ redirect, hiện empty state |
| 10 | `src/pages/WatchLater.tsx` | Bỏ redirect, hiện empty state |
| 11 | `src/pages/RewardHistory.tsx` | Bỏ redirect, hiện empty state |
| 12 | `src/pages/Referral.tsx` | Bỏ redirect, hiện nội dung |
| 13 | `src/pages/FunWallet.tsx` | Bỏ redirect, hiện nội dung |
| 14 | `src/pages/FunMoneyPage.tsx` | Bỏ redirect, hiện nội dung |

