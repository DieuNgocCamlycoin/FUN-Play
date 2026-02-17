

# Thay Doi Emoji: Phao Hoa/Trong thanh Hoa Mai/Hoa Dao

## Hien Trang

Trang bien nhan Tet 2026 dang hoat dong tot. Tuy nhien, co su dung emoji phao hoa (🎆) va confetti (🎊) -- nguoi dung muon thay bang hoa mai va hoa dao de phu hop hon voi chu de Tet truyen thong.

## Vi Tri Can Thay Doi

### File: `src/pages/Receipt.tsx`

| Vi tri | Hien tai | Thay thanh |
|--------|----------|------------|
| Dong 14: `TET_EMOJIS` array | `["🌸", "🏮", "🧧", "🎆", "🌺", "🎊"]` | `["🌸", "🏮", "🧧", "🌺", "💮", "🌷"]` |
| Dong 57-63: `TetBanner` emojis | `🧧 🏮 🎆 🏮 🧧` | `🧧 🌸 🌺 🌸 🧧` |
| Dong 335: DonationReceipt floating | `["🌸", "🏮", "🧧", "🎆"]` | `["🌸", "🌺", "🧧", "💮"]` |

### Giai thich lua chon emoji moi

- 🌸 — Hoa dao (cherry/peach blossom) — giu nguyen
- 🌺 — Hoa dai (hibiscus, tuong trung hoa Tet) — giu nguyen, dung thay 🎆
- 💮 — Hoa trang (white flower) — thay cho 🎊
- 🌷 — Hoa tulip (tuong trung mua xuan) — thay cho 🎊 trong TET_EMOJIS
- 🏮 — Den long — giu nguyen
- 🧧 — Li xi — giu nguyen

## Pham Vi

- 1 file duy nhat: `src/pages/Receipt.tsx`
- Chi thay doi emoji, khong thay doi logic hay CSS
- Ap dung tu dong cho ca web va mobile

