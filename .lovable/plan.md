

# Kế hoạch cập nhật: Quản trị URL và SEO (Bài 0 – Bài 9)

## Tình trạng hiện tại

### Đã hoàn thành
- **Bộ máy slugify** (`src/lib/slugify.ts`): Hỗ trợ tiếng Việt, chuẩn NFD, giới hạn 150 ký tự, cắt tại ranh giới từ
- **Quản trị slug phía client** (`src/lib/slugGovernance.ts`): Giới hạn 5 lần đổi/ngày, tạo slug duy nhất, tra cứu lịch sử
- **Bảng `video_slug_history`**: Đã tồn tại trong cơ sở dữ liệu
- **DB Trigger `trg_generate_video_slug`**: Đã được gắn vào bảng `videos` — hoạt động bình thường
- **Điều hướng video** (`src/lib/videoNavigation.ts`, `src/pages/VideoBySlug.tsx`): Định tuyến `/:username/video/:slug`
- **Danh sách username hạn chế** (`src/lib/nameFilter.ts`): 50+ từ khoá hệ thống và SEO
- **robots.txt**: Chặn các tuyến nội bộ (settings, admin, studio, v.v.)
- **DynamicMeta** (`src/components/SEO/DynamicMeta.tsx`): Hỗ trợ OG tags, Twitter Card, canonical URL
- **Hàm `resolveSlugRedirect`** (`src/lib/videoNavigation.ts`): Đã viết sẵn logic tra cứu slug cũ

### Chưa hoàn thành — cần triển khai

| STT | Hạng mục | Mức ưu tiên |
|-----|----------|-------------|
| 1 | Chuyển hướng 301 cho slug cũ trong `VideoBySlug.tsx` | Cao |
| 2 | Dữ liệu cấu trúc JSON-LD (VideoObject) | Trung bình |
| 3 | Sitemap động (Edge Function) | Trung bình |
| 4 | Cập nhật robots.txt (URL sitemap chính xác) | Thấp |

---

## Chi tiết triển khai

### 1. Chuyển hướng 301 cho slug cũ — `VideoBySlug.tsx`

**Vấn đề hiện tại**: Khi người dùng truy cập một slug cũ (đã đổi tên), trang hiện trả về 404. Hàm `resolveSlugRedirect()` đã được viết sẵn nhưng chưa được gọi trong `VideoBySlug.tsx`.

**Giải pháp**: Khi không tìm thấy video theo slug hiện tại, gọi `resolveSlugRedirect(username, slug)` để tra cứu `video_slug_history`. Nếu tìm thấy slug mới, dùng `navigate()` với `replace: true` để chuyển hướng — trình duyệt sẽ cập nhật thanh địa chỉ mà không lưu bản ghi lịch sử duyệt web thừa.

**Tệp thay đổi**: `src/pages/VideoBySlug.tsx`
- Thêm import `resolveSlugRedirect` từ `videoNavigation.ts`
- Thêm import `useNavigate` từ `react-router-dom`
- Trong khối `if (!video)`: thay vì đặt `notFound = true` ngay, gọi `resolveSlugRedirect` trước
- Nếu tìm được slug mới → điều hướng đến `/:username/video/:slugMới` với `replace: true`
- Nếu không tìm được → mới đặt `notFound = true`

---

### 2. Dữ liệu cấu trúc JSON-LD (VideoObject)

**Vấn đề hiện tại**: Chưa có dữ liệu cấu trúc JSON-LD. Google không thể hiển thị Rich Snippets (hình thu nhỏ video, thời lượng, lượt xem) trong kết quả tìm kiếm.

**Giải pháp**: Tạo component `VideoJsonLd` chèn thẻ `<script type="application/ld+json">` theo chuẩn Schema.org `VideoObject`.

**Tệp mới**: `src/components/SEO/VideoJsonLd.tsx`

Các trường dữ liệu bao gồm:
- `name`: Tiêu đề video
- `description`: Mô tả video
- `thumbnailUrl`: Ảnh thu nhỏ
- `uploadDate`: Ngày đăng tải (định dạng ISO 8601)
- `duration`: Thời lượng (định dạng ISO 8601, ví dụ `PT3M25S`)
- `contentUrl`: URL phát video
- `author`: Tên kênh / tên người dùng
- `interactionStatistic`: Lượt xem, lượt thích

**Tệp thay đổi**: `src/pages/Watch.tsx` — thêm `<VideoJsonLd />` vào phần render.

---

### 3. Sitemap động (Edge Function)

**Vấn đề hiện tại**: `robots.txt` trỏ đến `https://play.fun.rich/sitemap.xml` nhưng tệp này không tồn tại. Công cụ tìm kiếm không thể lập chỉ mục hiệu quả.

**Giải pháp**: Tạo Edge Function `generate-sitemap` trả về XML sitemap động.

**Tệp mới**: `supabase/functions/generate-sitemap/index.ts`

Nội dung sitemap bao gồm:
- Trang chủ và các trang tĩnh (khám phá, bảng xếp hạng, v.v.)
- Trang kênh: Lấy từ bảng `profiles` (những người có video công khai)
- Trang video: Lấy từ bảng `videos` (trạng thái công khai, có slug)
- Trang nhạc: Lấy từ bảng `ai_music` (trạng thái công khai)

Thiết lập header `Cache-Control: public, max-age=3600` để giảm tải cơ sở dữ liệu.

---

### 4. Cập nhật robots.txt

**Vấn đề hiện tại**: Dòng `Sitemap: https://play.fun.rich/sitemap.xml` trỏ sai domain.

**Giải pháp**: Cập nhật URL sitemap trỏ đến Edge Function thực tế, ví dụ:
```text
Sitemap: https://fzgjmvxtgrlwrluxdwjq.supabase.co/functions/v1/generate-sitemap
```
Hoặc nếu có domain tuỳ chỉnh thì trỏ đến domain đó.

**Tệp thay đổi**: `public/robots.txt`

---

## Thứ tự thực hiện đề xuất

1. **Chuyển hướng 301** trong `VideoBySlug.tsx` — sửa lỗi 404 cho slug cũ (quan trọng nhất)
2. **JSON-LD VideoObject** — tăng khả năng hiển thị Rich Snippets
3. **Sitemap động** — tăng khả năng lập chỉ mục
4. **Cập nhật robots.txt** — đồng bộ URL sitemap

> **Ghi chú**: DB Trigger `trg_generate_video_slug` đã được xác nhận hoạt động bình thường — không cần tạo migration bổ sung.

