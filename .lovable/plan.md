
## Xóa nút upload avatar cho TikTok, Telegram, X/Twitter, YouTube

### Thay đổi
Ẩn nút Camera (upload avatar) cho 4 nền tảng: TikTok, Telegram, X/Twitter, YouTube trong trang Cài đặt Hồ sơ. Chỉ giữ nút upload cho: Fun Profile, Angel AI, Facebook, LinkedIn, Zalo.

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/pages/ProfileSettings.tsx` | Thêm điều kiện ẩn nút Camera cho các platform có avatarKey là `tiktok`, `telegram`, `twitter`, `youtube` (dòng 768-779) |

### Chi tiết kỹ thuật

Tại dòng 768-779, bọc nút Camera trong điều kiện:

```typescript
const hideUploadPlatforms = ["tiktok", "telegram", "twitter", "youtube"];
```

Chỉ render nút Camera khi `avatarKey` không nằm trong danh sách trên.
