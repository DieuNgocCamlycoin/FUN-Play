

# Sửa lỗi: Hiển thị Trang Trí Tết trên Trang Chủ

## Nguyên nhân

Trang chủ (`src/pages/Index.tsx`) tự xây dựng layout riêng (Header, Sidebar, v.v.) thay vì sử dụng `MainLayout.tsx`. Component `TetDecorations` đã được thêm vào `MainLayout`, nhưng vì trang chủ không dùng `MainLayout` nên hoa đào, hoa mai không xuất hiện.

## Giải pháp

Thêm `<TetDecorations />` trực tiếp vào `Index.tsx` -- chỉ cần 2 dòng code:

1. Import component `TetDecorations`
2. Render `<TetDecorations />` bên trong trang chủ

## Chi tiết kỹ thuật

### File sửa: `src/pages/Index.tsx`

- Thêm dòng import: `import { TetDecorations } from "@/components/Layout/TetDecorations";`
- Thêm `<TetDecorations />` ngay sau thẻ `<div>` mở đầu của component (dòng 303), trước phần nội dung chính

### Không cần sửa file nào khác

`MainLayout.tsx` vẫn giữ nguyên `<TetDecorations />` để các trang khác (dùng MainLayout) vẫn hiển thị trang trí Tết.

## Kết quả

Sau khi sửa, trang chủ sẽ có:
- Banner "Chuc Mung Nam Moi" gradient hong-vang phia tren
- 18 canh hoa dao (hong) va hoa mai (vang) roi nhe nhang
- Nguoi dung co the tat banner bang nut X

