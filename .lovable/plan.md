

# Kế hoạch Triển khai: Sửa Slug Tiếng Việt + Slug History (301 Redirect)

## Tổng quan

Triển khai đồng thời 2 phần:
1. **Sửa lỗi slug tiếng Việt** - Thay thế phương pháp `translate()` bị lệch bằng Unicode NFD normalization, tăng giới hạn từ 80 lên 150 ký tự
2. **Slug History** - Tạo bảng lưu slug cũ, tự động redirect 301 khi slug thay đổi

## Bằng chứng lỗi hiện tại

Dữ liệu thực từ database cho thấy lỗi rõ ràng:

| Tiêu đề | Slug hiện tại (sai) | Slug đúng |
|---------|---------------------|-----------|
| "THIỀN CHỮA LÀNH" | `thien-chua-ldnh` | `thien-chua-lanh` |
| "ĐÓN GIÁNG SINH TRONG NHÀ CHA" | `yon-giang-sinh-trong-nhd-cha` | `don-giang-sinh-trong-nha-cha` |
| "Trái Đất" | `trai-yat` | `trai-dat` |
| "dẫn Thiền" | bị cắt cụt | `dan-thien` |

Nguyên nhân: Chuỗi `translate()` trong PostgreSQL bị lệch vị trí ký tự, khiến "Đ" -> "y", "Ạ" -> sai, v.v.

---

## Các bước triển khai

### Bước 1: Nâng cấp `src/lib/slugify.ts`

Thay thế toàn bộ VIETNAMESE_MAP bằng thuật toán NFD normalization:
- Xử lý riêng "đ" -> "d", "Đ" -> "D" (vì NFD không tách được)
- Dùng `text.normalize('NFD')` + regex loại bỏ combining marks
- Tăng giới hạn từ 80 lên 150 ký tự
- Cắt tại ranh giới từ (dấu `-` cuối cùng trước vị trí 150)
- Thêm fallback cho title rỗng: `untitled-` + 4 ký tự random
- Thêm hàm `generateUniqueSlug(userId, title)` với logic chống trùng

### Bước 2: Database Migration

Một migration SQL duy nhất thực hiện:

**2a. Tạo bảng `video_slug_history`**
- Cột: `id`, `video_id` (FK -> videos), `old_slug`, `user_id`, `created_at`
- Index: `(user_id, old_slug)` cho lookup nhanh
- RLS: Public SELECT (cần cho redirect), owner INSERT

**2b. Sửa hàm `generate_video_slug()`**
- Thay `translate()` bằng `unaccent()` extension (nếu có) hoặc dùng chuỗi translate đã kiểm chứng kỹ
- Tăng giới hạn từ 80 lên 150
- Thêm logic: khi UPDATE slug, tự động INSERT slug cũ vào `video_slug_history`

**2c. Tái tạo slug cho tất cả video hiện có**
- Lưu slug cũ vào `video_slug_history` trước khi cập nhật
- Tạo lại slug bằng thuật toán mới đã sửa
- Giữ logic chống trùng `-2`, `-3`

### Bước 3: Tạo `src/lib/slugGovernance.ts`

File mới chứa:
- `updateVideoSlug(videoId, newTitle, userId)` - governance logic khi đổi title
- Kiểm tra slug cũ vs mới, lưu vào history, rate limit (tối đa 5 lần/ngày)

### Bước 4: Cập nhật routing - Redirect slug cũ

Cập nhật `src/lib/videoNavigation.ts`:
- Khi lookup `/:username/video/:slug` không tìm thấy -> query `video_slug_history`
- Nếu tìm thấy slug cũ -> trả về path mới để component thực hiện redirect

### Bước 5: Cập nhật `DynamicMeta.tsx`

- Thêm prop `canonicalUrl`
- Tự động tạo/cập nhật `<link rel="canonical">` trong `<head>`

### Bước 6: Cập nhật `public/robots.txt`

Thêm Disallow cho các route nội bộ: `/api/`, `/auth`, `/settings`, `/admin`, `/studio`, `/upload`, v.v.

### Bước 7: Bổ sung reserved usernames

Thêm vào `RESERVED_WORDS` trong `nameFilter.ts`: `api`, `sitemap`, `robots`, `favicon`, `static`, `feed`, `explore`, `trending`, `live`, `help`, `support`, `about`, `terms`, `privacy`, `contact`, `login`, `signup`

---

## Chi tiết kỹ thuật

### Thuật toán slugify mới (client-side)

```text
function slugify(text):
  1. text = text.replace(/đ/g, 'd').replace(/Đ/g, 'D')
  2. text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  3. text = text.toLowerCase()
  4. text = text.replace(/[^a-z0-9]+/g, '-')
  5. text = text.replace(/^-+|-+$/g, '')
  6. if text.length > 150:
     - tìm vị trí dấu '-' cuối cùng trước 150
     - cắt tại đó
  7. if text rỗng: return 'untitled-' + random4chars
  8. return text
```

### Schema bảng `video_slug_history`

```text
video_slug_history
  - id: UUID (PK)
  - video_id: UUID (FK -> videos, ON DELETE CASCADE)
  - user_id: UUID (NOT NULL)
  - old_slug: TEXT (NOT NULL)
  - created_at: TIMESTAMPTZ (DEFAULT now())

Indexes:
  - UNIQUE (user_id, old_slug)

RLS:
  - SELECT: public (true) - cần cho redirect
  - INSERT: auth.uid() = user_id
```

### Flow redirect slug cũ

```text
User truy cập: /:username/video/:slug
  |
  v
Query videos WHERE user_id = X AND slug = Y
  |
  +-- Tìm thấy --> Hiển thị video
  |
  +-- Không tìm thấy --> Query video_slug_history WHERE user_id = X AND old_slug = Y
        |
        +-- Tìm thấy --> Lấy video mới --> Navigate (replace) đến slug mới
        |
        +-- Không tìm thấy --> 404
```

---

## Các file thay đổi

| File | Hành động |
|------|-----------|
| `src/lib/slugify.ts` | Viết lại hoàn toàn |
| `src/lib/slugGovernance.ts` | Tạo mới |
| `src/lib/videoNavigation.ts` | Thêm slug history lookup |
| `src/lib/nameFilter.ts` | Thêm reserved words |
| `src/components/SEO/DynamicMeta.tsx` | Thêm canonical tag |
| `public/robots.txt` | Cập nhật Disallow rules |
| Migration SQL | Tạo bảng + sửa trigger + tái tạo slug |

---

## Lưu ý quan trọng

- Sau khi tái tạo slug, tất cả slug cũ (sai) sẽ được lưu vào `video_slug_history`, nên **link cũ vẫn hoạt động** nhờ redirect 301
- Quá trình tái tạo có thể mất vài giây nếu có nhiều video
- Client-side `slugify.ts` và DB trigger sẽ dùng cùng thuật toán để đảm bảo nhất quán

