
# Sua Loi Thuong Xem Video (VIEW Reward) va Cap Nhat Mobile

## Van de phat hien

### 1. Desktop khong co thong bao khi nhan thuong VIEW
- `EnhancedVideoPlayer.tsx` (desktop) goi `awardViewReward()` nhung **KHONG dispatch event** `camly-reward`
- Ket qua: user xem video tren desktop, nhan thuong nhung khong thay thong bao gi
- Mobile da duoc sua lan truoc, nhung desktop chua

### 2. Nguong xem video qua cao (90% cho video ngan)
- Tat ca 3 player (Desktop, YouTubeMobile, MobileVideoPlayer) yeu cau xem **90% video ngan (<5 phut)** hoac **5 phut lien tuc cho video dai**
- Nhung `reward_config` trong DB chi yeu cau **MIN_WATCH_PERCENTAGE = 30%**
- Day la nguyen nhan chinh khien user cam thay "xem video ma khong duoc thuong": ho phai xem gan het video moi duoc thuong
- **De xuat**: Giam nguong xuong **60%** cho video ngan (hop ly hon, van chong gian lan)

### 3. Du lieu thuong VIEW dang hoat dong
- 25 giao dich VIEW trong 48h qua (1 giao dich 10.000, 24 giao dich 5.000)
- He thong dang hoat dong nhung nguong xem qua cao nen it user dat duoc

## Giai phap

### Tep 1: `src/components/Video/EnhancedVideoPlayer.tsx`
Them dispatch event `camly-reward` sau khi `awardViewReward` thanh cong (giong mobile):

```tsx
// Truoc:
await awardViewReward(videoId);

// Sau:
const result = await awardViewReward(videoId);
if (result) {
  window.dispatchEvent(new CustomEvent("camly-reward", {
    detail: { type: "VIEW", amount: 10000 }
  }));
}
```

### Tep 2: Giam nguong xem video de nhan thuong (tat ca 3 player)

Thay doi nguong tu 90% xuong 60% cho video ngan:

| Tep | Thay doi |
|---|---|
| `src/components/Video/EnhancedVideoPlayer.tsx` | `0.9` thanh `0.6` |
| `src/components/Video/YouTubeMobilePlayer.tsx` | `0.9` thanh `0.6` |
| `src/components/Video/MobileVideoPlayer.tsx` | `0.9` thanh `0.6` |

### Tep 3: `src/pages/Watch.tsx` (Desktop watch page)
Them listener `camly-reward` de hien thi toast thong bao khi nhan thuong (tuong tu MobileWatchView):

```tsx
useEffect(() => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    toast.success(`+${Number(detail.amount).toLocaleString()} CAMLY`, {
      description: `Thuong xem video`,
      duration: 3000,
    });
  };
  window.addEventListener('camly-reward', handler);
  return () => window.removeEventListener('camly-reward', handler);
}, []);
```

## Tom tat thay doi

| Tep | Thay doi |
|---|---|
| `src/components/Video/EnhancedVideoPlayer.tsx` | Dispatch camly-reward event + giam nguong 90% xuong 60% |
| `src/components/Video/YouTubeMobilePlayer.tsx` | Giam nguong 90% xuong 60% |
| `src/components/Video/MobileVideoPlayer.tsx` | Giam nguong 90% xuong 60% |
| `src/pages/Watch.tsx` | Them toast thong bao khi nhan thuong VIEW tren desktop |

## Ket qua mong doi
- User se thay thong bao "+10.000 CAMLY" khi xem video du tren desktop hay mobile
- Nguong xem giam tu 90% xuong 60%, nhieu user hon se dat duoc dieu kien nhan thuong
- Trang lich su thuong se cap nhat realtime khi nhan thuong moi (da co san)
