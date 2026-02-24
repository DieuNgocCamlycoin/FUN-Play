

# Tắt và ẩn tính năng phát nhạc nền

## Nội dung thay đổi

Tạm vô hiệu hoá (comment out) toàn bộ phần liên quan đến `BackgroundMusicPlayer` ở **2 trang** đang sử dụng, để khi cần mở lại chỉ cần bỏ comment.

### Tệp 1: `src/pages/Index.tsx`
- Comment out import `BackgroundMusicPlayer`
- Comment out state `currentMusicUrl` (nếu có)
- Comment out phần render `<BackgroundMusicPlayer />` (dòng 477-484)

### Tệp 2: `src/pages/Channel.tsx`
- Comment out import `BackgroundMusicPlayer`
- Comment out phần render `<BackgroundMusicPlayer />` (dòng 366-369)

## Lưu ý
- Không xoá code, chỉ comment out để dễ dàng kích hoạt lại sau
- File `BackgroundMusicPlayer.tsx` giữ nguyên, không chỉnh sửa

