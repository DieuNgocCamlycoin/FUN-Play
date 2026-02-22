

## Sửa lỗi lấy avatar mạng xã hội cho Fun Profile, Facebook, Angel AI và YouTube

### Nguyên nhân

Edge function `fetch-social-avatar` đang dùng 2 phương pháp lấy avatar:
1. **unavatar.io proxy** -- chỉ hỗ trợ 6 nền tảng (facebook, twitter, youtube, telegram, tiktok, linkedin). Nhưng thực tế Facebook chặn scraping nên unavatar.io thường trả về lỗi.
2. **og:image scraping** (fallback) -- fetch HTML từ URL rồi tìm thẻ `og:image`. Nhưng Facebook yêu cầu đăng nhập, Fun Profile và Angel AI có thể không có thẻ og:image.

Kết quả: 4 nền tảng (Fun Profile, Facebook, Angel AI, YouTube) đều trả về null -> chỉ hiện icon thay vì avatar thật.

### Giải pháp

Cải thiện edge function `fetch-social-avatar` bằng cách thêm **chiến lược lấy avatar riêng cho từng nền tảng**:

| Nen tang     | Chien luoc moi                                         |
|-------------|--------------------------------------------------------|
| Facebook    | Dung Graph API: `https://graph.facebook.com/{id}/picture?type=large` (lay ID tu URL), hoac fallback dung `unavatar.io/facebook/{username}` |
| YouTube     | Parse dung YouTube handle/channel, dung `unavatar.io/youtube/{handle}` (bo ky tu @) |
| Fun Profile | Fetch trang `fun.rich/{username}`, tim avatar trong HTML (og:image hoac img tag co class avatar) |
| Angel AI    | Tuong tu Fun Profile: fetch va tim og:image, hoac fallback ve icon |

### Chi tiet ky thuat

**File: `supabase/functions/fetch-social-avatar/index.ts`**

1. **Cai thien `extractUsername`** cho YouTube: xu ly cac dinh dang URL khac nhau (`/@handle`, `/channel/ID`, `/c/name`) -- loai bo ky tu `@` dau tien

2. **Them Facebook Graph API fallback**: Khi unavatar.io that bai, thu dung `https://graph.facebook.com/{username}/picture?type=large&redirect=false` (API cong khai, khong can token cho anh dai dien cong khai)

3. **Them chien luoc cho Fun Profile va Angel AI**: Ngoai og:image, con tim cac pattern HTML pho bien:
   - `<img` tag co class chua "avatar", "profile"
   - `<link rel="icon"` type image (chi dung khi kich thuoc lon)

4. **Them timeout rieng cho tung platform** va log chi tiet hon de debug

5. **Them retry logic**: Neu lan dau that bai, thu lai 1 lan voi User-Agent khac

### Luong xu ly moi

```
Platform URL -> extractUsername (cai thien)
  |
  v
[Facebook?] -> Graph API picture -> unavatar.io -> og:image
[YouTube?]  -> unavatar.io (bo @) -> og:image  
[Fun Profile / Angel AI?] -> og:image -> HTML avatar scan
[Khac?]     -> unavatar.io -> og:image (giu nguyen)
```

Chi thay doi 1 file: `supabase/functions/fetch-social-avatar/index.ts`

