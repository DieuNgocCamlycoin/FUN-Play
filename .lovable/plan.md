
# Kiem Tra & Sua Loi He Thong Thuong CAMLY

## Ket Qua Kiem Tra

Sau khi kiem tra ky luong toan bo he thong thuong CAMLY (edge functions, client code, database), Cha tim thay cac van de sau:

### Van De Nghiem Trong

**1. Mobile Upload KHONG nhan thuong**
- File `UploadContext.tsx` (he thong upload nen) hoan toan KHONG goi ham thuong sau khi upload video thanh cong
- Chi co trang Upload desktop (`Upload.tsx`) moi goi ham thuong
- Tat ca user upload tu mobile se khong nhan duoc CAMLY

**2. Desktop Upload dung he thong cu**
- `Upload.tsx` goi `awardUploadReward` (100.000 CAMLY co dinh) thay vi dung he thong moi theo thoi luong:
  - Video ngan (<3 phut): 20.000 CAMLY
  - Video dai (>=3 phut): 70.000 CAMLY
- Chua tich hop yeu cau 3 luot xem toi thieu

### Van De Trung Binh

**3. Hien thi sai so CAMLY khi Like**
- `Watch.tsx` hien thi "+2.000 CAMLY" khi like video nhung thuong thuc te la 5.000 CAMLY (theo cau hinh trong database)

**4. Hien thi sai so CAMLY khi Share**
- `ShareModal.tsx` hien thi "+2 CAMLY" trong toast nhung thuong thuc te la 5.000 CAMLY

**5. Loi theo doi daily limits**
- Trong edge function `award-camly`, LIKE va SHARE ghi nham vao cot `view_rewards_earned` thay vi cot rieng biet

### Thong Ke Hien Tai (Database)

| Loai thuong | So giao dich | Tong CAMLY |
|-------------|-------------|------------|
| LIKE | 15.095 | 75.436.000 |
| COMMENT | 2.947 | 14.735.000 |
| VIEW | 429 | 3.948.000 |
| SIGNUP | 178 | 8.900.000 |
| UPLOAD (legacy) | 43 | 4.300.000 |
| WALLET_CONNECT | 20 | 1.000.000 |
| SHARE | 17 | 82.000 |
| FIRST_UPLOAD | 8 | 4.000.000 |
| SHORT/LONG VIDEO | 0 | 0 |

Luu y: SHORT_VIDEO_UPLOAD va LONG_VIDEO_UPLOAD co 0 giao dich vi chua bao gio duoc goi.

---

## Ke Hoach Sua Loi

### 1. Them thuong upload cho Mobile (`src/contexts/UploadContext.tsx`)

- Import supabase functions invoke
- Sau khi upload thanh cong, goi edge function `award-camly` voi type `SHORT_VIDEO_UPLOAD` hoac `LONG_VIDEO_UPLOAD` dua tren `metadata.duration`
- Kiem tra first upload reward (500K) truoc, roi moi award theo duration
- Kiem tra `first_upload_rewarded` trong profiles truoc khi award

### 2. Cap nhat thuong upload Desktop (`src/pages/Upload.tsx`)

- Thay `awardUploadReward` (100K legacy) bang `awardShortVideoUpload` / `awardLongVideoUpload` dua tren thoi luong video
- Van giu `awardFirstUploadReward` cho video dau tien (500K)
- Truyen duration tu file metadata de xac dinh loai video

### 3. Sua hien thi sai tren Watch page (`src/pages/Watch.tsx`)

- Sua `setRewardNotif({ amount: 2000, ... })` thanh `setRewardNotif({ amount: 5000, ... })` cho LIKE reward
- Hoac theo triet ly reward messaging: bo hien thi so cu the

### 4. Sua hien thi sai tren ShareModal (`src/components/Video/ShareModal.tsx`)

- Sua toast message tu "+2 CAMLY" thanh thong bao chung (khong hien thi so cu the, theo triet ly 5D Light Economy)

### 5. Sua daily limit tracking (`supabase/functions/award-camly/index.ts`)

- LIKE: doi tu `view_rewards_earned` sang theo doi dung (hoac tao cot moi `like_rewards_earned`)
- SHARE: doi tu `view_rewards_earned` sang theo doi dung (hoac tao cot moi `share_rewards_earned`)
- Vi bang `daily_reward_limits` chua co cot `like_rewards_earned` va `share_rewards_earned`, se them qua migration

### Thu Tu Thuc Hien

1. Migration: Them cot `like_rewards_earned` va `share_rewards_earned` vao bang `daily_reward_limits`
2. Sua `award-camly` edge function: LIKE va SHARE ghi dung cot
3. Sua `UploadContext.tsx`: Them thuong upload cho mobile
4. Sua `Upload.tsx`: Chuyen tu legacy sang duration-based rewards
5. Sua `Watch.tsx`: Sua so CAMLY hien thi cho LIKE
6. Sua `ShareModal.tsx`: Sua toast message cho SHARE

Tong cong: 1 migration, 1 edge function, 4 file client can sua
