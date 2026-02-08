
# Trang Trí Tết Nguyên Đán - Hoa Đào & Hoa Mai Rơi

## Mục tiêu
Thêm không khí Tết Nguyên Đán vào giao diện FUN Play với hiệu ứng hoa đào (peach blossoms) và hoa mai (apricot blossoms) rơi nhẹ nhàng. Thay đổi code tối thiểu (chỉ tạo 1 file mới + thêm 1 dòng import).

## Cách tiếp cận
Tạo một component `TetDecorations` sử dụng CSS animations thuần (không cần thư viện mới). Component này sẽ render các cánh hoa đào hồng và hoa mai vàng rơi nhẹ nhàng trên nền giao diện, tạo cảm giác lễ hội mà không ảnh hưởng đến trải nghiệm sử dụng.

## Thiết kế hiệu ứng

### Hoa rơi
- 15-20 cánh hoa với kích thước và tốc độ ngẫu nhiên
- Hoa đào: màu hồng nhạt (#FFB7C5, #FF69B4)
- Hoa mai: màu vàng (#FFD700, #FFC107)
- Animation: rơi từ trên xuống + xoay nhẹ, lặp lại liên tục
- `pointer-events: none` để không chặn tương tác người dùng
- `z-index` thấp, nằm phía sau nội dung chính

### Câu chúc Tết (tùy chọn)
- Banner nhỏ gọn phía trên header: "Chuc Mung Nam Moi - Happy Tet 2025!" với gradient hồng-vàng
- Có nút (X) để người dùng tắt nếu muốn

## Chi tiết kỹ thuật

### File mới: `src/components/Layout/TetDecorations.tsx`
- Component render ~18 cánh hoa (9 đào + 9 mai) với CSS animation
- Mỗi cánh hoa có vị trí ngang (`left`), độ trễ (`animation-delay`), và thời gian rơi (`animation-duration`) ngẫu nhiên
- Sử dụng CSS `@keyframes` cho hiệu ứng rơi + xoay
- Cánh hoa được vẽ bằng CSS (border-radius tạo hình cánh hoa) hoặc emoji Unicode
- Toàn bộ container có `position: fixed`, `inset: 0`, `pointer-events: none`, `z-index: 5`

### File sửa: `src/components/Layout/MainLayout.tsx`
- Chỉ thêm 1 dòng import + 1 dòng render component `<TetDecorations />`

### File sửa: `src/index.css`
- Thêm keyframes animation cho hiệu ứng hoa rơi (`@keyframes tet-fall`, `@keyframes tet-sway`)

## Ưu điểm
- Thay đổi code cực kỳ ít (2 file sửa + 1 file mới)
- Không cần cài thêm thư viện
- Không ảnh hưởng performance (CSS animations chạy trên GPU)
- Dễ tắt sau Tết: chỉ cần xóa 1 dòng trong MainLayout
- Không chặn click/tương tác của người dùng

## Các file cần tạo/sửa

| File | Hành động |
|------|-----------|
| `src/components/Layout/TetDecorations.tsx` | Tao moi - Component hoa dao/hoa mai roi |
| `src/components/Layout/MainLayout.tsx` | Sua - Them 1 dong import va render TetDecorations |
| `src/index.css` | Sua - Them keyframes animation cho hoa roi |

## Tắt sau Tết
Khi Tết kết thúc, con chỉ cần nói "Cha ơi, tắt trang trí Tết giúp con" và cha sẽ xóa component đó ra khỏi MainLayout. Rất đơn giản!
