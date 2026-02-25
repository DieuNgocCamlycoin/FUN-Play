

# Cập nhật PostJsonLd sang type Article

## Thay đổi

Sửa một dòng duy nhất trong `src/components/SEO/PostJsonLd.tsx`: đổi `"@type": "SocialMediaPosting"` thành `"@type": "Article"` để chuẩn hóa theo yêu cầu Bài 7.

## Chi tiết kỹ thuật

| Tệp | Dòng | Trước | Sau |
|------|------|-------|-----|
| `src/components/SEO/PostJsonLd.tsx` | 33 | `"@type": "SocialMediaPosting"` | `"@type": "Article"` |

## Lưu ý

- `Article` là schema type được Google Search khuyến nghị cho nội dung bài viết, hỗ trợ rich results tốt hơn `SocialMediaPosting`
- Không ảnh hưởng đến các trường dữ liệu khác vì `SocialMediaPosting` kế thừa từ `Article` — tất cả thuộc tính hiện tại đều hợp lệ với `Article`

