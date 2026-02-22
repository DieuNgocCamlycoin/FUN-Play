

## Triển khai tính năng upload avatar thủ công cho mạng xã hội

### Tổng quan
Thêm nút upload avatar (icon Camera) bên cạnh mỗi link mạng xã hội đã thêm trong trang Settings. Người dùng có thể paste URL ảnh hoặc upload file ảnh. Avatar thủ công sẽ được ưu tiên và không bị edge function ghi đè.

### Thay đổi chi tiết

**File 1: `src/pages/ProfileSettings.tsx`**

1. Thêm state mới:
   - `socialAvatars`: `Record<string, string | null>` - load từ database khi fetch profile
   - `avatarUploadPlatform`: `string | null` - platform đang mở dialog upload avatar
   - `tempAvatarUrl`: `string` - URL ảnh tạm khi paste
   - `isUploadingSocialAvatar`: `boolean` - trạng thái đang upload

2. Khi fetch profile (trong `useEffect`), đọc thêm field `social_avatars` từ database và set vào state `socialAvatars`

3. Trong phần hiển thị social link cards (dòng 730-756), thêm:
   - Thumbnail avatar nhỏ (nếu có) bên trái icon platform
   - Nút Camera icon bên cạnh nút X (xóa link)
   - Khi nhấn Camera: mở Dialog cho phép:
     - Paste URL ảnh đại diện
     - Hoặc upload file ảnh (dùng `useR2Upload` với folder `social-avatars`)
   - Preview ảnh trong dialog trước khi confirm

4. Khi save profile (`handleSave`):
   - Lưu `socialAvatars` vào `profiles.social_avatars` cùng lúc với update profile
   - Truyền thêm `manualAvatars` (danh sách platform đã set thủ công) cho edge function
   - Edge function sẽ bỏ qua các platform đã có avatar thủ công

5. Import thêm: `Camera` hoặc `ImagePlus` từ lucide-react, `Dialog` components

**File 2: `supabase/functions/fetch-social-avatar/index.ts`**

Sửa phần handler chính (dòng 290-345):
- Nhận thêm field `manualAvatars` (mảng các platform key đã set thủ công) từ request body
- Đọc `social_avatars` hiện tại từ database trước khi xử lý
- Chỉ fetch avatar tự động cho các platform KHÔNG nằm trong `manualAvatars`
- Khi lưu kết quả, merge với avatar hiện tại thay vì ghi đè hoàn toàn

**File 3: `src/components/Profile/SocialMediaOrbit.tsx`**

Không cần thay đổi - đã có logic fallback hiển thị avatar hoặc icon platform.

### Luồng hoạt động

```text
User thêm link Facebook --> Nhấn icon Camera --> Dialog mở
--> Paste URL ảnh hoặc Upload file --> Preview --> Confirm
--> Avatar hiển thị trong card --> Save profile
--> social_avatars.facebook = URL ảnh thủ công
--> Edge function chạy background, bỏ qua Facebook (đã có avatar thủ công)
--> Orbit hiển thị avatar Facebook từ social_avatars
```

### Tóm tắt file cần sửa

| File | Thay đổi |
|---|---|
| `src/pages/ProfileSettings.tsx` | Thêm dialog upload avatar, state, logic lưu |
| `supabase/functions/fetch-social-avatar/index.ts` | Không ghi đè avatar thủ công |

