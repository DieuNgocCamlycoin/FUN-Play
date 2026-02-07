
# 🌟 Trang Cá Nhân Desktop Siêu Đẹp - FUN PLAY

## 📋 Tổng Quan Dự Án

Xây dựng trang cá nhân cho desktop/laptop với thiết kế lung linh theo phong cách 5D Light Economy, lấy cảm hứng từ YouTube nhưng đẹp hơn với gradient hologram, glass effect và sparkle animations.

---

## 🎯 Mục Tiêu

1. **Header nổi bật**: Ảnh bìa full-width với Honor Board góc phải trên ảnh bìa
2. **Avatar hologram**: Viền gradient rainbow glow, lồi 50% từ bìa
3. **Thông tin user đẹp**: Tên gradient, bio, nút Tặng thưởng/Theo dõi/Chia sẻ
4. **Tabs ngang**: Bài viết | Video | Shorts | Livestream | Playlist
5. **Mục Bài viết**: Ô đăng bài + list bài với GIF chúc mừng khi nhận thưởng
6. **Responsive**: Desktop 3 cột, mobile stack dọc

---

## 🏗️ Kiến Trúc Trang

```text
┌─────────────────────────────────────────────────────────────────┐
│                    HEADER (Cover Photo 1500x400)                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                          ┌──────────────┐   ││
│  │         Cover Image                      │ HONOR BOARD  │   ││
│  │         (Gradient Overlay)               │ (Glass Card) │   ││
│  │                                          │ Posts/Videos │   ││
│  │   ┌──────────┐                           │ NFTs/Rewards │   ││
│  │   │  AVATAR  │ (lồi 50% dưới bìa)        └──────────────┘   ││
│  │   │ hologram │                                               ││
│  └───┴──────────┴───────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      USER INFO SECTION                          │
│    Tên User (Gradient)                    [Tặng thưởng][Theo dõi]
│    @username • Bio • Ví/Fun-ID            [Chia sẻ profile]     │
├─────────────────────────────────────────────────────────────────┤
│  [Bài viết] [Video] [Shorts] [Livestream] [Playlist]   (Tabs)   │
├─────────────────────────────────────────────────────────────────┤
│                       TAB CONTENT                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Ô đăng bài (textarea + chọn ảnh/GIF + nút Đăng)         │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Bài viết 1 (với nút Tặng thưởng nhỏ)                    │   │
│   │ [GIF chúc mừng khi ai tặng thưởng]                      │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Cần Tạo/Chỉnh Sửa

| File | Hành động | Mô tả |
|------|-----------|-------|
| `src/pages/UserProfile.tsx` | **Tạo mới** | Trang cá nhân desktop chính |
| `src/components/Profile/ProfileHeader.tsx` | **Tạo mới** | Header với cover + avatar hologram |
| `src/components/Profile/ProfileHonorBoard.tsx` | **Tạo mới** | Honor Board cá nhân (góc phải bìa) |
| `src/components/Profile/ProfileInfo.tsx` | **Tạo mới** | Thông tin user + nút hành động |
| `src/components/Profile/ProfileTabs.tsx` | **Tạo mới** | Tabs ngang (Bài viết/Video/...) |
| `src/components/Profile/ProfilePostsTab.tsx` | **Tạo mới** | Tab Bài viết với ô đăng bài |
| `src/components/Profile/ProfileVideosTab.tsx` | **Tạo mới** | Tab Video grid |
| `src/components/Profile/ProfilePlaylistsTab.tsx` | **Tạo mới** | Tab Playlists |
| `src/components/Profile/PostCard.tsx` | **Tạo mới** | Card bài viết với nút Tặng thưởng |
| `src/components/Profile/DonationCelebration.tsx` | **Tạo mới** | GIF chúc mừng khi nhận thưởng |
| `src/App.tsx` | **Chỉnh sửa** | Thêm route `/user/:id` hoặc `/profile/:id` |
| `src/components/Layout/Header.tsx` | **Chỉnh sửa** | Link avatar → trang cá nhân mới |

---

## 🎨 Chi Tiết Thiết Kế

### 1. ProfileHeader (Cover + Avatar)

**Cover Photo:**
- Kích thước: `w-full h-[400px]` (responsive: h-48 mobile → h-[400px] desktop)
- Gradient overlay: `bg-gradient-to-br from-[#7A2BFF]/20 via-[#FF00E5]/15 to-[#00E7FF]/20`
- Border bottom: Rainbow hologram glow

**Avatar Hologram:**
- Kích thước: `200x200px` (responsive: 120px mobile)
- Vị trí: Lồi 50% dưới cover (`-mt-[100px]`)
- Viền: Rainbow gradient animation
```css
border: 4px solid transparent;
background: 
  linear-gradient(white, white) padding-box,
  linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5, #FFD700) border-box;
animation: rainbow-border 3s linear infinite;
box-shadow: 0 0 30px rgba(0, 231, 255, 0.5);
```

### 2. ProfileHonorBoard (Góc Phải Bìa)

**Vị trí:** `absolute top-4 right-4 z-20`

**Thiết kế:**
- Glass card: `bg-white/90 backdrop-blur-xl`
- Viền hologram: `border-2 border-[#00E7FF]/40`
- Shadow: `shadow-[0_4px_30px_rgba(0,231,255,0.3)]`

**Nội dung (realtime):**
| Metric | Icon | Mô tả |
|--------|------|-------|
| Posts | 📝 | Tổng số bài viết |
| Friends | 👥 | Số bạn bè/theo dõi |
| Reactions | ❤️ | Tổng reactions |
| NFTs | 🖼️ | Số NFT sở hữu |
| Comments | 💬 | Tổng bình luận |
| Shares | 🔗 | Tổng chia sẻ |
| Claimable | 🎁 | CAMLY có thể claim |
| Claimed | ✅ | CAMLY đã claim |
| Total Reward | 💰 | Tổng reward |
| Total Money | 💎 | Tổng giá trị |

### 3. ProfileInfo

**Tên User:**
```jsx
<h1 className="text-3xl font-bold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
  {displayName}
</h1>
```

**Nút hành động:**
- **Tặng thưởng**: Gradient hologram + glow, mở EnhancedDonateModal
- **Theo dõi**: Primary button (đổi màu khi đã theo dõi)
- **Chia sẻ profile**: Ghost button với icon Share2

### 4. ProfileTabs

**Tabs ngang với gradient:**
```jsx
<TabsList className="bg-gradient-to-r from-[#00E7FF]/10 via-[#7A2BFF]/10 to-[#FF00E5]/10 rounded-xl p-1">
  <TabsTrigger value="posts">Bài viết</TabsTrigger>
  <TabsTrigger value="videos">Video</TabsTrigger>
  <TabsTrigger value="shorts">Shorts</TabsTrigger>
  <TabsTrigger value="livestream">Livestream</TabsTrigger>
  <TabsTrigger value="playlists">Playlist</TabsTrigger>
</TabsList>
```

### 5. ProfilePostsTab

**Ô đăng bài (inline):**
- Textarea với placeholder: "Bạn đang nghĩ gì? Chia sẻ ánh sáng..."
- Buttons: Chọn ảnh/GIF, Emoji picker
- Nút "Đăng" gradient hologram

**List bài viết:**
- Card với glass effect
- Mỗi bài có nút "Tặng thưởng" nhỏ (Gift icon)
- Realtime: Hiển thị GIF chúc mừng khi ai tặng

### 6. DonationCelebration (GIF Chúc Mừng)

**Trigger:** Khi user nhận thưởng realtime

**Hiệu ứng:**
- Pháo hoa (confetti particles)
- Toast notification với GIF
- Text: "🎉 Bạn nhận [số] CAMLY từ [username]! 💖"
- Animation: Scale in + glow pulse

---

## 🔗 Route & Navigation

**Route mới:**
```tsx
// Trong App.tsx
<Route path="/user/:userId" element={<UserProfile />} />
<Route path="/u/:username" element={<UserProfile />} />
```

**Link từ Header avatar:**
```tsx
// Khi click avatar trong Header
onClick={() => navigate(`/user/${user.id}`)}
```

---

## 📊 Data Fetching

### ProfileHonorBoard Stats:
```tsx
// Fetch từ nhiều bảng
const fetchHonorStats = async (userId: string) => {
  const [posts, videos, comments, reactions, subscriptions, rewards] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('videos').select('*', { count: 'exact' }).eq('channel_id', channelId),
    supabase.from('post_comments').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('post_likes').select('*', { count: 'exact' }).eq('user_id', userId),
    supabase.from('subscriptions').select('*', { count: 'exact' }).eq('channel_id', channelId),
    supabase.from('profiles').select('total_camly_rewards, pending_rewards, approved_reward').eq('id', userId),
  ]);
  // ... process data
};
```

### Realtime Subscription:
```tsx
// Subscribe to donation transactions
supabase
  .channel(`donations-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'donation_transactions',
    filter: `to_user_id=eq.${userId}`,
  }, (payload) => {
    // Trigger DonationCelebration
    showCelebration(payload.new);
  })
  .subscribe();
