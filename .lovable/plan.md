
# Thay logo FUN Wallet va FUN.RICH trong menu

## Muc tieu

Thay the logo cua 2 muc trong menu dieu huong:
1. **FUN Wallet** - Thay logo cu (`/images/fun-wallet-logo.png`) bang logo moi (hinh vi xanh voi chu "Fun")
2. **FUN.RICH** (FUN. Phong Phu) - Thay logo cu (`/images/fun-rich-logo.png`) bang logo moi (hinh tron xanh la "FUN Profile WEB3")

## Danh sach thay doi

### Buoc 1: Copy anh moi vao thu muc du an
- Copy `user-uploads://3-2.png` thanh `public/images/fun-wallet-logo.png` (ghi de logo cu)
- Copy `user-uploads://6.png` thanh `public/images/fun-rich-logo.png` (ghi de logo cu)

### Buoc 2: Khong can sua code
Vi ten file giu nguyen (ghi de truc tiep), tat ca 3 file dang tham chieu den cung duong dan cu se tu dong hien thi logo moi:
- `src/components/Layout/Sidebar.tsx` - dung `/images/fun-wallet-logo.png` va `/images/fun-rich-logo.png`
- `src/components/Layout/CollapsibleSidebar.tsx` - dung `/images/fun-wallet-logo.png` va `/images/fun-rich-logo.png`
- `src/components/Layout/MobileDrawer.tsx` - dung `/images/fun-wallet-logo.png` va `/images/fun-rich-logo.png`

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File anh can copy | 2 file |
| File code can sua | 0 file (ghi de truc tiep ten file cu) |
| Co so du lieu | Khong |
| Dong bo Mobile | Co (MobileDrawer dung cung duong dan) |

## Ket qua

- Logo FUN Wallet trong menu se hien thi hinh vi xanh voi chu "Fun" moi
- Logo FUN.RICH trong menu se hien thi hinh tron xanh la "FUN Profile WEB3" moi
- Cap nhat dong thoi tren Desktop (Sidebar, CollapsibleSidebar) va Mobile (MobileDrawer)
