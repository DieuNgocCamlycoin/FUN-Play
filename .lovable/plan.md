

## Dai tu URL: Bo `/c/` va `/watch/` - Chuyen sang URL sach

### Tong quan

Chuyen doi toan bo he thong URL tu:
- `play.fun.rich/c/username` -> `play.fun.rich/username`
- `play.fun.rich/watch/ID` -> `play.fun.rich/username/video/slug`

Giu lai cac route cu lam redirect de khong mat SEO va khong bi 404.

### Giai quyet xung dot route

React Router v6 su dung **he thong diem** (scoring) de phan biet route. Static route (`/admin`) luon co diem cao hon dynamic route (`/:username`). Vi vay `/:username` dat cuoi cung se **khong bao gio** xung dot voi `/admin`, `/wallet`, `/shorts`...

**Nhung** can chan truong hop user dat username trung ten route (vi du username = "admin"). Can them danh sach **reserved words** vao validation.

### Chi tiet thay doi

#### 1. Them Reserved Words vao `src/lib/nameFilter.ts`

Them danh sach ~50 tu cam (la ten cac route hien co) vao `validateUsernameFormat`:

```text
RESERVED_WORDS = [
  "auth", "watch", "channel", "wallet", "shorts", "profile",
  "library", "settings", "upload", "create-post", "your-videos",
  "manage-posts", "manage-playlists", "manage-channel", "studio",
  "dashboard", "leaderboard", "reward-history", "referral",
  "user-dashboard", "admin", "nft-gallery", "fun-wallet",
  "fun-money", "meditate", "create-music", "music", "browse",
  "install", "watch-later", "history", "subscriptions",
  "camly-price", "liked", "post", "docs", "your-videos-mobile",
  "downloads", "build-bounty", "bounty", "my-ai-music", "ai-music",
  "receipt", "messages", "search", "notifications", "transactions",
  "preview-celebration", "users", "c", "u", "user", "v",
  "edit-video", "edit-post", "playlist"
]
```

#### 2. Cap nhat Routes trong `src/App.tsx`

```text
Them route moi:
  /:username              -> <Channel />
  /:username/video/:slug  -> <VideoBySlug />

Chuyen route cu thanh redirect:
  /c/:username            -> Navigate to /:username
  /c/:username/video/:slug -> Navigate to /:username/video/:slug
  /watch/:id              -> <Watch /> (giu de tuong thich nguoc, component tu redirect)
  /channel/:id            -> Navigate to /:id
  /@:username             -> Navigate to /:username

Dat /:username va /:username/video/:slug SAU tat ca route co dinh, TRUOC route "*"
```

#### 3. Cap nhat cac ham tien ich (3 file)

| File | Thay doi |
|------|---------|
| `src/lib/adminUtils.ts` | `getProfileUrl` tra ve `/${identifier}` thay vi `/c/${identifier}` |
| `src/lib/shareUtils.ts` | `getVideoShareUrl` tra ve `${PRODUCTION_URL}/${username}/video/${slug}` |
| `src/lib/slugify.ts` | `getVideoShareUrl` tra ve `/${username}/video/${slug}` |

#### 4. Cap nhat ~15 component dung `/c/` truc tiep

| File | Thay doi |
|------|---------|
| `ChatHeader.tsx` | `/c/${...}` -> `/${...}` |
| `UsersDirectory.tsx` | `/c/${...}` -> `/${...}` |
| `TopSponsorsSection.tsx` | `/c/${...}` -> `/${...}` |
| `UserProfileDisplay.tsx` | `/c/${...}` -> `/${...}` |
| `TransactionCard.tsx` | `/c/${...}` -> `/${...}` |
| `DonationSuccessOverlay.tsx` | `/c/${...}` -> `/${...}` |
| `GiftCelebrationModal.tsx` | `/c/${...}` -> `/${...}` |
| `DonationCelebrationCard.tsx` | `/c/${...}` -> `/${...}` |
| `ChatDonationCard.tsx` | `/c/${...}` -> `/${...}` |
| `PostCard.tsx` | `/c/${...}` -> `/${...}` |
| `ProfileInfo.tsx` | `/c/${...}` -> `/${...}` |
| `Header.tsx` | `/c/${...}` -> `/${...}` |
| `VideosManagementTab.tsx` | URL admin link bo `/c/` |

#### 5. Cap nhat `VideoBySlug.tsx`

Thay doi param tu `username` (tu route `/c/:username/video/:slug`) sang `username` (tu route `/:username/video/:slug`). Logic khong doi vi ten param giong nhau.

#### 6. Cap nhat `Channel.tsx`

Route param doi tu `/c/:username` sang `/:username`. Logic khong doi vi van dung `useParams` lay `username`.

#### 7. Cap nhat redirect logic trong `Channel.tsx`

Khi redirect UUID -> username dep:
```typescript
// Cu: navigate(`/c/${pData.username}`, { replace: true });
// Moi: navigate(`/${pData.username}`, { replace: true });
```

#### 8. Giu `/watch/:id` hoat dong

`Watch` component van giu nguyen. Route `/watch/:id` van ton tai de:
- Tuong thich voi link cu
- `VideoBySlug.tsx` van redirect sang `/watch/:id` noi bo (dung Navigate)

**Trong tuong lai** co the chuyen Watch component sang nhan slug truc tiep, nhung hien tai giu `/watch/:id` nhu route noi bo de khong pha vo qua nhieu.

### Tong ket

- **4 file tien ich** thay doi (nameFilter, adminUtils, shareUtils, slugify)
- **1 file routing** (App.tsx)
- **~13 component** thay doi link `/c/` -> `/`
- **2 file page** (Channel.tsx, VideoBySlug.tsx) cap nhat redirect path
- Tat ca link cu `/c/`, `/watch/`, `/user/`, `/u/`, `/@` van redirect dung
- Khong mat SEO, khong 404