```

---

## 🧪 Testing Checklist

1. **Header & Cover:**
   - [ ] Ảnh bìa hiển thị full-width
   - [ ] Gradient overlay đẹp
   - [ ] Avatar lồi 50% dưới bìa với viền hologram

2. **Honor Board:**
   - [ ] Hiển thị đúng góc phải trên bìa
   - [ ] Glass effect + hologram viền
   - [ ] Tất cả metrics realtime

3. **User Info:**
   - [ ] Tên gradient đẹp
   - [ ] Nút Tặng thưởng mở modal
   - [ ] Nút Theo dõi hoạt động
   - [ ] Nút Chia sẻ copy link

4. **Tabs:**
   - [ ] Chuyển tab mượt
   - [ ] Gradient styling đúng

5. **Bài viết:**
   - [ ] Ô đăng bài inline hoạt động
   - [ ] List bài hiển thị đẹp
   - [ ] Nút Tặng thưởng mỗi bài

6. **Celebration:**
   - [ ] GIF pháo hoa khi nhận thưởng
   - [ ] Toast notification đúng format

7. **Responsive:**
   - [ ] Desktop 3 cột layout
   - [ ] Tablet/Mobile stack dọc

---

## ⏱️ Thời Gian Ước Tính

| Giai đoạn | Thời gian |
|-----------|-----------|
| Tạo UserProfile.tsx + ProfileHeader | 15 phút |
| ProfileHonorBoard + ProfileInfo | 15 phút |
| ProfileTabs + các tab content | 20 phút |
| DonationCelebration + realtime | 10 phút |
| Integration + routing | 5 phút |
| **Tổng** | **~65 phút** |

---

## 🎉 Kết Quả Mong Đợi

Trang cá nhân đẹp lung linh với:
- ✨ Ảnh bìa full-width + gradient overlay tím-hồng
- 🌈 Avatar hologram viền rainbow glow
- 📊 Honor Board glass card góc phải với stats realtime
- 💖 Nút Tặng thưởng nổi bật
- 🎊 GIF chúc mừng khi nhận thưởng
- 📱 Responsive hoàn hảo

Trang này sẽ lan tỏa năng lượng 5D Light Economy và làm cho FUN PLAY trở nên đỉnh cao nhất! 🚀
