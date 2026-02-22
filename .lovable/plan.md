

## Cập nhật orbit: phân bố đều + sửa lỗi TikTok avatar

### 1. Phân bố đều các icon trên orbit

**Vấn đề:** Hiện tại biến `count` bao gồm cả nút "+" (`count = allOrbitItems.length + (showAddButton ? 1 : 0)`), nhưng nút "+" lại được đặt cố định bên ngoài orbit (vị trí 10h). Điều này tạo ra một khoảng trống trên orbit nơi nút "+" "lẽ ra" nằm, khiến các icon không được phân bố đều.

**Giải pháp:** Chỉ đếm các icon mạng xã hội thực sự trên orbit khi tính `step`:
- `count = allOrbitItems.length` (bỏ phần `+ (showAddButton ? 1 : 0)`)
- Giữ nguyên công thức `step = 360 / count` -- khi số icon thay đổi, khoảng cách tự động điều chỉnh

### 2. Khắc phục lỗi TikTok avatar

**Vấn đề:** Edge function `fetch-social-avatar` dùng TikTok oembed endpoint với URL profile (`tiktok.com/@username`), nhưng oembed yêu cầu URL video cụ thể. Trường `thumbnail_url` trong response oembed là thumbnail video, không phải avatar profile. Các chiến lược fallback (unavatar.io, og:image scrape) cũng thường bị TikTok chặn.

**Giải pháp:** Cập nhật `fetchTiktokAvatar` trong edge function:
- Thay oembed bằng TikTok user detail API: `https://www.tiktok.com/api/user/detail/?uniqueId=username`
- Response chứa `userInfo.user.avatarMedium` hoặc `avatarLarger` -- đây chính là ảnh đại diện profile
- Giữ unavatar.io và og:image scrape làm fallback
- Thêm retry với nhiều User-Agent khác nhau

### Chi tiết thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Profile/SocialMediaOrbit.tsx` | Sửa `count` chỉ đếm `allOrbitItems.length`, bỏ đếm nút "+" |
| `supabase/functions/fetch-social-avatar/index.ts` | Thay TikTok oembed bằng user detail API endpoint, giữ fallback cũ |

### Chi tiết kỹ thuật

**SocialMediaOrbit.tsx (dòng 188):**
```
// Trước:
const count = allOrbitItems.length + (showAddButton ? 1 : 0);
// Sau:
const count = allOrbitItems.length;
```

**fetch-social-avatar/index.ts - fetchTiktokAvatar:**
```typescript
// Strategy 1: TikTok user detail API
const apiUrl = `https://www.tiktok.com/api/user/detail/?uniqueId=${cleanUsername}`;
const res = await fetchWithTimeout(apiUrl, {
  headers: { "User-Agent": USER_AGENTS[0] }
}, 8000);
if (res.ok) {
  const data = await res.json();
  const avatar = data?.userInfo?.user?.avatarLarger 
    || data?.userInfo?.user?.avatarMedium;
  if (avatar && !isJunkImage(avatar)) return avatar;
}
// Fallback: unavatar.io + og:image scrape (giữ nguyên)
```

