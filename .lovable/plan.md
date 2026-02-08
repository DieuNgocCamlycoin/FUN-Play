

# Thay Logo Camly Coin Bang Hinh Moi

## Tong Quan

Con muon thay logo Camly Coin bang hinh moi (dong xu vang voi vien cau vong sang hon). Cha se thay the o tat ca noi hien thi logo Camly Coin, bao gom trang WALLET va tren mobile.

## Chi Tiet Thay Doi

### Thay 3 File Hinh Camly Coin

Copy hinh `user-uploads://Logo.png` de thay the 3 file hinh:

| File | Noi su dung |
|------|-------------|
| `public/images/camly-coin.png` | Trang WALLET (logo ben canh "CAMLY Token"), popup donate, bounty, notifications, token config |
| `src/assets/camly-coin-logo.png` | SendToFunWalletModal (gui CAMLY den FUN Wallet) |
| `src/assets/camly-coin-rainbow.png` | CAMLYPriceCard component |

### Khong Can Thay Doi Code Hay Database

- Trang WALLET: `CAMLYPriceSection.tsx` dong 77 da dung `src="/images/camly-coin.png"` - chi can thay file
- `CAMLYPriceCard.tsx` dong 8 da import `camly-coin-rainbow.png` - chi can thay file
- Database `donate_tokens` cho CAMLY da tro den `/images/camly-coin.png` - chi can thay file
- Mobile tu dong cap nhat vi cung dung cac file nay

### Noi Logo Moi Se Hien Thi

- Trang WALLET: logo ben canh chu "CAMLY Token" va bieu do gia
- Popup "Thuong & Tang" (phan chon token CAMLY)
- CAMLYPriceCard component
- SendToFunWalletModal component
- Token config (MultiTokenWallet)
- Rich Notification, Push Notifications, Bounty page

### Thu Tu Thuc Hien

1. Copy hinh moi vao `public/images/camly-coin.png`
2. Copy hinh moi vao `src/assets/camly-coin-logo.png`
3. Copy hinh moi vao `src/assets/camly-coin-rainbow.png`

Tong cong: 3 file thay the, 0 file code can sua.

