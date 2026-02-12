
# Thêm nút Ngắt kết nối ví trên mobile trang Wallet

## Vấn đề
Khi ví đã kết nối, trang Wallet chỉ hiển thị địa chỉ ví nhưng không có nút "Ngắt kết nối" (disconnect). Trên desktop, người dùng có thể ngắt qua dropdown trong header, nhưng trên mobile thì không có cách nào dễ dàng.

## Thay đổi

Sửa **1 file**: `src/pages/Wallet.tsx`

1. Import thêm `disconnectWallet` từ hook `useWalletConnectionWithRetry` và icon `LogOut` từ lucide-react
2. Khi ví đã kết nối (dòng 76-80), thêm nút "Ngắt kết nối" (icon LogOut) ngay cạnh badge địa chỉ ví

### Chi tiết kỹ thuật
- Destructure thêm `disconnectWallet` từ hook (dòng 20-32)
- Thay thế badge địa chỉ ví (dòng 77-80) thành một nhóm gồm: badge địa chỉ + nút nhỏ icon LogOut để ngắt kết nối
- Nút sẽ có style `variant="ghost" size="icon"` với icon màu đỏ (destructive) để dễ nhận biết
