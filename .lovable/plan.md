

# Sua loi hieu ung Celebration — coin ban len giua man hinh, nut Loa/X nam trong card, coin bay 2/3 khung hinh

---

## Van de hien tai

1. **Fullscreen coin-rise**: 80 dong tien "ban len" dang nam im o bottom vi animation `coin-rise` dung `forwards` va `translateY(100vh)` lam start position — coin bat dau o ngoai viewport va co the khong hien thi dung. Can sua animation de coin ban tu duoi len giua man hinh voi hieu ung tung toe vui nhon.

2. **Nut Loa va X**: Dang nam o `absolute top-3 right-3` trong modal container (`motion.div`) — nam **ngoai** card Celebration. Can di chuyen 2 nut nay **vao ben trong** card (div `ref={cardRef}`).

3. **DonationCelebrationCard (Profile)**: Hien tai **khong co** nut Loa va X. Can them 2 nut nay vao card de user co the tat hieu ung va am thanh khi xem bai viet.

4. **Card internal coins**: Cac dong tien chi bay sat vien khung card, khong bay vao giua. Can dieu chinh animation de coin bay vao 2/3 khung hinh card.

---

## Chi tiet ky thuat

### 1. Sua CSS animation `coin-rise` — ban tu duoi len giua man hinh

**File: `src/index.css`**

Animation hien tai:
```css
@keyframes coin-rise {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(-30px) rotate(720deg); opacity: 0; }
}
.animate-coin-rise { animation: coin-rise 4s ease-in forwards; }
```

Sua thanh: coin bat dau tu duoi (`bottom: 0`) va bay len giua man hinh (`translateY(-50vh)`) roi mo dan di. Dong thoi doi animation fill mode tu `forwards` sang `infinite` de coin lap lai lien tuc giong nhu coin-fall:

```css
@keyframes coin-rise {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
}
.animate-coin-rise { animation: coin-rise 4s ease-in forwards; }
```

Va trong `FullscreenCoinShower`, doi vi tri bat dau cua rising coins tu `bottom: "-30px"` sang `bottom: "0"` va them `top: "auto"`.

### 2. Sua CSS animation `coin-float-up` va `coin-float-down` — bay vao 2/3 khung hinh

**File: `src/index.css`**

Hien tai coin-float-up bay tu `translateY(100%)` den `translateY(-120%)` — di chuyen qua nhanh qua khung hinh, chi thay o vien. Sua lai de coin bay cham hon, dung lai o khoang 30-70% khung hinh roi bien mat:

```css
@keyframes coin-float-up {
  0% { transform: translateY(100%) rotate(0deg) scale(0.8); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(0%) rotate(180deg) scale(1); opacity: 0.9; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-120%) rotate(360deg) scale(0.7); opacity: 0; }
}

@keyframes coin-float-down {
  0% { transform: translateY(-120%) rotate(0deg) scale(0.8); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(0%) rotate(180deg) scale(1); opacity: 0.9; }
  90% { opacity: 0.6; }
  100% { transform: translateY(120%) rotate(360deg) scale(0.7); opacity: 0; }
}
```

Dong thoi tang `animationDuration` len 3.5-6s de coin di cham hon, hien thi lau hon trong khung hinh.

### 3. Di chuyen nut Loa + X vao trong Celebration Card

**File: `src/components/Donate/GiftCelebrationModal.tsx`**

Di chuyen block 2 nut (dong 525-548) tu vi tri `absolute top-3 right-3` o ngoai card vao ben trong card (sau dong 582 `{showEffects && <CardInternalEffects />}`), dat o goc tren phai trong card voi `absolute top-2 right-2 z-10`.

### 4. Them nut Loa + X vao DonationCelebrationCard (Profile)

**File: `src/components/Profile/DonationCelebrationCard.tsx`**

Them state `showEffects` va `isMuted` + `audioRef`. Khi `showEffects = true`:
- Render `CardInternalEffects` (72 coins + 40 sparkles) ben trong card
- Phat nhac "Rich Rich Rich" loop
- Hien 2 nut Loa (tat/bat am thanh) va X (tat hieu ung) o goc tren phai card

Khi xem bai viet, user co the bat/tat hieu ung va am thanh.

### 5. Cap nhat PreviewCelebration.tsx

**File: `src/pages/PreviewCelebration.tsx`**

- Them nut Loa + X vao MockDonationCelebrationCard va MockChatDonationCard
- Tang animationDuration de coin bay cham hon, hien thi ro trong 2/3 khung hinh

---

## Tom tat

| # | File | Thay doi |
|---|------|----------|
| 1 | `src/index.css` | Sua keyframes `coin-rise` (ban tu duoi len dung), `coin-float-up`/`coin-float-down` (bay vao 2/3 khung) |
| 2 | `GiftCelebrationModal.tsx` | Di chuyen nut Loa/X vao trong card; sua FullscreenCoinShower positioning |
| 3 | `DonationCelebrationCard.tsx` | Them state + CardInternalEffects + nut Loa/X + audio loop |
| 4 | `PreviewCelebration.tsx` | Them nut Loa/X vao mock cards; tang duration coin animation |

