

# Kich Hoat Mint FUN Truc Tiep Cho Tung Hanh Dong FUN_PLAY

## Hien Trang

Hien tai, he thong hoat dong theo **2 lop tach biet**:

1. **Lop CAMLY** (`useAutoReward` → edge function `award-camly`): Khi user xem/like/comment/share/upload video, ho nhan CAMLY Coin vao `reward_transactions`. Day la phan thuong tu dong, khong can duyet.

2. **Lop FUN Money** (`useLightActivity` → `useAutoMintRequest`): User phai vao trang `/fun-money`, nhan nut "Mint FUN" de gop tat ca CAMLY thanh 1 mint request duy nhat voi `action_type = 'LIGHT_ACTIVITY'`. Yeu cau Light Score >= 60, >= 10 activities, va admin duyet.

**Van de**: Khong co luong mint FUN truc tiep cho tung hanh dong FUN_PLAY. Muc du `BASE_REWARDS.FUN_PLAY` da dinh nghia san 5 loai (WATCH_VIDEO=10, LIKE_VIDEO=5, COMMENT=15, SHARE=20, UPLOAD_VIDEO=100 FUN), nhung chua co code nao goi `submitRequest` voi `platformId='FUN_PLAY'`.

---

## Ke Hoach Thuc Hien

### 1. Tao hook `useAutoMintFun` — tu dong tao mint request cho tung hanh dong

File moi: `src/hooks/useAutoMintFun.ts`

Hook nay se:
- Nhan su kien `camly-reward` (da dispatch boi `useAutoReward`)
- Map loai reward (VIEW, LIKE, COMMENT, SHARE, UPLOAD) sang action type FUN_PLAY tuong ung
- Lay pillar scores tu profile (hoac tinh nhanh)
- Tu dong goi `submitRequest` voi `platformId='FUN_PLAY'` va `actionType` tuong ung
- Ap dung cooldown de tranh spam (1 mint request / action type / 1 phut)
- Ghi log va dispatch event de UI cap nhat

Mapping:
```text
CAMLY Type          → FUN_PLAY Action    → Base Reward
VIEW                → WATCH_VIDEO        → 10 FUN
LIKE                → LIKE_VIDEO         → 5 FUN
COMMENT             → COMMENT            → 15 FUN
SHARE               → SHARE              → 20 FUN
SHORT_VIDEO_UPLOAD  → UPLOAD_VIDEO       → 100 FUN
LONG_VIDEO_UPLOAD   → UPLOAD_VIDEO       → 100 FUN
UPLOAD / FIRST_UP   → UPLOAD_VIDEO       → 100 FUN
```

### 2. Tich hop hook vao cac component hien tai

- **`src/pages/Watch.tsx`**: Them `useAutoMintFun` — lang nghe su kien va tu dong tao mint request khi user xem/like/comment
- **`src/components/Video/EnhancedVideoPlayer.tsx`**: Sau khi `awardViewReward` thanh cong, goi mint FUN cho WATCH_VIDEO
- **`src/components/Video/MobileVideoPlayer.tsx`** va **`YouTubeMobilePlayer.tsx`**: Tuong tu
- **Share flow**: Tim diem goi `awardShareReward` va them mint FUN

### 3. Cap nhat `useLightActivity` — them thong ke mint FUN theo action

Them truong moi vao `LightActivity`:
- `funMintedByAction`: Record ghi so FUN da mint theo tung action type (de hien thi breakdown tren UI)
- Query `mint_requests` voi `platform_id = 'FUN_PLAY'` de dem

### 4. Cap nhat UI trang `/fun-money` — hien thi mint requests theo action

- Them tab/filter moi trong `MintRequestList` de loc theo `platform_id` (FUN_PLAY vs FUN_PROFILE)
- Hien thi breakdown: bao nhieu FUN tu WATCH_VIDEO, LIKE_VIDEO, COMMENT, SHARE, UPLOAD_VIDEO
- Giu nguyen flow LIGHT_ACTIVITY cu (khong xoa, de user co the chon)

### 5. Them cau hinh toggle bat/tat auto-mint

- Them truong `auto_mint_fun_enabled` trong `profiles` table (default: `true`)
- User co the tat auto-mint FUN neu chi muon tich luy CAMLY
- Hook `useAutoMintFun` kiem tra truong nay truoc khi tao mint request

---

## Chi Tiet Ky Thuat

### Hook `useAutoMintFun` — Logic chinh:

```text
1. Lang nghe event "camly-reward" (da co san)
2. Map type → FUN_PLAY action
3. Lay profile data (pillar scores, light score)
4. Kiem tra:
   - Light Score >= 60
   - Khong co mint request trung (cung videoId + actionType trong 1 phut)
   - auto_mint_fun_enabled = true
5. Goi scoreAction() voi platformId='FUN_PLAY'
6. Insert mint_requests voi status='pending'
7. Dispatch event "fun-mint-requested"
```

### Database Migration:

```sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS auto_mint_fun_enabled boolean DEFAULT true;
```

### Khong can thay doi:
- Edge functions (`award-camly`, `batch-award-camly`) — van hoat dong nhu cu
- `pplp-engine.ts` — `BASE_REWARDS.FUN_PLAY` da san sang
- `useFunMoneyMintRequest.ts` — `submitRequest` da ho tro bat ky platformId/actionType
- Smart contract — khong thay doi (mint requests van duoc admin duyet va thuc thi on-chain)

---

## Tong Ket Thay Doi

| File | Thay doi |
|------|---------|
| `src/hooks/useAutoMintFun.ts` | **MOI** — Hook tu dong mint FUN theo action |
| `src/pages/Watch.tsx` | Them `useAutoMintFun` |
| `src/components/Video/EnhancedVideoPlayer.tsx` | Tich hop auto-mint sau view reward |
| `src/components/Video/MobileVideoPlayer.tsx` | Tuong tu |
| `src/components/Video/YouTubeMobilePlayer.tsx` | Tuong tu |
| `src/hooks/useLightActivity.ts` | Them thong ke FUN theo action |
| `src/pages/FunMoneyPage.tsx` | Them filter/breakdown theo action |
| `profiles` table | Them cot `auto_mint_fun_enabled` |

