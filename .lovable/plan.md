

## 3 thay đổi cần thực hiện

### 1. Tăng kích thước viên kim cương gấp đôi

**File: `src/components/Profile/DiamondBadge.tsx`**

- Kích thước hiện tại: `w-[42px] h-[42px] md:w-12 md:h-12` (42px / 48px)
- Kích thước mới: `w-[84px] h-[84px] md:w-24 md:h-24` (84px / 96px)
- Điều chỉnh vị trí top cho phù hợp: `-top-14 md:-top-16` (thay vì `-top-8 md:-top-10`)

### 2. Hình mặc định cho Facebook

Upload hình Facebook icon vào `public/images/facebook-default.png` và thêm vào `defaultAvatarMap` trong `SocialMediaOrbit.tsx`:
```
facebook: '/images/facebook-default.png'
```

### 3. Hình mặc định cho X / Twitter

Upload hình X icon vào `public/images/twitter-default.png` và thêm vào `defaultAvatarMap`:
```
twitter: '/images/twitter-default.png'
```

### Chi tiết kỹ thuật

**Files cần sửa:**
- `src/components/Profile/DiamondBadge.tsx` -- thay đổi kích thước và vị trí
- `src/components/Profile/SocialMediaOrbit.tsx` -- thêm 2 entry vào `defaultAvatarMap` (dòng 244-247)

**Files cần tạo (copy từ upload):**
- `public/images/facebook-default.png`
- `public/images/twitter-default.png`
