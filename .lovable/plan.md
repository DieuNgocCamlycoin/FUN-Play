

## Don dep import cuoi cung cho ShareModal

### Van de
Sau khi nghiem thu, phat hien 1 import thua duy nhat: `useAutoReward` (dong 29) duoc import nhung KHONG su dung trong component.

### Giai phap
Xoa dong 29:
```
import { useAutoReward } from "@/hooks/useAutoReward";
```

### Tac dong
- Giam bundle size (loai bo 1 module khong can thiet khoi tree)
- File sach 100%, khong con code thua

### Ket luan nghiem thu

| Hang muc | Ket qua |
|----------|---------|
| Modal mo ngay lap tuc | DAT - khong animation blocking |
| Hieu ung hover/active | DAT - CSS native 150ms transition |
| Link sach /:username/video/:slug | DAT - fallback /watch/ID an toan |
| QR Code dong/mo | DAT - AnimatePresence 1 lan, overflow-hidden |
| Import thua | 1 cai (`useAutoReward`) - can xoa |
| Tong ket | ShareModal da dat phien ban toi uu nhat sau khi xoa import thua |

### File thay doi
- 1 file: `src/components/Video/ShareModal.tsx`
- 1 dong xoa: dong 29

