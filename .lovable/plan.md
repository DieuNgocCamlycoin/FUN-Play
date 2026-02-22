

## Sửa lỗi avatar mạng xã hội + Thêm ảnh mặc định

### Vấn đề phát hiện

**1. Facebook avatar không lấy được:**
- Facebook Graph API (`graph.facebook.com/{username}/picture`) yêu cầu access token từ năm 2024, không còn hoạt động public
- `unavatar.io/facebook` cũng thường thất bại do Facebook chặn scraping
- Giải pháp: Thêm chiến lược thứ 3 - scrape trực tiếp trang Facebook profile để lấy og:image

**2. Key không khớp giữa frontend và edge function:**
- ProfileSettings gửi key `funplay` nhưng edge function dùng `case "funprofile"` --> không bao giờ match, rơi vào `default`
- Cần đồng bộ key thành `funprofile` hoặc `funplay` (sửa edge function cho khớp với frontend)

**3. Thiếu ảnh mặc định cho FUN Profile và Angel AI:**
- Khi scraping thất bại, hiện tại trả về `null` --> hiện icon SVG thay vì ảnh
- Cần dùng ảnh mặc định được cung cấp (hình 2 cho FUN Profile, hình 3 cho Angel AI)

---

### Việc 1: Copy ảnh mặc định vào project

- Copy `user-uploads://FUN_Profile.png` vào `public/images/FUN_Profile.png`
- Copy `user-uploads://Angel_AI.png` vào `public/images/Angel_AI.png`

### Việc 2: Sửa edge function `fetch-social-avatar/index.ts`

**a. Sửa key mapping (dòng 267):**
- Thêm `case "funplay":` cùng với `case "funprofile":` để cả 2 key đều gọi `fetchFunProfileAvatar`

**b. Cải thiện Facebook avatar (dòng 139-171):**
- Thêm Strategy 3: Scrape trực tiếp trang Facebook profile để lấy og:image (vì Graph API và unavatar.io đều thất bại)
- Thử cả 2 User-Agent để tăng khả năng thành công

### Việc 3: Sửa `SocialMediaOrbit.tsx` - Dùng ảnh mặc định

**Dòng 128-132:** Khi `avatarUrl` là `null` (fetch thất bại), thay vì hiện icon SVG, kiểm tra nếu platform là `funplay` hoặc `angelai` thì dùng ảnh mặc định:

| Platform | Avatar mặc định |
|---|---|
| `funplay` (Fun Profile) | `/images/FUN_Profile.png` |
| `angelai` (Angel AI) | `/images/Angel_AI.png` |
| Các platform khác | Giữ icon SVG như cũ |

### Tóm tắt file cần sửa

| File | Thay đổi |
|---|---|
| `public/images/FUN_Profile.png` | Copy ảnh mới |
| `public/images/Angel_AI.png` | Copy ảnh mới |
| `supabase/functions/fetch-social-avatar/index.ts` | Sửa key mapping + cải thiện Facebook scraping |
| `src/components/Profile/SocialMediaOrbit.tsx` | Thêm ảnh mặc định cho FUN Profile và Angel AI |

