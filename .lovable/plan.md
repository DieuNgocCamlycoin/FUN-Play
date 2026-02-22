

## Cập nhật Avatar mặc định cho các mạng xã hội

### Thay đổi

Thay thế toàn bộ avatar mặc định cũ bằng 5 hình mới và cập nhật code để hiển thị đúng khi user thêm link cho nền tảng tương ứng.

### 1. Thay thế/Thêm file ảnh trong `public/images/`

| File | Hành động |
|---|---|
| `public/images/FUN_Profile.png` | Thay bằng hình 1 (FUN Profile Web3) |
| `public/images/Angel_AI.png` | Thay bằng hình 2 (Angel AI mới) |
| `public/images/facebook-default.png` | Thay bằng hình 3 (Facebook icon tròn xanh) |
| `public/images/zalo-default.png` | Tạo mới từ hình 4 (Zalo logo tròn) |
| `public/images/linkedin-default.png` | Tạo mới từ hình 5 (LinkedIn icon) |

### 2. Cập nhật `defaultAvatarMap` trong `SocialMediaOrbit.tsx`

Thêm Zalo và LinkedIn vào danh sách default avatar (dòng 271-276):

```typescript
const defaultAvatarMap: Record<string, string> = {
  funplay: '/images/FUN_Profile.png',
  angelai: '/images/Angel_AI.png',
  facebook: '/images/facebook-default.png',
  zalo: '/images/zalo-default.png',
  linkedin: '/images/linkedin-default.png',
  twitter: '/images/twitter-default.png',
};
```

Xoa bo Twitter khoi danh sach default (vi user khong yeu cau giu Twitter default).

### Ket qua

Khi user them link cho FUN Profile, Angel AI, Facebook, Zalo, hoac LinkedIn, avatar mac dinh tuong ung se hien thi ngay tren Social Orbit cho den khi user upload avatar rieng hoac he thong auto-fetch duoc avatar tu mang xa hoi do.

