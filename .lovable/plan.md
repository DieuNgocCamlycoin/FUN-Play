
# Sắp xếp lại thứ tự tab trong trang Channel

## Thay đổi

Sửa **1 file**: `src/components/Profile/ProfileTabs.tsx`

### Thứ tự hiện tại:
1. Bài viết (posts)
2. Video
3. Shorts
4. Livestream
5. Playlist
6. Giới thiệu

### Thứ tự mới:
1. **Video** (đưa lên đầu)
2. Shorts
3. Livestream
4. **Bài viết** (chuyển xuống sau Livestream)
5. Playlist
6. Giới thiệu

### Chi tiết kỹ thuật

1. Sắp xếp lại mảng `tabs` (dòng 26-33) theo thứ tự mới
2. Đổi `useState("posts")` thành `useState("videos")` (dòng 19) để tab Video được chọn mặc định khi vào trang
3. Sắp xếp lại các `TabsContent` tương ứng cho khớp thứ tự

Thay đổi áp dụng cho cả Desktop và Mobile vì cùng dùng chung component `ProfileTabs`.
