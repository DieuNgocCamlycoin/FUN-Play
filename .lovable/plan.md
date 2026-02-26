

# Tạo ảnh OG Image 1200x630px từ logo FUN Play

## Mục tiêu
Thay thế file `public/images/funplay-og-image.jpg` hiện tại (đang vuông) bằng ảnh mới kích thước 1200x630px (tỉ lệ ngang 16:9), giúp preview link trên Telegram/Zalo hiển thị nhỏ gọn giống YouTube.

## Cách thực hiện

### Tạo script sinh ảnh OG tự động
Tạo một trang utility (`/generate-og`) sử dụng HTML Canvas để:
1. Vẽ background gradient (tông màu tím/xanh phù hợp thương hiệu FUN Play)
2. Đặt logo `funplay-logo.png` ở giữa
3. Thêm text "FUN Play" và tagline bên dưới
4. Export ra file JPEG 1200x630px để tải về

### Thay thế file tĩnh
- Tải file vừa tạo về và thay thế `public/images/funplay-og-image.jpg`
- Không cần sửa code trong `prerender` edge function vì tên file giữ nguyên

## Chi tiết kỹ thuật

**File mới**: `src/pages/GenerateOG.tsx` - Trang tiện ích tạm thời, render canvas 1200x630 với:
- Background: linear gradient từ `#1a0533` sang `#0a1628` (tông dark purple-blue của FUN Play)
- Logo: load từ `src/assets/funplay-logo.png`, đặt giữa canvas, kích thước ~200x200px
- Text: "FUN Play" font bold 48px, màu trắng, bên dưới logo
- Tagline: "Web3 AI Social" font 24px, màu trắng mờ
- Nút "Download" để tải ảnh về dưới dạng JPG

**File sửa**: `src/App.tsx` - Thêm route tạm `/generate-og`

Sau khi tải ảnh về, thay file `public/images/funplay-og-image.jpg` và xóa route tạm.

## Kết quả
- Ảnh OG mới có tỉ lệ ngang 1200x630px
- Preview link trên Telegram/Zalo/Facebook sẽ hiển thị dạng card nhỏ gọn giống YouTube
- Ảnh có brand identity rõ ràng với logo + gradient

