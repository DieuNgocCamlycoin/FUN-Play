

# Hiển thị nút Quay lại trên cả Web và Mobile

## Vấn đề

Hiện tại nút quay lại (←) chỉ hiển thị trên mobile do điều kiện `{isMobile && ...}`. Trên web (màn hình lớn), nút bị ẩn.

## Giải pháp

Xoá điều kiện `isMobile` để nút quay lại luôn hiển thị trên cả web và mobile.

### 1. Trang Thông báo (`src/pages/Notifications.tsx`)

- Xoá điều kiện `{isMobile && ...}` bọc quanh nút ArrowLeft (dòng 140)
- Nút sẽ luôn hiển thị bất kể kích thước màn hình

### 2. Trang Cá nhân (`src/pages/UserProfile.tsx`)

- Xoá điều kiện `{isMobile && ...}` bọc quanh nút ArrowLeft (dòng 257)
- Nút sẽ luôn hiển thị trên cả web và mobile

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/pages/Notifications.tsx` | Bỏ điều kiện `isMobile`, nút quay lại luôn hiển thị |
| 2 | `src/pages/UserProfile.tsx` | Bỏ điều kiện `isMobile`, nút quay lại luôn hiển thị |

