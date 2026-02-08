
# Can bang chieu cao 3 nut THUONG & TANG, MINT va WALLET tren header

## Van de hien tai

Ba nut chinh tren thanh header co kich thuoc khong dong deu:

- **THUONG & TANG**: `px-4 py-2`, icon `h-4 w-4`, text `text-base` -- nut nho nhat
- **MINT**: `px-4 py-2 h-auto`, icon `h-5 w-5`, text `text-base` -- vua
- **WALLET**: `px-5 py-2`, icon `h-11 w-11`, text `text-lg` -- nut lon nhat (vi icon vi rat lon)

Nut WALLET co icon kich thuoc `h-11 w-11` (44px) lam no cao hon han 2 nut con lai. Can chuan hoa ca 3 nut ve cung mot chieu cao co dinh.

## Giai phap

Chuan hoa ca 3 nut ve cung kich thuoc: chieu cao co dinh `h-10` (40px), padding `px-4 py-0`, icon `h-5 w-5`, text `text-sm font-extrabold`. Giam icon WALLET tu `h-11` xuong `h-6` de vua voi chieu cao nut.

## Chi tiet thay doi

### 1. `src/components/Donate/GlobalDonateButton.tsx` (Nut THUONG & TANG - Desktop)

**Dong 59-73** - Default variant:
- Them chieu cao co dinh: `h-10`
- Giu icon: `h-4 w-4` (da phu hop)
- Giu text: `text-base font-extrabold`
- Giu padding: `px-4 py-2`
- Khong doi gi nhieu vi nut nay la co so can bang

### 2. `src/components/Layout/Header.tsx` (Nut MINT)

**Dong 203-224** - MINT button:
- Them chieu cao co dinh: `h-10` (thay `h-auto`)
- Giu icon: `h-5 w-5`
- Giu text: `text-base font-extrabold`
- Giu padding: `px-4`

### 3. `src/components/Wallet/WalletButton.tsx` (Nut WALLET - Desktop)

**Dong 167-222** - Full version:
- Them chieu cao co dinh: `h-10` (khop voi 2 nut kia)
- Giam icon tu `h-11 w-11` xuong `h-6 w-6` (phu hop voi chieu cao nut)
- Xoa `-ml-2` (khong can vi icon nho hon)
- Doi text tu `text-lg` xuong `text-base` (khop voi MINT va THUONG & TANG)
- Doi padding tu `px-5` xuong `px-4` (khop voi cac nut khac)

### 4. Mobile - Khong co loi hien thi

Tren mobile, MobileHeader chi hien thi WalletButton o che do `compact` (icon nho `h-7 w-7`). Cac nut MINT va THUONG & TANG khong hien thi tren mobile header (chi hien tren desktop `hidden md:flex`). Do do khong co van de can chinh tren mobile cho 3 nut nay.

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File can sua | 3 file |
| Thay doi chinh | Chuan hoa chieu cao `h-10`, icon, va text size |
| WALLET icon | `h-11 w-11` giam xuong `h-6 w-6` |
| WALLET text | `text-lg` giam xuong `text-base` |
| MINT height | `h-auto` doi thanh `h-10` |
| Mobile | Khong can thay doi (chi hien compact wallet icon) |
| Co so du lieu | Khong |

## Ket qua

- Ca 3 nut THUONG & TANG, MINT, WALLET se co cung chieu cao 40px (`h-10`)
- Text va icon dong deu, tao cam giac can doi va chuyen nghiep
- Giao dien header gon gang, khong bi le do nut WALLET lon bat thuong
