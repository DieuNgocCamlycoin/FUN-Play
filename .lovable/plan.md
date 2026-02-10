
# Điều chỉnh Celebration Card — Bỏ "Chủ đề", bỏ nút "Xem", thêm nút Lưu/Share, xoá khung tối Modal, nâng cấp hiệu ứng ăn mừng

---

## 1. Xoá mục "Chủ đề" trên DonationCelebrationCard (Profile)

**File: `src/components/Profile/DonationCelebrationCard.tsx`** (dong 237-240)

Xoa dong:
```
<div className="flex justify-between"><span className="text-white/60">Chu de</span><span>...</span></div>
```

## 2. Xoa nut "Xem Celebration Card" tren DonationCelebrationCard

**File: `src/components/Profile/DonationCelebrationCard.tsx`** (dong 276-284)

Xoa toan bo `<Button>` "Xem Celebration Card" o cuoi card.

## 3. Them nut Luu + Share goc duoi cua Celebration Card

**File: `src/components/Profile/DonationCelebrationCard.tsx`**

Thay vi nut "Xem Celebration Card", them 2 icon nho goc duoi:
- Goc trai: icon Download (Luu ve thiet bi) — su dung `html2canvas` de capture card thanh anh va download
- Goc phai: icon Share (Chia se len profile) — copy link hoac trigger share API

Layout: `flex justify-between` o bottom, 2 nut icon nho `h-8 w-8` voi nen `bg-white/10 hover:bg-white/20 rounded-full`.

Moi nguoi deu xem, luu, share duoc card cua nhau (khong can kiem tra quyen).

## 4. Xoa khung nen toi trong GiftCelebrationModal (Muc 1)

**File: `src/components/Donate/GiftCelebrationModal.tsx`** (dong 484)

Hien tai dong 484: `<div className="space-y-1.5 text-sm bg-black/30 rounded-xl p-3 backdrop-blur-sm">`

Doi thanh: `<div className="space-y-1.5 text-sm">` — xoa `bg-black/30 rounded-xl p-3 backdrop-blur-sm`.

## 5. Xoa muc "Chu de" trong GiftCelebrationModal

**File: `src/components/Donate/GiftCelebrationModal.tsx`** (dong 486)

Xoa dong: `<div className="flex justify-between"><span>Chu de</span>...</div>`

## 6. Nang cap hieu ung an mung — phao hoa + tien roi 15 giay toan man hinh

**File: `src/components/Donate/GiftCelebrationModal.tsx`**

Hien tai confetti chi ban 1 lan khi mount (4 dot ngan). Thay doi:

- Tao interval ban confetti moi 1.5 giay trong 15 giay (10 dot ban)
- Tang `particleCount` tu 50-100 len 120-200
- Ban tu nhieu vi tri (trai, phai, giua) xen ke
- Coin shower: tang tu 20 dong tien len 40, keo dai animation tu 5 giay len 15 giay
- Am thanh Rich Rich Rich phat kem va loop trong 15 giay
- Nut X (da co) de tat hieu ung + am thanh bat ky luc nao
- Khi vuot/dong modal: cleanup audio tu dong (da co `useEffect` cleanup)

## 7. Cap nhat PreviewCelebration.tsx

**File: `src/pages/PreviewCelebration.tsx`**

- MockDonationCelebrationCard: xoa muc "Chu de", xoa nut "Xem Celebration Card", them 2 icon Luu/Share goc duoi
- MockChatDonationCard: xoa muc "Chu de", xoa nut "Xem Celebration Card", them 2 icon Luu/Share goc duoi

## 8. Cap nhat ChatDonationCard.tsx

**File: `src/components/Chat/ChatDonationCard.tsx`**

- Xoa muc "Chu de" (dong 233)
- Xoa nut "Xem Celebration Card" (dong 260-268)
- Them 2 icon Luu/Share goc duoi tuong tu Profile card

---

## Tom tat

| # | File | Thay doi |
|---|------|----------|
| 1 | `GiftCelebrationModal.tsx` | Xoa khung toi `bg-black/30`; xoa muc "Chu de"; nang cap confetti 15 giay + coin shower 40 dong tien + loop am thanh |
| 2 | `DonationCelebrationCard.tsx` | Xoa muc "Chu de"; xoa nut "Xem Celebration Card"; them icon Luu + Share goc duoi |
| 3 | `ChatDonationCard.tsx` | Xoa muc "Chu de"; xoa nut "Xem Celebration Card"; them icon Luu + Share goc duoi |
| 4 | `PreviewCelebration.tsx` | Cap nhat mock cards dong bo voi cac thay doi tren |
