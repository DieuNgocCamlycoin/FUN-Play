

## Cập Nhật OG Image Cho FUN Play

### Tổng Quan

Con đã cung cấp hình OG Image với logo FUN Play. Cha sẽ:
1. Copy hình vào thư mục `public/images/`
2. Cập nhật các meta tags trong `index.html` và `DynamicMeta.tsx`
3. Đảm bảo khi chia sẻ link `https://play.fun.rich` sẽ hiển thị logo FUN Play thay vì Lovable

---

### Các Bước Thực Hiện

#### Bước 1: Copy hình OG Image vào project

Copy file `photo_2025-12-04_22-36-48.jpg` vào `public/images/funplay-og-image.jpg`

**Lưu ý**: Dùng thư mục `public/` vì hình này được dùng trong meta tags HTML, không phải React component.

---

#### Bước 2: Cập nhật `index.html`

Thay đổi URL OG image từ Google Storage sang URL trên domain chính:

```html
<!-- Thay đổi og:image -->
<meta property="og:image" content="https://play.fun.rich/images/funplay-og-image.jpg">

<!-- Thêm og:image:width và og:image:height -->
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Thay đổi twitter:image -->
<meta name="twitter:image" content="https://play.fun.rich/images/funplay-og-image.jpg">

<!-- Thêm og:url -->
<meta property="og:url" content="https://play.fun.rich">
```

---

#### Bước 3: Cập nhật `src/components/SEO/DynamicMeta.tsx`

Thay đổi default image URL:

```typescript
// Trước
image = "https://lovable.dev/opengraph-image-p98pqg.png",

// Sau
image = "https://play.fun.rich/images/funplay-og-image.jpg",
```

---

### Tóm Tắt File Thay Đổi

| File | Thay đổi |
|------|----------|
| `public/images/funplay-og-image.jpg` | **MỚI** - Copy từ user upload |
| `index.html` | Cập nhật `og:image`, `twitter:image` URL + thêm dimensions |
| `src/components/SEO/DynamicMeta.tsx` | Cập nhật default image URL |

---

### Sau Khi Deploy

Để các nền tảng cập nhật preview mới, con cần clear cache:

| Nền tảng | Cách làm |
|----------|----------|
| **Facebook** | Vào https://developers.facebook.com/tools/debug/ → Paste link → Bấm "Scrape Again" |
| **Telegram** | Gửi link trong chat riêng với @webpagebot hoặc xóa tin nhắn cũ, gửi lại link |
| **LinkedIn** | Vào https://www.linkedin.com/post-inspector/ → Paste link |

---

### Kết Quả Mong Đợi

Khi chia sẻ `https://play.fun.rich` trên Telegram/Zalo/Facebook:
- Hiển thị logo FUN Play với trái đất và nốt nhạc
- Tiêu đề: "FUN Play: Web3 AI Social"
- Mô tả: "The place where every soul turns value into digital assets forever – Rich Rich Rich"

