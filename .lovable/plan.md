

# Sửa lỗi và tối ưu hệ thống Social Media, Diamond Badge, Username

## Vấn đề phát hiện

### 1. UserProfile thiếu dữ liệu mạng xã hội (BUG)
File `src/pages/UserProfile.tsx` định nghĩa `UserProfileData` interface thiếu các trường `facebook_url`, `youtube_url`, `twitter_url`, `tiktok_url`, `telegram_url`. Mặc dù truy vấn `.select("*")` trả về đầy đủ dữ liệu, TypeScript interface lọc bỏ chúng khi truyền vào `ProfileHeader`. Kết quả: **icon mạng xã hội không hiển thị trên trang cá nhân người khác**.

**Sửa**: Thêm 5 trường social vào `UserProfileData` interface.

### 2. ProfileSettings dùng type casting `as any` (CODE SMELL)
Dòng 137-141 trong `ProfileSettings.tsx` dùng `(data as any).facebook_url`. Nguyên nhân là `types.ts` chưa được regenerate sau migration. Cách xử lý: sau khi types tự động cập nhật, xoá `as any` và dùng trực tiếp `data.facebook_url`.

**Sửa**: Bỏ `as any` nếu types đã cập nhật, hoặc giữ tạm nếu chưa.

### 3. Icon X/Twitter và TikTok không hiển thị trong dark mode (UI BUG)
Cả hai dùng `color: "#000000"` (nền đen, icon đen = vô hình). 

**Sửa**: Đổi X/Twitter sang `#1DA1F2` (hoặc `#FFFFFF` trên nền đen), TikTok sang `#69C9D0` (màu brand chính thức).

### 4. SEO-friendly URLs chưa được triển khai
Phần slug cho video (`/c/:username/video/:slug`) từ kế hoạch trước chưa có code. Đây là tính năng lớn, cần thêm:
- Cột `slug` trong bảng `videos`
- Utility `slugUtils.ts` để tạo slug từ tiếng Việt
- Route mới và component `VideoBySlug`

**Khuyến nghị**: Tách thành một bước triển khai riêng để đảm bảo ổn định.

---

## Thay đổi cụ thể

### File 1: `src/pages/UserProfile.tsx`
- Thêm vào `UserProfileData` interface:
  - `facebook_url: string | null`
  - `youtube_url: string | null`
  - `twitter_url: string | null`
  - `tiktok_url: string | null`
  - `telegram_url: string | null`

### File 2: `src/components/Profile/SocialMediaOrbit.tsx`
- Đổi màu X/Twitter: `"#000000"` -> `"#1DA1F2"`
- Đổi màu TikTok: `"#000000"` -> `"#69C9D0"`
- Cả hai đảm bảo hiển thị rõ trên cả light mode và dark mode

### File 3: `src/pages/ProfileSettings.tsx`
- Bỏ `as any` casting trên dòng 137-141 (nếu types đã cập nhật)
- Nếu types chưa cập nhật, giữ nguyên và đánh dấu TODO

### Không cần thay đổi
- `ProfileHeader.tsx` - cấu trúc đúng, nhận props đầy đủ
- `CredibilityDiamond.tsx` - logic tier và animation hoạt động tốt
- `ProfileInfo.tsx` - không cần truyền social data (ProfileHeader nhận trực tiếp)
- Database - các cột đã tồn tại

---

## Phần chưa triển khai (SEO URLs)

Tính năng slug-based URLs cho video sẽ được triển khai trong bước tiếp theo:
1. Migration thêm cột `slug` vào `videos`
2. Tạo `src/lib/slugUtils.ts`
3. Tạo `src/pages/VideoBySlug.tsx`
4. Thêm route `/c/:username/video/:slug` vào `App.tsx`

Tính năng này không ảnh hưởng đến các sửa lỗi hiện tại và có thể triển khai độc lập.

