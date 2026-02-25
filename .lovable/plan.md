
# Bổ sung DynamicMeta cho PostDetail.tsx

## Mục tiêu
Thêm component `DynamicMeta` vào trang `PostDetail.tsx` để trang có đầy đủ thẻ Open Graph, Twitter Card và canonical URL khi hiển thị bài đăng -- hoàn thiện yêu cầu cuối cùng của Bài 7.

## Thay đổi

**File**: `src/pages/PostDetail.tsx`

1. **Import**: Thêm `DynamicMeta` từ `@/components/SEO/DynamicMeta`

2. **Render**: Thêm `<DynamicMeta>` ngay cạnh `<PostJsonLd>` (bên trong khối `{post.profile?.username && post.slug && (...)}`), với các props:
   - `title`: `"{headline} | FUN Play"`
   - `description`: 160 ký tự đầu của nội dung bài
   - `image`: Ảnh đầu tiên của bài (nếu có), fallback về ảnh mặc định
   - `url`: URL công khai dạng `https://play.fun.rich/{username}/post/{slug}`
   - `type`: `"website"`
   - `canonicalUrl`: Giống `url` -- URL sạch không có query string
   - `author`: Tên tác giả
   - `siteName`: `"FUN Play"`

## Kết quả

Sau khi triển khai, trang PostDetail sẽ tự động cập nhật:
- `document.title`
- Thẻ `og:title`, `og:description`, `og:image`, `og:url`
- Thẻ `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Thẻ `<link rel="canonical">`

Hoàn thiện 100% yêu cầu Meta tags của Bài 7.
