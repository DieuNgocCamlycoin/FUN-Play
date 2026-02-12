

# Sửa lỗi hệ thống thưởng CAMLY tự động

## Phân tích lỗi phát hiện

### Lỗi 1: Thưởng SHARE không bao giờ được kích hoạt
- Hàm `awardShareReward` trong `useAutoReward` tồn tại nhưng KHÔNG ĐƯỢC GỌI ở bất kỳ đâu trong giao diện
- `ShareModal` có hàm `awardShare()` riêng gọi trực tiếp edge function, nhưng chỉ hoạt động khi prop `userId` được truyền vào
- Kết quả: Chỉ 17 giao dịch SHARE tổng cộng, lần cuối ngày 31/1/2026

### Lỗi 2: Upload trên mobile thưởng GẤP ĐÔI cho lần upload đầu tiên
- `UploadContext.tsx` (mobile) gọi CẢ `FIRST_UPLOAD` VÀ `SHORT/LONG_VIDEO_UPLOAD` cho video đầu tiên
- `Upload.tsx` (desktop) làm đúng: chỉ gọi 1 trong 2
- Kết quả: User upload lần đầu trên mobile nhận 500K + 20K/70K = 520K/570K thay vì 500K

### Lỗi 3: 431 video có `duration = NULL`
- Khi duration không xác định được, hệ thống mặc định thưởng theo LONG_VIDEO (70K) - có thể sai
- Nhiều video ngắn bị tính thưởng như video dài

### Lỗi 4: Cột `upload_rewarded` không bao giờ được cập nhật
- Flow upload gọi `award-camly` trực tiếp (không qua `check-upload-reward`)
- `check-upload-reward` là nơi duy nhất cập nhật `upload_rewarded = true`
- Rủi ro: video có thể bị thưởng trùng nếu `check-upload-reward` được gọi sau

## Kế hoạch sửa lỗi

### A. Sửa ShareModal - Tích hợp thưởng SHARE đúng cách
**File: `src/components/Video/ShareModal.tsx`**
- Bỏ hàm `awardShare()` inline
- Sử dụng edge function gọi trực tiếp (vì đây là component không phải hook)
- Đảm bảo luôn truyền `userId` từ auth session thay vì phụ thuộc prop
- Thêm fallback lấy userId từ `supabase.auth.getUser()` nếu prop không có

### B. Sửa UploadContext - Không thưởng gấp đôi
**File: `src/contexts/UploadContext.tsx`**
- Sửa logic: nếu `FIRST_UPLOAD` thành công, KHÔNG gọi thêm `SHORT/LONG_VIDEO_UPLOAD`
- Giống logic đã đúng trong `Upload.tsx` (desktop)

### C. Cập nhật `upload_rewarded` sau khi thưởng
**File: `src/contexts/UploadContext.tsx` va `src/pages/Upload.tsx`**
- Sau khi gọi `award-camly` thành công cho upload, cập nhật `upload_rewarded = true` trên bảng `videos`
- Ngăn chặn thưởng trùng

### D. Xử lý video duration NULL
**File: `src/contexts/UploadContext.tsx`**
- Khi `metadata.duration` = 0 hoặc không xác định, mặc định là SHORT_VIDEO (20K) thay vì LONG_VIDEO (70K) - an toàn hơn
- Thêm log cảnh báo khi duration không xác định

### E. Kiểm tra tích hợp thưởng Comment trên Watch page
- Comment reward đã hoạt động đúng trong `useVideoComments.ts` (gọi `awardCommentReward` khi comment >= 5 từ)
- Like reward đã hoạt động đúng trong `Watch.tsx` 
- View reward đã hoạt động đúng trong `EnhancedVideoPlayer.tsx` và `YouTubeMobilePlayer.tsx`

## Tóm tắt thay đổi

| Hành động | Trạng thái hiện tại | Sau khi sửa |
|-----------|---------------------|-------------|
| Upload video | Thưởng gấp đôi (mobile) | Thưởng đúng 1 lần |
| Share | Gần như không hoạt động | Hoạt động mỗi khi share |
| Like | Hoạt động OK | Giữ nguyên |
| Comment | Hoạt động OK | Giữ nguyên |
| View | Hoạt động OK | Giữ nguyên |
| upload_rewarded flag | Không cập nhật | Cập nhật đúng |

## File cần sửa
1. `src/components/Video/ShareModal.tsx` - Sửa logic thưởng share
2. `src/contexts/UploadContext.tsx` - Sửa thưởng gấp đôi + cập nhật upload_rewarded
3. `src/pages/Upload.tsx` - Cập nhật upload_rewarded sau thưởng

