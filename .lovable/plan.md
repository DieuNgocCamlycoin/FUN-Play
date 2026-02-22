

## Fix: Avatar mạng xã hội hiện chữ cái thay vì hình mặc định

### Nguyên nhân gốc

Ở dòng 277 trong `SocialMediaOrbit.tsx`:
```
const displayUrl = avatarUrl || defaultAvatarMap[platform.key] || null;
```

Khi `social_avatars.facebook` chứa một URL cũ bị hỏng (từ trước khi có hệ thống default avatar), `avatarUrl` có giá trị -> bỏ qua `defaultAvatarMap` -> `OrbitImage` load ảnh thất bại -> hiện chữ cái đầu ("f" cho Facebook).

### Giải pháp

Sửa component `OrbitImage` để khi ảnh load lỗi, thay vì hiện chữ cái đầu, sẽ fallback về **hình mặc định của nền tảng** hoặc **icon nền tảng**.

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Profile/SocialMediaOrbit.tsx` | Sửa `OrbitImage` nhận thêm props `fallbackSrc` và `FallbackIcon`. Khi ảnh chính lỗi, thử load `fallbackSrc` (hình mặc định). Nếu cả hình mặc định cũng lỗi, hiện `FallbackIcon`. Cập nhật nơi gọi `OrbitImage` để truyền thêm 2 props này. |

### Chi tiết kỹ thuật

1. **Sửa `OrbitImage` (dòng 434-457)**: Thêm props `fallbackSrc` (URL hình mặc định) và `FallbackIcon` (React component icon nền tảng). Logic 3 bước:
   - Bước 1: Hiện ảnh chính (`src`)
   - Bước 2: Nếu lỗi, thử hiện `fallbackSrc` (hình mặc định từ `defaultAvatarMap`)
   - Bước 3: Nếu `fallbackSrc` cũng lỗi hoặc không có, hiện `FallbackIcon` với `color`

2. **Sửa nơi gọi `OrbitImage` (dòng 297-298)**: Truyền thêm:
   - `fallbackSrc={defaultAvatarMap[platform.key]}` - hình mặc định
   - `FallbackIcon={Icon}` - icon nền tảng

3. Kết quả: Dù `social_avatars.facebook` chứa URL lỗi, user sẽ thấy logo Facebook mặc định thay vì chữ "f".

