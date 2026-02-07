
# 🌟 Đồng Bộ Thiết Kế Trang Cá Nhân Cho Tất Cả Users

## Tổng Quan Vấn Đề

Hiện tại có **2 trang profile khác nhau**:

| Route | Page | Thiết kế |
|-------|------|----------|
| `/channel/:id`, `/c/:username`, `/@:username` | `Channel.tsx` | **CŨ** - có "Huy Hiệu Thành Tích", không có Honor Board trên bìa |
| `/user/:userId`, `/u/:username` | `UserProfile.tsx` | **MỚI** - đẹp như Angel Diệu Ngọc |

Khi click vào avatar/tên người dùng từ video → đi đến `/channel/:id` → thấy giao diện cũ.

---

## Giải Pháp

**Thay thế hoàn toàn trang `Channel.tsx` bằng giao diện mới giống `UserProfile.tsx`**, đảm bảo tất cả routes đều dùng thiết kế 5D Light Economy thống nhất.

---

## Chi Tiết Thực Hiện

### 1. Cập Nhật Channel.tsx - Sử Dụng Components Mới

**Thay thế hoàn toàn logic cũ bằng:**
- `ProfileHeader` (ảnh bìa + avatar hologram + Honor Board trên bìa)
- `ProfileInfo` (tên rainbow gradient + nút "Tặng & Thưởng" + nút theo dõi)
- `ProfileTabs` (Bài viết, Video, Shorts, Livestream, Playlist)

**Xóa:**
- Import `CompactHonobar`, `RewardStats`, `AchievementBadges`
- Bảng "Huy Hiệu Thành Tích" cũ
- Layout cũ với tabs Videos/Playlists/About

### 2. Thêm Nút "Tặng & Thưởng" Cho Tất Cả Profile

Trong `ProfileInfo.tsx`:
- **Bỏ điều kiện `!isOwnProfile`** cho nút donate → Nút luôn hiển thị
- Khi xem profile **người khác**: Auto-fill receiver
- Khi xem profile **chính mình**: Mở modal global để chọn người nhận

### 3. Đổi Nút "Chỉnh sửa" Thành Icon Settings

Thay:
```tsx
<Button>
  <Settings className="w-4 h-4 mr-2" />
  Chỉnh sửa
</Button>
```

Thành icon-only:
```tsx
<Button variant="outline" size="icon" className="rounded-full">
  <Settings className="w-4 h-4" />
</Button>
```

### 4. Xóa Component AchievementBadges (Bảng Huy Hiệu Thành Tích)

- Xóa import và render `AchievementBadges` trong `RewardStats.tsx`
- Giữ file `AchievementBadges.tsx` nhưng không dùng (có thể thay bằng biểu tượng khác sau)

### 5. Cập Nhật RewardStats.tsx

- Xóa import và render của `AchievementBadges`
- Giữ lại 3 stat cards (Tổng Reward, Số dư CAMLY, Người theo dõi) nếu cần dùng ở nơi khác

---

## Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/pages/Channel.tsx` | **Viết lại hoàn toàn** - sử dụng ProfileHeader, ProfileInfo, ProfileTabs giống UserProfile.tsx |
| `src/components/Profile/ProfileInfo.tsx` | Bỏ điều kiện `!isOwnProfile` cho nút donate, đổi nút Settings thành icon, thêm logic modal |
| `src/components/Profile/RewardStats.tsx` | Xóa import và render `AchievementBadges` |

---

## Cấu Trúc Mới Của Channel.tsx

```text
MainLayout
├── BackgroundMusicPlayer (nếu có)
├── DonationCelebration (realtime)
├── ProfileHeader
│   ├── Cover Photo (full width)
│   ├── ProfileHonorBoard (góc phải trên bìa)
│   └── Avatar (hologram rainbow border)
├── ProfileInfo
│   ├── Display Name (rainbow gradient)
│   ├── Username + Stats
│   ├── Bio + Wallet
│   └── Action Buttons:
│       ├── "Tặng & Thưởng" (vàng kim loại shimmer) - LUÔN HIỂN THỊ
│       ├── "Theo dõi" (nếu không phải own profile)
│       ├── Settings icon (nếu là own profile)
│       └── Share dropdown
└── ProfileTabs
    ├── Bài viết
    ├── Video
    ├── Shorts
    ├── Livestream
    └── Playlist
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Profile `/channel/:id` có "Huy Hiệu Thành Tích" cũ | Tất cả profile đều có Honor Board trên ảnh bìa |
| Không có nút "Tặng & Thưởng" trên profile khác | Nút vàng kim loại shimmer hiển thị trên TẤT CẢ profile |
| Tabs cũ: Videos, Playlists, About | Tabs mới: Bài viết, Video, Shorts, Livestream, Playlist |
| Avatar đơn giản | Avatar hologram với rainbow border animation |
| Tên bình thường | Tên rainbow gradient với animation |

---

## Testing Checklist

- [ ] Vào `/channel/:id` của bất kỳ user → Thấy design mới giống Angel Diệu Ngọc
- [ ] Vào `/c/:username` → Design mới
- [ ] Vào `/@:username` → Design mới
- [ ] Không còn thấy "Huy Hiệu Thành Tích" cũ
- [ ] Honor Board hiển thị trên góc phải ảnh bìa
- [ ] Nút "Tặng & Thưởng" hiển thị trên TẤT CẢ profile (kể cả của mình)
- [ ] Click nút → Mở modal tặng tiền đúng chức năng
- [ ] Tabs mới hoạt động đúng
- [ ] Mobile responsive: Stack dọc đẹp
