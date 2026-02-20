

## Giai phong hieu suat ShareModal + Tach biet CSS

### Tong quan
Toi uu hoa `ShareModal.tsx` bang cach loai bo `glass-card`, chuyen `motion.button` sang `button` CSS native, giam particles, va gom class dung chung vao bien.

### Thay doi chi tiet

#### 1. Loai bo `glass-card` va gradient overlay (dong 292-294)

**Truoc:**
```tsx
<DialogContent className="sm:max-w-lg glass-card border-2 border-cosmic-cyan/30 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-cosmic-cyan/5 via-transparent to-cosmic-magenta/5 pointer-events-none -z-10" />
```

**Sau:**
```tsx
<DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
```
- Bo `glass-card` (loai `rainbow-border` infinite + `backdrop-filter: blur(20px)`)
- Bo gradient overlay div
- Dung `backdrop-blur-sm` (4px) thay vi 20px

#### 2. Content Preview: `motion.div` -> `div` (dong 309-331)

Thay `motion.div` bang `div` voi class `animate-fade-in`. Bo `initial/animate` props.

#### 3. Copy button: Bo AnimatePresence (dong 351-372)

Thay `AnimatePresence` + 2 `motion.div` bang render don gian:
```tsx
{copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
```

#### 4. Copy Success: Giam particles tu 8 -> 4, bo 1 pulse ring (dong 378-428)

- Bo 1 trong 2 pulse rings (giu ring xanh la)
- Giam `[...Array(8)]` xuong `[...Array(4)]`, dung goc 90 do thay vi 45 do
- Giu center check icon nhung don gian hoa

#### 5. Tach CSS - Gom class dung chung vao bien (TRONG FILE)

Tao cac bien class dung chung o dau component:
```tsx
// Shared styles
const socialBtnClass = "flex flex-col items-center gap-2 min-w-[70px] group transition-transform duration-150 hover:scale-105 active:scale-95";
const socialIconClass = "w-14 h-14 rounded-full flex items-center justify-center shadow-md";
const socialLabelClass = "text-xs text-foreground/80 group-hover:text-foreground";
```

Moi nut social chi con:
```tsx
<button onClick={() => handleShare("facebook")} className={socialBtnClass}>
  <div className={cn(socialIconClass, "bg-[#1877F2]")}>
    <Facebook className="h-6 w-6 text-white" />
  </div>
  <span className={socialLabelClass}>Facebook</span>
</button>
```

Dieu nay giam ~50% ky tu lap lai va giup bao tri de hon.

#### 6. Chuyen 11 `motion.button` -> `button` (dong 448-588)

Thay tat ca `motion.button` (Facebook, Messenger, WhatsApp, X, TikTok, Telegram, Zalo, LinkedIn, Email, SMS, QR Code) bang `button` dung bien `socialBtnClass`.

Bo `whileHover={{ scale: 1.1 }}` va `whileTap={{ scale: 0.95 }}` -> CSS `hover:scale-105 active:scale-95` trong bien.

Thay `shadow-lg shadow-[color]/30` bang `shadow-md` don gian.

#### 7. Giu lai QR Code AnimatePresence (dong 593-613)

AnimatePresence cho QR toggle la hop ly vi chi chay 1 lan khi user nhan nut - KHONG gay giat.

#### 8. Don dep imports (dong 30)

Thay:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```
Bang:
```tsx
import { AnimatePresence, motion } from "framer-motion";
```
Van giu `motion` cho QR section va copy success (da don gian hoa). Hoac chi giu `AnimatePresence` neu QR section van can.

### Uoc tinh ket qua

| Hang muc | Truoc | Sau |
|----------|-------|-----|
| File size | ~624 dong | ~480 dong (~23% giam) |
| motion instances | 14+ (11 buttons + 2 copy + 1 preview) | 3-4 (QR + copy success) |
| GPU animations | `rainbow-border` infinite + `blur(20px)` | 0 infinite, `blur(4px)` |
| Class lap lai | 11 lan x ~80 ky tu | 3 bien dung chung |
| FPS khi cuon | Giat tren dien thoai yeu | 60fps muot |

### File thay doi
- 1 file duy nhat: `src/components/Video/ShareModal.tsx`

