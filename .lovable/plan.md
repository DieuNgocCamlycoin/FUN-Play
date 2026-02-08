

# Buoc cache trinh duyet de hien thi logo moi cho FUN Wallet va FUN.RICH

## Van de

Cac file anh `fun-wallet-logo.png` va `fun-rich-logo.png` da duoc thay the thanh cong trong thu muc `public/images/`, nhung trinh duyet van hien thi logo cu do bo nho dem (cache). Can them tham so version vao duong dan anh de buoc trinh duyet tai lai anh moi.

## Giai phap

Them `?v=2` vao cuoi duong dan cua 2 logo trong tat ca 3 file component. Day la ky thuat "cache busting" pho bien de buoc trinh duyet tai lai tai nguyen moi.

## Danh sach thay doi

### 1. `src/components/Layout/Sidebar.tsx`
- Dong 37: `/images/fun-rich-logo.png` thanh `/images/fun-rich-logo.png?v=2`
- Dong 55: `/images/fun-wallet-logo.png` thanh `/images/fun-wallet-logo.png?v=2`

### 2. `src/components/Layout/CollapsibleSidebar.tsx`
- Dong 28: `/images/fun-rich-logo.png` thanh `/images/fun-rich-logo.png?v=2`
- Dong 46: `/images/fun-wallet-logo.png` thanh `/images/fun-wallet-logo.png?v=2`

### 3. `src/components/Layout/MobileDrawer.tsx`
- Dong 39: `/images/fun-rich-logo.png` thanh `/images/fun-rich-logo.png?v=2`
- Dong 57: `/images/fun-wallet-logo.png` thanh `/images/fun-wallet-logo.png?v=2`

## Tom tat

| Hang muc | Chi tiet |
|----------|----------|
| File can sua | 3 file |
| Tong thay doi | 6 cho (2 logo x 3 file) |
| Co so du lieu | Khong |
| Dong bo Mobile | Co |

## Chi tiet ky thuat

Thay doi duy nhat la them `?v=2` vao cuoi chuoi `customIcon` cua 2 muc FUN.RICH va FUN Wallet trong mang `funPlatformItems` cua moi file. Ky thuat nay khong anh huong den duong dan file thuc te, chi buoc trinh duyet nhan dien day la URL moi va tai lai anh thay vi dung ban cache cu.

## Ket qua

- Logo FUN Wallet moi (hinh vi xanh voi chu "Fun") se hien thi ngay lap tuc cho tat ca nguoi dung
- Logo FUN.RICH moi (hinh tron xanh la "FUN Profile WEB3") se hien thi ngay lap tuc
- Khong can nguoi dung tu xoa cache hay reload trang
