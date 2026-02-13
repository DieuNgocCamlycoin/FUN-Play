
# Sua Loi Thuong Upload va View Reward

## Ket qua kiem tra chi tiet

### 1. Thuong video dai (70K) -- VAN CON LOI CU

| Tinh trang | So luong | Chi tiet |
|---|---|---|
| Video dai, thuong dung 70K | 127 | OK |
| Video dai, thuong SAI 20K | **3** | Co duration > 180 nhung bi ghi SHORT |
| Video NULL duration, thuong 20K | **389** | Chua co duration de phan loai dung |

**Nguyen nhan**: 389 video co `duration = NULL` trong database. Edge function `award-camly` (dong 250-252) khi gap NULL duration thi giu nguyen loai tu client gui len (thuong la SHORT = 20K).

### 2. Thuong xem video (VIEW) -- DANG HOAT DONG nhung co van de

- **279 giao dich VIEW** da ghi nhan, moi nhat luc 08:42 hom nay
- **Van de 1**: `reward_config` trong DB dat `VIEW_REWARD = 10.000` nhung client-side `enhancedRewards.ts` hien thi `VIEW = 5.000` -- gay nham lan cho user
- **Van de 2**: Tren desktop, `EnhancedVideoPlayer` yeu cau xem **90% video ngan** hoac **5 phut lien tuc video dai (>5 phut)** -- nguong kha cao, nhieu user co the chua dat duoc
- **Van de 3**: Tren mobile, `YouTubeMobilePlayer` cung logic nhung khong co thong bao (toast) khi nhan thuong

### 3. Lich su phan thuong -- HIEN THI DUNG nhung du lieu sai

Trang RewardHistory.tsx da co map dung:
- `SHORT_VIDEO_UPLOAD` = "Video ngan" (cam nhat)
- `LONG_VIDEO_UPLOAD` = "Video dai" (cam dam)

Nhung vi 389 video bi ghi nham thanh SHORT_VIDEO_UPLOAD (20K) nen lich su hien thi 20K cho video dai. **Loi khong phai o UI ma o du lieu**.

## Giai phap (4 buoc)

### Buoc 1: Dong bo client-side constants voi DB config

**Tep**: `src/lib/enhancedRewards.ts`

Cap nhat REWARD_AMOUNTS cho khop voi `reward_config` trong DB:
- `VIEW: 5000` thanh `VIEW: 10000` (khop voi DB)
- `LIKE: 2000` thanh `LIKE: 5000` (khop voi DB)

Dieu nay dam bao cac man hinh hien thi so tien dung cho user.

### Buoc 2: Sua award-camly xu ly NULL duration thong minh hon

**Tep**: `supabase/functions/award-camly/index.ts` (dong 250-252)

Hien tai khi duration = NULL, server giu nguyen client type (thuong la SHORT). Can sua de:
1. Khi duration NULL, thu lay duration tu video URL bang cach check video metadata
2. Neu van khong lay duoc, **tam ghi nhan la SHORT nhung danh dau `needs_review = true`** de admin kiem tra sau
3. Hoac don gian hon: khi duration = NULL, mac dinh la LONG (70K) vi da so video dai hon 3 phut -- tranh thiet hai cho user

**De xuat**: Mac dinh la SHORT (20K) nhung tu dong tao log de `recalculate-upload-rewards` xu ly sau khi duration duoc backfill. Day la cach an toan nhat.

### Buoc 3: Chay recalculate-upload-rewards cho 3 video da biet sai

Goi edge function `recalculate-upload-rewards` voi `dryRun: false` de:
- Fix 3 video co duration > 180 nhung bi thuong 20K thay vi 70K
- Cong bu 50.000 CAMLY/video cho user bi thieu

### Buoc 4: Them thong bao thuong tren mobile

**Tep**: `src/components/Video/Mobile/MobileWatchView.tsx`

Them `useEffect` lang nghe su kien `camly-reward` va hien thi toast:
```tsx
useEffect(() => {
  const handler = (e: CustomEvent) => {
    toast({ title: `+${e.detail.amount.toLocaleString()} CAMLY` });
  };
  window.addEventListener('camly-reward', handler);
  return () => window.removeEventListener('camly-reward', handler);
}, []);
```

**Tep**: `src/components/Video/YouTubeMobilePlayer.tsx` va `MobileVideoPlayer.tsx`

Sau khi `awardViewReward` thanh cong, dispatch event:
```tsx
const success = await awardViewReward(videoId);
if (success) {
  window.dispatchEvent(new CustomEvent("camly-reward", {
    detail: { type: "VIEW", amount: 10000 }
  }));
}
```

## Tom tat thay doi

| Tep | Thay doi |
|---|---|
| `src/lib/enhancedRewards.ts` | Cap nhat VIEW=10000, LIKE=5000 cho khop DB |
| `supabase/functions/award-camly/index.ts` | Giu nguyen logic (da dung), chi can chay recalculate |
| `src/components/Video/Mobile/MobileWatchView.tsx` | Them toast thong bao khi nhan thuong |
| `src/components/Video/YouTubeMobilePlayer.tsx` | Dispatch camly-reward event sau khi thuong thanh cong |
| `src/components/Video/MobileVideoPlayer.tsx` | Tuong tu -- dispatch event |

## Ket luan

- **He thong thuong VIEW**: Dang hoat dong nhung user khong thay thong bao tren mobile
- **He thong thuong 70K**: Dang hoat dong cho video moi co duration. 392 video cu can backfill duration roi chay recalculate
- **Lich su phan thuong**: UI dung, du lieu sai do NULL duration
- **Hanh dong ngay**: Chay recalculate cho 3 video da biet sai, them toast mobile, dong bo constants
