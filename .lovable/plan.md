
# Kế Hoạch Tạo Trang Cá Nhân YouTube-Style (Đã Điều Chỉnh)

## Tổng Quan Thay Đổi Từ Kế Hoạch Trước

| Mục | Kế hoạch trước | Kế hoạch mới |
|-----|---------------|--------------|
| Quick actions chips | Chuyển đổi tài khoản, Google, Tối | **XÓA** - tích hợp vào Settings |
| Top icons | Cast, Bell, Search, Settings | **XÓA Cast** - chỉ Bell, Search, Settings |
| Phim ảnh / Ảnh | Có | **XÓA** |
| Video của bạn | Không có mũi tên | **THÊM mũi tên >** để chỉ rõ có thêm mục bên trong |

---

## Cấu Trúc Trang Profile Mới (Đã Điều Chỉnh)

```text
/profile - Trang cá nhân mobile
├── Header (Simple)
│   ├── [Bell] [Search] [Settings]  ← XÓA Cast
│   └── Settings → navigate đến /settings (tích hợp các action)
│
├── User Info Section
│   ├── Avatar tròn (72px) + Rainbow border
│   ├── Tên kênh + @username  
│   ├── Số người đăng ký • Số video
│   └── Link "Xem kênh >" → /channel/:id
│
├── Video đã xem (horizontal carousel)
│   ├── Thumbnail nhỏ + progress bar + title
│   ├── Nút "Xem tất cả" → /history
│   └── Empty state nếu chưa xem video nào
│
├── Danh sách phát (horizontal carousel)
│   ├── "Xem sau" playlist đặc biệt (icon ⏰)
│   ├── User playlists 
│   ├── Nút [+] tạo playlist mới
│   └── "Xem tất cả" → /manage-playlists
│
├── Menu Items (List với icons)
│   ├── ▶ Video của bạn [→ mũi tên] 
│   │   └── Tap → /your-videos-mobile (tabs: Video, Shorts, Live, Playlists, Posts)
│   └── ↓ Nội dung tải xuống [checkmark nếu có]
│       └── Tap → /downloads
│
└── Bottom padding cho MobileBottomNav (pb-20)
```

---

## Files Sẽ Tạo/Sửa

| Action | File | Mô tả |
|--------|------|-------|
| CREATE | `src/pages/Profile.tsx` | Trang cá nhân mobile chính (KHÔNG có quick actions, KHÔNG có Cast) |
| CREATE | `src/pages/YourVideosMobile.tsx` | Trang quản lý video mobile với tabs |
| CREATE | `src/pages/DownloadedVideos.tsx` | Trang xem video offline từ IndexedDB |
| CREATE | `src/hooks/useOfflineVideos.ts` | Hook quản lý video offline (IndexedDB API) |
| EDIT | `src/components/Layout/MobileBottomNav.tsx` | Đổi nút "Bạn" từ `/your-videos` → `/profile` |
| EDIT | `src/App.tsx` | Thêm 3 routes mới: `/profile`, `/your-videos-mobile`, `/downloads` |

---

## Chi Tiết Kỹ Thuật

### 1. Profile.tsx - Giao Diện Chi Tiết

```text
┌─────────────────────────────────────┐
│               [🔔] [🔍] [⚙️]        │ ← Header đơn giản (XÓA Cast)
├─────────────────────────────────────┤
│                                     │
│      [Avatar 72px với rainbow]      │
│     Tên hiển thị đầy đủ             │
│     @username                        │
│     15 người đăng ký • 5 video      │
│     Xem kênh >                       │ ← Link đến /channel/:id
│                                     │
├─────────────────────────────────────┤
│ Video đã xem            [Xem tất cả]│
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ →           │
│ │▓▓▓│ │▓░░│ │░░░│ │░░░│             │ ← Progress bar
│ └───┘ └───┘ └───┘ └───┘             │
│ Title...  Title...  Title...        │
├─────────────────────────────────────┤
│ Danh sách phát                [+]   │
│ ┌───┐ ┌───┐ ┌───┐ →                 │
│ │ ⏰ │ │ ≡ │ │ ≡ │                   │
│ │ 5  │ │ 3 │ │ 2 │                   │ ← Số video trong playlist
│ └───┘ └───┘ └───┘                   │
│ Xem sau  Yêu thích  Study...        │
├─────────────────────────────────────┤
│                                     │
│  ▶ Video của bạn               [>]  │ ← THÊM mũi tên > bên phải
│  ↓ Nội dung tải xuống          [✓]  │ ← Badge nếu có video offline
│                                     │
└─────────────────────────────────────┘
│  Home  Shorts  [+]  Đăng ký  Bạn   │
└─────────────────────────────────────┘
```

### 2. Hooks và Data

