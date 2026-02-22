

## Triển khai 2 tính năng: Auto-fetch TikTok avatar + Nút "+" thêm mạng xã hội trên trang cá nhân

### 1. Auto-fetch avatar TikTok

**File: `supabase/functions/fetch-social-avatar/index.ts`**

Thêm hàm `fetchTiktokAvatar` riêng biệt với các chiến lược:
- **Strategy 1**: TikTok oembed endpoint (`https://www.tiktok.com/oembed?url=URL`) - trả về JSON có `thumbnail_url`
- **Strategy 2**: unavatar.io (giữ lại làm fallback)
- **Strategy 3**: Scrape trang TikTok lấy `og:image` với User-Agent phù hợp

Thêm case `"tiktok"` vào switch `fetchAvatarForPlatform` thay vì dùng `fetchGenericAvatar`.

---

### 2. Nút "+" thêm mạng xã hội trên orbit (màu xanh blue)

**File: `src/components/Profile/ProfileHeader.tsx`**
- Thêm prop `isOwnProfile` và `onProfileUpdate` (callback refetch)
- Truyền xuống `SocialMediaOrbit`

**File: `src/pages/Channel.tsx`**
- Truyền `isOwnProfile` và `fetchChannelAndProfile` vào `ProfileHeader`

**File: `src/components/Profile/SocialMediaOrbit.tsx`**
- Nhận thêm props: `isOwnProfile`, `userId`, `onProfileUpdate`
- Khi `isOwnProfile === true`: hiển thị nút "+" tròn trên orbit
  - Màu: **xanh blue** gradient `from-cyan-400 to-blue-500` (tương ứng viên kim cương `cosmic-cyan`)
  - Glow effect xanh blue
- Khi nhấn "+": mở Popover hiển thị:
  - Danh sách các nền tảng chưa thêm (dạng chip với icon)
  - Khi chọn 1 nền tảng: hiện input nhập URL + nút xác nhận
  - Validation URL theo pattern của từng nền tảng (giống `ProfileSettings.tsx`)
- Khi xác nhận:
  - Gọi Supabase update field tương ứng (ví dụ `facebook_url`) vào bảng `profiles`
  - Gọi edge function `fetch-social-avatar` cho platform vừa thêm
  - Trigger `onProfileUpdate` để refetch profile, orbit cập nhật ngay

### Luồng hoạt động

```text
User xem trang cá nhân --> Thấy nút "+" xanh blue trên orbit
--> Nhấn "+" --> Popover hiện các nền tảng chưa thêm
--> Chọn "Facebook" --> Hiện input URL
--> Nhập link --> Validate --> Nhấn xác nhận
--> Lưu facebook_url vào profiles --> Orbit cập nhật ngay
--> Edge function chạy background fetch avatar
```

### Tóm tắt file cần sửa

| File | Thay đổi |
|---|---|
| `supabase/functions/fetch-social-avatar/index.ts` | Thêm `fetchTiktokAvatar`, thêm case tiktok vào switch |
| `src/components/Profile/SocialMediaOrbit.tsx` | Thêm nút "+" xanh blue, popover chọn nền tảng, input URL, logic lưu |
| `src/components/Profile/ProfileHeader.tsx` | Thêm prop `isOwnProfile`, `onProfileUpdate`, truyền xuống orbit |
| `src/pages/Channel.tsx` | Truyền `isOwnProfile`, `fetchChannelAndProfile` vào `ProfileHeader` |

