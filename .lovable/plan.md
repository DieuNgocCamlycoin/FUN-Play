

## Cập nhật ảnh mặc định cho YouTube

### Thay đổi

**File: `public/images/youtube-default.png`**
- Copy ảnh YouTube icon (nền đỏ, nút play trắng) mà bạn vừa gửi vào `public/images/youtube-default.png`
- Ảnh này đã được tham chiếu sẵn trong `defaultAvatarMap` của `SocialMediaOrbit.tsx` (dòng 89), nên không cần sửa code
- Khi auto-fetch avatar YouTube thất bại, hệ thống sẽ tự động hiển thị ảnh này

### Tổng kết

| File | Thay đổi |
|------|---------|
| `public/images/youtube-default.png` | Thay thế bằng ảnh YouTube icon do bạn cung cấp |

Không cần sửa code -- chỉ cần đặt đúng file ảnh vào đúng đường dẫn.

