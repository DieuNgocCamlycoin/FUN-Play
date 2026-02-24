
## Kết hợp: Ẩn "Tặng & Thưởng" và "Đăng ký" khi xem kênh/video của chính mình

### Mục tiêu
Khi người dùng xem video hoặc trang hồ sơ của chính mình, ẩn các nút không phù hợp:
- Ẩn nút **"Thưởng & Tặng"** (không tự tặng cho mình)
- Ẩn nút **"Đăng ký"** trong popup rê chuột vào tên kênh (không tự đăng ký kênh mình)

### Thay đổi theo file

#### 1. `src/pages/Watch.tsx` (Giao diện máy tính)
- **Dòng 809-827**: Bọc nút "Thưởng & Tặng" trong điều kiện `{user?.id !== video.user_id && (...)}` để ẩn khi xem video của mình
- **Dòng 722-730**: Truyền thêm prop `isOwnChannel={user?.id === video.user_id}` vào `MiniProfileCard`

#### 2. `src/components/Video/MiniProfileCard.tsx` (Popup rê chuột)
- Thêm prop `isOwnChannel?: boolean` vào interface
- **Dòng 118-128**: Nếu `isOwnChannel === true` thì ẩn nút "Đăng ký" ở cuối card

#### 3. `src/components/Profile/ProfileInfo.tsx` (Trang hồ sơ)
- **Dòng 172-185**: Bọc nút "Tặng & Thưởng" trong điều kiện `{!isOwnProfile && (...)}` để ẩn khi xem hồ sơ của chính mình

#### 4. `src/components/Video/Mobile/VideoActionsBar.tsx` (Giao diện di động)
- **Dòng 265-282**: Bọc nút "Tặng" trong điều kiện `{!isOwnVideo && (...)}` để ẩn khi xem video của mình trên điện thoại

### Kết quả mong đợi
- Xem video của mình: chỉ thấy "Chỉnh sửa video", "Chia sẻ", "Lưu" — không có "Tặng & Thưởng", không có "Đăng ký"
- Rê chuột vào tên kênh của mình: popup chỉ hiện tên và số người đăng ký, không có nút "Đăng ký"
- Xem hồ sơ của mình: không có nút "Tặng & Thưởng", không có nút "Đăng ký"
- Xem video/hồ sơ người khác: vẫn hiển thị đầy đủ như cũ

### Chi tiết kỹ thuật

| Tệp | Thay đổi |
|------|---------|
| `src/pages/Watch.tsx` | Ẩn nút "Thưởng & Tặng" + truyền `isOwnChannel` vào `MiniProfileCard` |
| `src/components/Video/MiniProfileCard.tsx` | Thêm prop `isOwnChannel`, ẩn nút đăng ký |
| `src/components/Profile/ProfileInfo.tsx` | Bọc nút "Tặng & Thưởng" trong `!isOwnProfile` |
| `src/components/Video/Mobile/VideoActionsBar.tsx` | Bọc nút "Tặng" trong `!isOwnVideo` |
