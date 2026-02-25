

# Kế hoạch tổng rà soát: Quản trị URL và SEO (Bài 0 – Bài 9)

## Tổng kết hiện trạng

### Đã hoàn thành 100%

| Hạng mục | Tệp/Vị trí | Trạng thái |
|----------|-------------|------------|
| Bộ máy slugify (tiếng Việt, NFD, 150 ký tự) | `src/lib/slugify.ts` | Hoàn thành |
| Quản trị slug phía client (giới hạn 5 lần/ngày, chống trùng) | `src/lib/slugGovernance.ts` | Hoàn thành |
| Bảng `video_slug_history` | Cơ sở dữ liệu | Hoàn thành |
| DB Trigger `trg_generate_video_slug` gắn vào bảng `videos` | Cơ sở dữ liệu | Hoàn thành |
| DB Trigger `trg_validate_video_title` gắn vào bảng `videos` | Cơ sở dữ liệu | Hoàn thành |
| Điều hướng video qua slug (`/:username/video/:slug`) | `src/pages/VideoBySlug.tsx`, `src/lib/videoNavigation.ts` | Hoàn thành |
| Chuyển hướng 301 slug cũ (tra cứu `video_slug_history`) | `src/pages/VideoBySlug.tsx` dòng 46-51 | Hoàn thành |
| Chuyển hướng legacy `/watch/:id` → URL sạch | `src/pages/WatchLegacyRedirect.tsx` | Hoàn thành |
| Lưu giữ `previous_username` khi đổi username | DB trigger `save_previous_username` | Hoàn thành |
| Chuyển hướng username cũ → username mới | `src/pages/Channel.tsx` (tra cứu `previous_username`) | Hoàn thành |
| Danh sách username hạn chế (50+ từ khoá) | `src/lib/nameFilter.ts` | Hoàn thành |
| Bộ lọc tên không phù hợp (tiếng Việt + Anh) | `src/lib/nameFilter.ts` | Hoàn thành |
| Xác thực chất lượng tên hiển thị | `src/lib/nameFilter.ts` (`validateDisplayName`) | Hoàn thành |
| DynamicMeta (OG tags, Twitter Card) | `src/components/SEO/DynamicMeta.tsx` | Hoàn thành |
| JSON-LD VideoObject | `src/components/SEO/VideoJsonLd.tsx` | Hoàn thành |
| Tích hợp VideoJsonLd vào Watch (desktop + mobile) | `src/pages/Watch.tsx` | Hoàn thành |
| DynamicMeta cho trang nhạc | `src/pages/MusicDetail.tsx`, `src/pages/BrowseMusic.tsx` | Hoàn thành |
| `robots.txt` chặn route nội bộ | `public/robots.txt` | Hoàn thành |
| Edge Function sitemap động (index, static, videos, profiles) | `supabase/functions/generate-sitemap/index.ts` | Hoàn thành |
| `robots.txt` trỏ đúng sitemap URL | `public/robots.txt` dòng 48 | Hoàn thành |
| Cache-Control headers cho sitemap | Edge Function (max-age=3600) | Hoàn thành |

---

## Các hạng mục cần cải thiện / bổ sung

Sau khi rà soát kỹ, tôi nhận thấy một số điểm có thể nâng cấp thêm:

### 1. Thêm `canonicalUrl` cho trang Watch (Mức ưu tiên: Trung bình)

**Vấn đề**: `DynamicMeta` hỗ trợ prop `canonicalUrl` nhưng trang `Watch.tsx` chưa truyền giá trị này. Thẻ `<link rel="canonical">` giúp Google xác định URL chính thức, tránh nội dung trùng lặp.

**Giải pháp**: Truyền `canonicalUrl` vào `DynamicMeta` trong `Watch.tsx` với giá trị `https://play.fun.rich/{username}/video/{slug}`.

**Tệp thay đổi**: `src/pages/Watch.tsx` — thêm prop `canonicalUrl` vào cả 2 vị trí render `DynamicMeta` (desktop + mobile).

---

### 2. Thêm `canonicalUrl` cho trang MusicDetail (Mức ưu tiên: Thấp)

**Vấn đề**: Tương tự, `MusicDetail.tsx` dùng `DynamicMeta` nhưng chưa truyền `canonicalUrl`.

**Giải pháp**: Truyền `canonicalUrl` cho trang nhạc chi tiết.

**Tệp thay đổi**: `src/pages/MusicDetail.tsx`

---

### 3. Thêm JSON-LD cho trang kênh/hồ sơ — schema Person (Mức ưu tiên: Trung bình)

**Vấn đề**: Hiện chỉ có JSON-LD `VideoObject` cho video. Trang kênh (Channel) chưa có dữ liệu cấu trúc. Google có thể hiển thị Knowledge Panel nếu có schema `Person`.

**Giải pháp**: Tạo component `ChannelJsonLd` với schema `Person` (tên, hình ảnh, mô tả, liên kết mạng xã hội). Tích hợp vào `Channel.tsx`.

**Tệp mới**: `src/components/SEO/ChannelJsonLd.tsx`
**Tệp thay đổi**: `src/pages/Channel.tsx`

---

### 4. Sitemap phân trang cho video vượt quá 1.000 bản ghi (Mức ưu tiên: Thấp)

**Vấn đề**: Edge Function `generate-sitemap` hiện giới hạn 1.000 video. Khi nền tảng phát triển, các video ngoài giới hạn sẽ không được lập chỉ mục.

**Giải pháp**: Hỗ trợ tham số `page` trong sitemap video (ví dụ: `?type=videos&page=1`, `?type=videos&page=2`). Sitemap index tự động liệt kê tất cả các trang.

**Tệp thay đổi**: `supabase/functions/generate-sitemap/index.ts`

---

### 5. Thêm `canonicalUrl` và `DynamicMeta` cho trang Channel (Mức ưu tiên: Trung bình)

**Vấn đề**: Cần xác nhận trang Channel đã có `DynamicMeta` với đầy đủ OG tags hay chưa. Nếu chưa, cần bổ sung để khi chia sẻ link kênh lên mạng xã hội sẽ hiển thị đẹp.

**Tệp thay đổi**: `src/pages/Channel.tsx`

---

## Thứ tự thực hiện đề xuất

| Bước | Hạng mục | Mức độ |
|------|----------|--------|
| 1 | Thêm `canonicalUrl` cho Watch.tsx | Nhanh (thêm 1 prop) |
| 2 | Thêm `DynamicMeta` + `canonicalUrl` cho Channel.tsx | Trung bình |
| 3 | Tạo `ChannelJsonLd` (schema Person) | Trung bình |
| 4 | Thêm `canonicalUrl` cho MusicDetail.tsx | Nhanh |
| 5 | Sitemap phân trang (khi số video vượt 1.000) | Nâng cao, có thể làm sau |

---

## Kết luận

Hệ thống URL và SEO theo tài liệu Bài 0 – Bài 9 đã hoàn thành khoảng **90%**. Các hạng mục còn lại chủ yếu là bổ sung thẻ `canonical`, JSON-LD cho trang kênh, và chuẩn bị sitemap phân trang cho tương lai. Tất cả đều là cải tiến tối ưu hoá, không ảnh hưởng đến chức năng hiện tại.

