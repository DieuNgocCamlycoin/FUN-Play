

## Cập nhật link chia sẻ video: `play.fun.rich/username/ten_bai_thien`

### Mục tiêu
- Khi user bấm chia sẻ, link copy sẽ là: `https://play.fun.rich/angelkhanhi/co-che-su-song-trong-co-the-nguoi`
- Link cũ dạng `/username/video/slug` vẫn hoạt động (không bị hỏng)

### Thay đổi theo file

#### 1. `src/lib/shareUtils.ts`
- Đổi `PRODUCTION_URL` sang `https://play.fun.rich`
- Hàm `getVideoShareUrl`: trả về `/${username}/${slug}` (bỏ `/video/`)

#### 2. `src/lib/slugify.ts`
- Hàm `getVideoShareUrl`: trả về `/${username}/${slug}` (bỏ `/video/`)

#### 3. `src/components/Video/ShareModal.tsx`
- Cập nhật format URL share và prerender URL, bỏ `/video/`

#### 4. `src/App.tsx`
- Thêm route `/:username/:slug` trỏ đến `VideoBySlug`
- Giữ route cũ `/:username/video/:slug` để link cũ vẫn hoạt động

### Kết quả
- Nút chia sẻ -> hiển thị `https://play.fun.rich/username/slug`
- Truy cập `play.fun.rich/username/slug` -> xem video
- Truy cập `play.fun.rich/username/video/slug` -> vẫn xem video (backward compatible)

| File | Thay đổi |
|------|---------|
| `src/lib/shareUtils.ts` | Đổi PRODUCTION_URL, bỏ `/video/` |
| `src/lib/slugify.ts` | Bỏ `/video/` trong getVideoShareUrl |
| `src/components/Video/ShareModal.tsx` | Cập nhật URL format |
| `src/App.tsx` | Thêm route `/:username/:slug` |

