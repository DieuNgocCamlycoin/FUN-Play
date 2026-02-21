

## Them tem "Da Dinh Chi" va chan tuong tac tren kenh bi ban

### Tong quan

Khi user khac truy cap kenh cua user bi banned: hien banner canh bao noi bat, grayscale avatar/cover, va **chan toan bo tuong tac** (khong the subscribe, donate, comment, share...). Noi dung cu van hien thi binh thuong.

---

### 1. Component moi: `src/components/Profile/SuspendedBanner.tsx`

- Banner do/cam noi bat voi icon `ShieldBan`
- Text chinh: "Kenh nay da bi dinh chi"
- Text phu: "Noi dung duoc bao luu de minh bach. Kenh khong con hoat dong."
- Chi render khi `banned === true`

### 2. Cap nhat `src/components/Profile/ProfileHeader.tsx`

- Nhan prop `banned` (da co san)
- Khi `banned === true`:
  - Them class `grayscale opacity-70` len cover photo
  - Them class `grayscale` len avatar
  - An hieu ung glow ring va rainbow border (thay bang border xam)
  - An `SocialMediaOrbit` (khong cho truy cap social links)

### 3. Cap nhat `src/components/Profile/ProfileInfo.tsx`

- Them prop `banned?: boolean`
- Khi `banned === true`: **AN TOAN BO action buttons**:
  - An nut "Tang & Thuong" (Donate)
  - An nut "Theo doi" (Subscribe)
  - An nut "Chia se" (Share dropdown)
  - An nut "Settings" (neu la own profile)
  - Khong render `EnhancedDonateModal`
- Van hien thi: ten, username, stats, bio, wallet (chi doc)

### 4. Cap nhat `src/components/Profile/ProfileTabs.tsx`

- Them prop `banned?: boolean`
- Khi `banned === true`:
  - An tab "Bai viet" (ProfilePostsTab) hoac hien chi doc (khong cho comment/like)
  - An tab "Playlist" hoac hien chi doc
  - Truyen `disabled` xuong cac tab content de chan moi tuong tac (like, comment, reply)

### 5. Cap nhat `src/pages/Channel.tsx`

- Truyen `banned={profile.banned}` xuong `ProfileInfo`, `ProfileTabs`
- Them `<SuspendedBanner banned={profile.banned} />` giua `ProfileHeader` va `ProfileInfo`
- Khi banned: khong subscribe realtime cho donations (vi khong can)

---

### Tong ket file thay doi

| File | Hanh dong |
|---|---|
| `src/components/Profile/SuspendedBanner.tsx` | Tao moi - banner canh bao |
| `src/components/Profile/ProfileHeader.tsx` | Sua - grayscale cover/avatar, an glow/orbit |
| `src/components/Profile/ProfileInfo.tsx` | Sua - them prop banned, an toan bo buttons |
| `src/components/Profile/ProfileTabs.tsx` | Sua - them prop banned, chan tuong tac trong tabs |
| `src/pages/Channel.tsx` | Sua - them SuspendedBanner, truyen banned prop |

### Nguyen tac

- **Khong** xoa hoac an noi dung cu (video, bai viet) - chi hien thi read-only
- **Chan 100%** tuong tac: subscribe, donate, share, comment, like, reply
- Visual ro rang: grayscale + banner de user biet ngay kenh da bi dinh chi

