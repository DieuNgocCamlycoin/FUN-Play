

# Xoa FUN Wallet khoi menu va doi ten FUN.RICH thanh FUN PROFILE

## Van de hien tai

Trong phan FUN ECOSYSTEM cua menu, hien tai co 4 muc:
1. FUN.RICH (lien ket ngoai)
2. FUN FARM (lien ket ngoai)
3. FUN PLANET (lien ket ngoai)
4. FUN Wallet (lien ket noi bo /fun-wallet)

Nguoi dung muon:
- Xoa muc **FUN Wallet** khoi menu hoan toan
- Doi ten **FUN.RICH** thanh **FUN PROFILE**

## Giai phap

Chinh sua mang `funPlatformItems` trong ca 3 file navigation de xoa muc FUN Wallet va doi ten FUN.RICH thanh FUN PROFILE.

## Chi tiet thay doi

### 1. `src/components/Layout/Sidebar.tsx`

**Mang `funPlatformItems` (dong 35-60):**
- Dong 38: Doi label `"FUN.RICH"` thanh `"FUN PROFILE"`
- Xoa muc FUN Wallet (dong 54-59): xoa khoi mang

### 2. `src/components/Layout/CollapsibleSidebar.tsx`

**Mang `funPlatformItems` (dong 26-51):**
- Dong 29: Doi label `"FUN.RICH"` thanh `"FUN PROFILE"`
- Xoa muc FUN Wallet (dong 45-50): xoa khoi mang

### 3. `src/components/Layout/MobileDrawer.tsx`

**Mang `funPlatformItems` (dong 37-62):**
- Dong 40: Doi label `"FUN.RICH"` thanh `"FUN PROFILE"`
- Xoa muc FUN Wallet (dong 56-61): xoa khoi mang

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File can sua | 3 file |
| Muc xoa | FUN Wallet (xoa khoi ca 3 file) |
| Muc doi ten | FUN.RICH thanh FUN PROFILE (ca 3 file) |
| Co so du lieu | Khong |
| Dong bo Mobile | Co (MobileDrawer) |

## Luu y

- Trang `/fun-wallet` van ton tai va co the truy cap truc tiep qua URL, chi xoa khoi menu dieu huong
- Cac style gradient dac biet cua FUN Wallet (`isWallet`, `bg-gradient-to-r from-yellow-500/10...`) se khong con duoc su dung trong menu nhung co the giu lai trong code de tranh anh huong den cac noi khac
- Logo `/images/fun-rich-logo.png?v=2` van duoc giu nguyen, chi doi nhan hien thi

## Ket qua

- Menu FUN ECOSYSTEM chi con 3 muc: **FUN PROFILE**, FUN FARM, FUN PLANET
- Hien thi dong nhat tren Desktop (Sidebar, CollapsibleSidebar) va Mobile (MobileDrawer)

