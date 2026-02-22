
## Cập nhật hiển thị avatar mặc định cho tất cả user

### Vấn đề hiện tại

Hiện tại, logic hiển thị avatar trên orbit đã đúng về mặt code:
- Nếu `socialAvatars[platform]` có giá trị -> hiển thị avatar đó
- Nếu không -> hiển thị default từ `defaultAvatarMap`
- Nếu không có default -> hiển thị icon SVG

Tuy nhiên, có trường hợp `socialAvatars` trong database chứa URL lỗi/rỗng từ quá trình auto-fetch thất bại, khiến avatar mặc định không được hiển thị. Ngoài ra, auto-fetch bỏ qua `funplay` và `angelai` nhưng không tự gán default avatar cho chúng trong database.

### Giải pháp

Thay đổi logic `displayUrl` để ưu tiên hiển thị đúng:

1. Nếu `socialAvatars[platform]` có giá trị hợp lệ (không rỗng, không null) -> dùng avatar đó
2. Nếu platform có trong `defaultAvatarMap` -> luôn dùng default làm fallback (đã có qua `OrbitImage fallbackSrc`)
3. Nếu `socialAvatars` chứa URL rỗng hoặc không hợp lệ -> bỏ qua, dùng default

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Profile/SocialMediaOrbit.tsx` | Cập nhật logic `displayUrl` (dòng 270-278) để lọc bỏ avatar URL rỗng/không hợp lệ, đảm bảo default luôn hiển thị khi cần |

### Chi tiết kỹ thuật

Tại dòng 270-278, thay đổi:

```typescript
const avatarUrl = socialAvatars?.[platform.key];
```

Thành:

```typescript
const rawAvatar = socialAvatars?.[platform.key];
const avatarUrl = rawAvatar && rawAvatar.trim().length > 0 ? rawAvatar : null;
```

Điều này đảm bảo nếu `social_avatars` chứa chuỗi rỗng `""` hoặc chỉ khoảng trắng, hệ thống sẽ bỏ qua và hiển thị default avatar thay vì ảnh lỗi. Kết hợp với `OrbitImage` đã có fallback chain (primary -> fallbackSrc -> icon), avatar mặc định sẽ luôn hiển thị đúng cho tất cả user trên mọi nền tảng có default.
