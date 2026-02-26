

# Fix Toan Bo Gia Tri FUN Money Ve Dung Cong Thuc Moi Nhat

## Phan Tich Hien Trang

### Van de chinh: `calculateMintableFun` dung cong thuc sai

Trong `src/hooks/useLightActivity.ts`, ham `calculateMintableFun` hien tinh:

```text
mintableFUN = totalCamly × 0.01 × (lightScore/100) × integrityScore × unityMultiplier
```

Day la cong thuc cu, **khong** dung BASE_REWARDS cua tung action. Ket qua hien tai cho 1 user co 237,744 CAMLY la 23,774 FUN — con so khong hop ly.

### Cong thuc dung (theo BASE_REWARDS):

```text
mintableFUN = views×10 + likes×5 + comments×15 + shares×20 + uploads×100
             - FUN da mint (tu mint_requests)
```

Moi action co gia tri FUN co dinh, khong nhan them Q/I multiplier (Q=1.0, I=1.0).

### Du lieu hien tai trong DB:

- Chi co **1 mint request** (LIGHT_ACTIVITY, 23,774 FUN, status=approved)
- Chua co FUN_PLAY mint request nao
- Mint request nay da dung Q=1.0, I=1.0 nhung `base_reward_atomic` = gia tri CAMLY-to-FUN cu, khong phai BASE_REWARDS

---

## Ke Hoach Thuc Hien

### 1. Cap nhat `calculateMintableFun` trong `useLightActivity.ts`

Thay doi cong thuc tu CAMLY conversion sang BASE_REWARDS:

```text
Cu:  totalCamly × 0.01 × multipliers
Moi: (views×10 + likes×5 + comments×15 + shares×20 + uploads×100) - funDaMinted
```

Ham se nhan `activityCounts` va `alreadyMintedFun` thay vi `totalCamly`.

Can them query tong FUN da mint tu `mint_requests` (status != 'rejected') cho user.

### 2. Recalculate mint request cu trong DB

Tao database migration de cap nhat mint request hien co:
- Tinh lai `calculated_amount_atomic` va `calculated_amount_formatted` dua tren activity counts thuc te cua user tai thoi diem do
- Hoac dat trang thai `recalculated` de admin review lai

### 3. Dam bao Q=1.0, I=1.0 cho LIGHT_ACTIVITY path

Trong `useAutoMintRequest` (dong 319-320), da co `multiplier_q: 1.0` va `multiplier_i: 1.0` — dung roi, khong can sua.

### 4. Cap nhat ActivitySummary UI — hien thi FUN theo action

Them cot "FUN Reward" vao bang Activity Summary de user thay ro gia tri FUN cho moi loai action:

```text
Views: 1,234  → 12,340 FUN
Likes: 567    → 2,835 FUN
Comments: 89  → 1,335 FUN
Shares: 23    → 460 FUN
Uploads: 5    → 500 FUN
---
Total Mintable: 17,470 FUN
Da Mint: 0 FUN
Con lai: 17,470 FUN
```

---

## Tong Ket Thay Doi

| File | Thay doi |
|------|---------|
| `src/hooks/useLightActivity.ts` | Thay `calculateMintableFun` dung BASE_REWARDS; them query `mint_requests` de tru FUN da mint |
| `src/components/FunMoney/ActivitySummary.tsx` | Them hien thi FUN reward cho moi loai action |
| `src/components/FunMoney/MintableCard.tsx` | Hien thi breakdown nhanh: Total / Da Mint / Con lai |
| Database migration | Recalculate mint request cu cho dung cong thuc moi |

## Ket qua mong doi

- Mintable FUN = tong cac hoat dong × BASE_REWARDS (khong dung CAMLY conversion)
- WATCH_VIDEO = 10 FUN, LIKE_VIDEO = 5 FUN, COMMENT = 15 FUN, SHARE = 20 FUN, UPLOAD_VIDEO = 100 FUN
- Q=1.0, I=1.0 ap dung 100% — khong nhan them multiplier
- User thay ro breakdown FUN cho tung loai hoat dong
- Mint request cu duoc cap nhat lai dung gia tri

