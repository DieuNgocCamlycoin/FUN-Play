

## Sửa lỗi avatar orbit không hiển thị trên trang cá nhân người khác

### Nguyên nhân gốc

Trường `social_avatars` trong bảng `profiles` chưa có dữ liệu cho các user đã có link mạng xã hội từ trước. Edge function `fetch-social-avatar` chỉ được gọi khi thêm link mới qua nút "+", nên user cũ không có avatar được fetch.

### Giải pháp

**1. Tạo edge function mới: `supabase/functions/batch-fetch-social-avatars/index.ts`**

Edge function chạy 1 lần (hoặc theo lịch) để quét tất cả profiles có social URLs nhưng chưa có `social_avatars`, rồi gọi `fetch-social-avatar` cho từng user.

**2. Cập nhật `src/components/Profile/SocialMediaOrbit.tsx`**

Thêm logic auto-trigger: khi component render và phát hiện user có social URLs nhưng `socialAvatars` trống/thiếu, tự động gọi `fetch-social-avatar` edge function (chỉ 1 lần, throttled) để fetch avatar. Điều này đảm bảo khi bất kỳ ai xem một profile, avatar sẽ được fetch nếu chưa có.

Logic cụ thể:
- So sánh `activePlatforms` với keys có trong `socialAvatars`
- Nếu có platform active mà chưa có avatar -> gọi edge function
- Dùng `useEffect` với dependency là `userId` để chỉ chạy 1 lần per profile view
- Sau khi fetch xong, gọi `onProfileUpdate` để refresh

**3. Về nút "+"**

Nút "+" chỉ hiển thị trên trang cá nhân của chính mình (isOwnProfile = true). Đây là hành vi đúng vì bạn không thể chỉnh sửa profile người khác. Không cần thay đổi logic này.

### Tóm tắt file cần sửa/tạo

| File | Thay đổi |
|---|---|
| `supabase/functions/batch-fetch-social-avatars/index.ts` | Tạo mới - batch fetch avatars cho tất cả users |
| `src/components/Profile/SocialMediaOrbit.tsx` | Thêm auto-trigger fetch avatar khi thiếu |

### Luồng hoạt động sau cập nhật

```text
User A xem profile User B
--> SocialMediaOrbit render
--> Phát hiện User B có facebook_url nhưng social_avatars.facebook = null
--> Tự động gọi fetch-social-avatar cho User B
--> Avatar được lưu vào DB
--> Component refresh, hiển thị avatar đúng
--> Lần sau xem lại, avatar đã có sẵn
```
