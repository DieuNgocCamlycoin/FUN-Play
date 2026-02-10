

# Nang cap hieu ung Celebration — 160 coin toan man hinh, 72 coin trong card, nut X/Loa hien thi ro

---

## 1. Fullscreen Coin Shower: 40 -> 160 dong tien (80 roi xuong + 80 ban len)

**File: `src/components/Donate/GiftCelebrationModal.tsx`** (dong 106-136)

Thay doi `FullscreenCoinShower`:
- 80 dong tien roi tu tren xuong (giu animation `coin-fall` hien tai)
- 80 dong tien ban tu duoi len (dung animation `coin-rise` moi)
- Tong cong 160 dong tien tren man hinh
- Mix CAMLY coin va Fun Money coin

## 2. Card Internal Effects: 18 -> 72 dong tien, bay ca 2 chieu

**File: `src/components/Donate/GiftCelebrationModal.tsx`** (dong 139-193)

Thay doi `CardInternalEffects`:
- Tang tu 18 len 72 dong tien (gap 4 lan)
- Tang sparkles tu 10 len 40
- 36 dong bay tu duoi len (coin-float-up), 36 dong roi tu tren xuong (coin-float-down moi)
- Cac dong tien xuat hien va bien mat lien tuc, phan bo deu trong card

## 3. Them CSS animation moi

**File: `src/index.css`**

Them 2 keyframe moi:
- `coin-rise`: dong tien bay tu duoi man hinh len tren (nguoc voi coin-fall)
- `coin-float-down`: dong tien roi tu tren xuong trong card (nguoc voi coin-float-up)

```css
@keyframes coin-rise {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(-30px) rotate(720deg); opacity: 0; }
}

@keyframes coin-float-down {
  0% { transform: translateY(-120%) rotate(0deg) scale(0.8); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(100%) rotate(360deg) scale(0.7); opacity: 0; }
}
```

## 4. Nut Loa va X hien thi ro rang tren Card

**File: `src/components/Donate/GiftCelebrationModal.tsx`** (dong 472-486)

Hien tai 2 nut nam o `absolute top-2 right-2` voi `variant="ghost"` nen kho nhin thay. Thay doi:
- Tang kich thuoc nut tu `h-7 w-7` len `h-9 w-9`
- Tang icon tu `h-3.5 w-3.5` len `h-5 w-5`
- Them nen ban trong: `bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full`
- Them border `ring-1 ring-white/20`
- Di chuyen ra ngoai card (nam tren cung cua modal, de nhin thay)

## 5. Cap nhat PreviewCelebration.tsx

**File: `src/pages/PreviewCelebration.tsx`** (dong 48-77)

- `MockCardInternalEffects`: tang tu 12 coin len 48, tang sparkles tu 8 len 32
- Them coin roi tu tren xuong (coin-float-down) ben canh coin bay len

---

## Tom tat

| # | File | Thay doi |
|---|------|----------|
| 1 | `src/index.css` | Them keyframe `coin-rise` + `coin-float-down` + class tuong ung |
| 2 | `GiftCelebrationModal.tsx` | FullscreenCoinShower 160 coin (80 roi + 80 bay len); CardInternalEffects 72 coin + 40 sparkles; nut Loa/X lon hon + nen ro |
| 3 | `PreviewCelebration.tsx` | MockCardInternalEffects 48 coin + 32 sparkles, 2 chieu |

