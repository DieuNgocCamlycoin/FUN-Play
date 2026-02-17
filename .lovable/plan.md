

# Toi Uu Hoa Bien Nhan Tet 2026 — Giam Tai Nguyen & Don Dep Code

## Phat Hien Van De

Sau khi kiem tra trang bien nhan tai `/receipt/d8b9f8e2be945a64`, trang hien thi dung nhung co mot so van de:

### 1. Hieu ung Animation ton tai nguyen (Nghiem trong)
- `TetFloatingElements` dung 6 `motion.div` voi `repeat: Infinity` -- chay lien tuc, tieu ton CPU, dac biet tren mobile
- `DonationReceipt` co them 4 `motion.span` cung `repeat: Infinity`
- Tong cong: **10 animation chay vo han** tren moi bien nhan
- Session replay xac nhan: DOM updates xay ra "multiple times per millisecond" -- rat nang

### 2. Import thua
- `CheckCircle` (lucide-react) -- khong duoc su dung
- `supabase` (client) -- import nhung khong dung trong Receipt
- `Wallet` -- chi dung trong ClaimReceipt error state, co the thay bang Gift de dong nhat

### 3. So CAMLY khong format trong DonationReceipt
- ClaimReceipt dung `Intl.NumberFormat("vi-VN")` -- hien thi "500.000"
- DonationReceipt chi hien thi raw "500000" -- khong nhat quan

## Giai Phap

### Buoc 1: Thay Framer Motion animation bang CSS animation
Thay vi 10 `motion.div/span` chay JS loop, dung CSS `@keyframes` + `animation` -- trình duyệt xu ly hieu qua hon (GPU-accelerated, khong can JS thread).

Thay `TetFloatingElements` component tu:
```tsx
// CU: 6 motion.div voi JS-driven infinite animation
<motion.div animate={{ y: [-6, 6, -6], rotate: [-5, 5, -5] }} transition={{ repeat: Infinity }} />
```

Thanh:
```tsx
// MOI: CSS animation, khong can framer-motion
<div className="absolute text-white/30 text-lg animate-float-gentle" style={{ ... }}>
```

Them CSS keyframes vao tailwind config hoac inline style.

### Buoc 2: Xoa import thua
- Xoa `CheckCircle`, `supabase` khoi import
- Giam bundle size

### Buoc 3: Format so CAMLY nhat quan
Them `Intl.NumberFormat("vi-VN")` cho DonationReceipt amount:
```tsx
// CU
{receipt.amount} {token?.symbol}

// MOI
{new Intl.NumberFormat("vi-VN").format(receipt.amount)} {token?.symbol}
```

### Buoc 4: Xoa framer-motion import neu khong con dung
Sau khi chuyen sang CSS animation, kiem tra xem `motion` con duoc dung khong. Neu khong, xoa import de giam bundle.

## File Thay Doi

| File | Thay Doi |
|------|----------|
| `src/pages/Receipt.tsx` | Thay motion animation bang CSS, xoa import thua, format so CAMLY |
| `src/index.css` (hoac tailwind config) | Them CSS keyframes cho float animation |

## Tac Dong

| Metric | Truoc | Sau |
|--------|-------|-----|
| JS animations dong thoi | 10 infinite loops | 0 (CSS thay the) |
| CPU usage tren mobile | Cao (DOM updates lien tuc) | Thap (GPU-accelerated CSS) |
| Unused imports | 3 | 0 |
| Bundle impact | motion dung trong Receipt | Co the xoa neu khong dung o noi khac |
| So format DonationReceipt | "500000" (raw) | "500.000" (formatted) |

Khong thay doi backend, khong thay doi Edge Function. Ap dung tu dong cho ca web va mobile.