```typescript
// Profile.tsx sẽ sử dụng:
import { useProfile } from '@/hooks/useProfile';      // Avatar, username, display_name
import { useWatchHistory } from '@/hooks/useWatchHistory'; // Video đã xem
import { useOfflineVideos } from '@/hooks/useOfflineVideos'; // Video đã tải

// Fetch thêm:
- Channel info (subscriber_count, video count) từ channels table
- Playlists từ playlists table (filter by user_id)
- Watch Later count từ watch_later table
```

### 3. YourVideosMobile.tsx - Trang Quản Lý Video Mobile

```text
┌─────────────────────────────────────┐
│  [←]  Video của bạn      [Avatar]   │ ← Header với back button
├─────────────────────────────────────┤
│  [Video] [Shorts] [Live] [Playlist] [Posts] │ ← Tabs horizontal scroll
├─────────────────────────────────────┤
│  [Mới nhất ▼]  [Công khai]  [Riêng] │ ← Filter chips
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Thumb] Title của video        │ │
│ │         🌐 Công khai • 1.2K     │ │
│ │         2 ngày trước    [⋮]    │ │ ← 3-dot menu
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Thumb] Video thứ hai          │ │
│ │         🔒 Riêng tư • 0        │ │
│ │         5 ngày trước    [⋮]    │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 4. useOfflineVideos.ts Hook

```typescript
// Sử dụng IndexedDB API đã có trong VideoActionsBar.tsx
const DB_NAME = "FunPlayOfflineVideos";
const STORE_NAME = "videos";

interface OfflineVideo {
  id: string;
  title: string;
  thumbnail?: string;
  blob: Blob;
  downloadedAt: string;
}

// Functions:
- getAll(): Promise<OfflineVideo[]>
- getCount(): Promise<number>
- delete(id: string): Promise<void>
- getStorageSize(): Promise<number>
- createBlobUrl(id: string): Promise<string>
```

### 5. DownloadedVideos.tsx - Trang Video Offline

```text
┌─────────────────────────────────────┐
│  [←]  Nội dung tải xuống           │
├─────────────────────────────────────┤
│                                     │
│  Đã sử dụng: 125 MB / 500 MB       │ ← Storage indicator
│  [▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░]           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Thumb] Video đã tải 1         │ │
│ │         Tải xuống: 2 ngày trước │ │
│ │         45 MB         [🗑️]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Thumb] Video đã tải 2         │ │
│ │         Tải xuống: 5 ngày trước │ │
│ │         80 MB         [🗑️]      │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## Code Changes Chi Tiết

### MobileBottomNav.tsx

```diff
const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Zap, label: "Shorts", href: "/shorts" },
  { icon: Plus, label: "Tạo", href: null, isCreate: true },
  { icon: Users, label: "Đăng ký", href: "/subscriptions" },
- { icon: User, label: "Bạn", href: "/your-videos" },
+ { icon: User, label: "Bạn", href: "/profile" },
];
```

### App.tsx - Routes Mới

```typescript
// Thêm imports
import Profile from "./pages/Profile";
import YourVideosMobile from "./pages/YourVideosMobile";
import DownloadedVideos from "./pages/DownloadedVideos";

// Thêm routes
<Route path="/profile" element={<Profile />} />
<Route path="/your-videos-mobile" element={<YourVideosMobile />} />
<Route path="/downloads" element={<DownloadedVideos />} />
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Nút "Bạn" → trang table desktop | Nút "Bạn" → trang profile đẹp giống YouTube |
| Không có trang offline | Trang /downloads quản lý video offline |
| Không thấy lịch sử nhanh | Carousel video đã xem ngay trên profile |
| Không có mũi tên hướng dẫn | Mũi tên > rõ ràng ở "Video của bạn" |
| Có Cast icon không cần thiết | Giao diện sạch hơn, chỉ Bell/Search/Settings |

---

## Ưu Tiên Thực Hiện

1. **CREATE** `useOfflineVideos.ts` - Hook cơ sở cho offline videos
2. **CREATE** `Profile.tsx` - Trang chính với layout YouTube
3. **CREATE** `YourVideosMobile.tsx` - Trang quản lý video mobile
4. **CREATE** `DownloadedVideos.tsx` - Trang offline videos
5. **EDIT** `MobileBottomNav.tsx` - Đổi route nút "Bạn"
6. **EDIT** `App.tsx` - Thêm routes

---

## Notes Quan Trọng

- Desktop users vẫn dùng `/your-videos` như cũ
- Mobile users có UX riêng biệt, tối ưu cho touch
- IndexedDB storage đã có sẵn code base trong `VideoActionsBar.tsx`
- Settings page hiện tại (`/settings`) sẽ là nơi tích hợp các quick actions
- Real-time updates cho profile stats được hỗ trợ qua Supabase channels
