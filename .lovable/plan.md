

## Thay nút "Đăng ký" bằng "Chỉnh sửa video" khi xem video của chính mình

### Mục tiêu
Khi user đang xem video do chính mình upload, thay nút "Đăng ký" bằng nút "Chỉnh sửa video" (giống YouTube). Bấm vào sẽ chuyển đến trang chỉnh sửa video.

### Thay đổi

#### 1. Desktop - `src/pages/Watch.tsx`
- Thêm biến `isOwnVideo = user?.id === video.user_id`
- Tại khu vực nút "Đăng ký" (dòng 733-743): nếu `isOwnVideo` thì hiển thị nút "Chỉnh sửa video" với icon Edit, bấm vào navigate đến `/edit-video/{videoId}`
- Nếu không phải video của mình thì giữ nguyên nút "Đăng ký" như cũ

#### 2. Mobile - `src/components/Video/Mobile/VideoActionsBar.tsx`
- Thêm prop `isOwnVideo` vào interface `VideoActionsBarProps`
- Thêm prop `onEdit` callback
- Tại khu vực nút Subscribe/Bell (dòng 144-192): nếu `isOwnVideo` thì hiển thị nút "Chỉnh sửa" thay vì "Đăng ký"

#### 3. Mobile - `src/components/Video/Mobile/MobileWatchView.tsx`
- Truyền thêm prop `isOwnVideo` và `onEdit` xuống `VideoActionsBar`

### Chi tiet ky thuat

| File | Thay doi |
|------|---------|
| `src/pages/Watch.tsx` | Them `isOwnVideo`, conditional render nut Edit thay Subscribe |
| `src/components/Video/Mobile/VideoActionsBar.tsx` | Them prop `isOwnVideo`, `onEdit`, render nut chinh sua |
| `src/components/Video/Mobile/MobileWatchView.tsx` | Truyen `isOwnVideo`, `onEdit` xuong VideoActionsBar |

### Nut "Chinh sua video"
- Icon: Pencil/Edit (tu lucide-react)
- Text: "Chinh sua video"
- Style: tuong tu nut Subscribe nhung dung mau khac (outline hoac muted)
- Click: navigate den `/edit-video/{videoId}`

