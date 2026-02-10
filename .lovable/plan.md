

# Hoàn thiện Mô hình Truy cập 3 Tầng — FUN.RICH Access Model

---

## Tổng quan hiện trạng

Sau đợt triển khai trước, các trang **Watch, Shorts, MusicDetail, Wallet, Transactions, RewardHistory, FunMoneyPage** đã được mở cho khách. Tuy nhiên vẫn còn **nhiều trang và tương tác chưa được cập nhật** theo đúng mô hình 3 tầng.

### Những gì cần hoàn thiện:

---

## 1. Nâng cấp AuthRequiredDialog — Thiết kế song ngữ với danh sách gạch đầu dòng

**File: `src/components/Auth/AuthRequiredDialog.tsx`**

Hiện tại popup chỉ có 1 dòng tiếng Việt. Cần cập nhật theo đúng thiết kế mới:

```text
+----------------------------------------------+
|                                              |
|   VUI LONG DANG KY DE                       |
|   - DUOC CHOI                               |
|   - DUOC HOC                                |
|   - DUOC VOC                                |
|   - DUOC LI XI                              |
|                                              |
|   PLEASE REGISTER FOR                       |
|   - USE & EARN                              |
|   - LEARN & EARN                            |
|   - GIVE & GAIN                             |
|   - REVIEW & REWARD                         |
|                                              |
|   [Dang ky / Dang nhap]     [Dong]          |
+----------------------------------------------+
```

---

## 2. Cập nhật Channel.tsx — Thay redirect bằng AuthRequiredDialog

**File: `src/pages/Channel.tsx`**

- Dòng 229-232: Thay `navigate("/auth")` bằng `setShowAuthDialog(true)`
- Thêm state `showAuthDialog` và render `AuthRequiredDialog`

---

## 3. Cập nhật UserProfile.tsx — Thay redirect bằng AuthRequiredDialog

**File: `src/pages/UserProfile.tsx`**

- Dòng 155-158: Thay `navigate("/auth")` bằng `setShowAuthDialog(true)`
- Thêm state `showAuthDialog` và render `AuthRequiredDialog`

---

## 4. Cập nhật PostDetail.tsx — Thêm bảo vệ tương tác

**File: `src/pages/PostDetail.tsx`**

- PostDetail hiện đã mở cho khách xem (không redirect), nhưng các component con (PostReactions, PostComments) cần được bảo vệ
- Trang này hiện không có auth guard — cần thêm `AuthRequiredDialog` để bảo vệ tương tác like/comment

---

## 5. Cập nhật WatchHistory.tsx — Hiện empty state cho khách

**File: `src/pages/WatchHistory.tsx`**

- Hiện tại trang hoạt động bình thường nhưng khách chưa đăng nhập sẽ thấy danh sách trống
- Thêm kiểm tra `if (!user)` để hiện thông báo thân thiện: "Đăng nhập để lưu lịch sử xem"

---

## 6. Cập nhật WatchLater.tsx — Hiện empty state cho khách

**File: `src/pages/WatchLater.tsx`**

- Tương tự WatchHistory — thêm empty state cho khách chưa đăng nhập
- Thông báo: "Đăng nhập để lưu video xem sau"

---

## 7. Cập nhật Referral.tsx — Cho khách xem nội dung giới thiệu

**File: `src/pages/Referral.tsx`**

- Hiện tại trang đã mở nhưng referralCode dựa trên `user?.id` — nếu chưa đăng nhập sẽ hiện mã rỗng
- Thêm phần hiển thị gợi ý: "Đăng nhập để nhận mã giới thiệu cá nhân"
- Giữ nội dung giải thích chương trình luôn hiện cho khách đọc

---

## 8. Cập nhật FunWallet.tsx — Cho khách xem thông tin

**File: `src/pages/FunWallet.tsx`**

- Hiện tại trang đã mở, nhưng cần thêm thông báo cho khách: "Đăng nhập để kết nối và sử dụng FUN Wallet"
- Các nút tương tác (kết nối ví, gửi token) cần được bảo vệ bằng `AuthRequiredDialog`

---

## Tóm tắt file cần thay đổi

| # | File | Loại thay đổi |
|---|------|---------------|
| 1 | `AuthRequiredDialog.tsx` | Nâng cấp thiết kế song ngữ, danh sách gạch đầu dòng |
| 2 | `Channel.tsx` | Thay `navigate("/auth")` bằng `AuthRequiredDialog` |
| 3 | `UserProfile.tsx` | Thay `navigate("/auth")` bằng `AuthRequiredDialog` |
| 4 | `PostDetail.tsx` | Thêm `AuthRequiredDialog` cho tương tác |
| 5 | `WatchHistory.tsx` | Thêm empty state cho khách |
| 6 | `WatchLater.tsx` | Thêm empty state cho khách |
| 7 | `Referral.tsx` | Hiện nội dung public, gợi ý đăng nhập cho mã giới thiệu |
| 8 | `FunWallet.tsx` | Bảo vệ tương tác, hiện thông tin public |

### Các trang giữ nguyên redirect (quản lý cá nhân)

Profile, ProfileSettings, Upload, CreatePost, EditPost, EditVideo, ManagePosts, ManagePlaylists, ManageChannel, Studio, YourVideos, YourVideosMobile, Messages, Notifications, UnifiedAdminDashboard

### Các trang đã hoàn thành từ đợt trước

Watch, Shorts, MusicDetail, Wallet, Transactions, RewardHistory, FunMoneyPage, Library, Subscriptions, LikedVideos, MyAIMusic, Leaderboard, CAMLYPrice, Meditate, BrowseMusic, Search, Bounty, PlatformDocs, NFTGallery, UserDashboard

