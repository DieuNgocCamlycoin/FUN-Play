

# Phân loại Video + Kiểm duyệt nội dung PPLP bằng Angel AI

## Vấn đề hiện tại

### 1. 432 video không có duration (NULL)
- Hệ thống ghi `duration: NULL` vào database cho phần lớn video (67% tổng số)
- Nguyên nhân: Desktop upload (`Upload.tsx`) KHÔNG trích xuất duration từ video file trước khi lưu
- Mobile upload (`UploadContext.tsx`) có `metadata.duration` nhưng nhiều trường hợp vẫn bị 0 hoặc NULL

### 2. Thưởng sai loại
- 630 giao dịch SHORT_VIDEO_UPLOAD vs 123 LONG_VIDEO_UPLOAD
- Nhiều video dài bị phân loại nhầm thành video ngắn do duration = NULL -> mặc định SHORT

### 3. Chưa có kiểm duyệt nội dung PPLP
- Video và comment được đăng tải trực tiếp mà không kiểm tra nội dung

---

## Kế hoạch thực hiện

### A. Sửa lỗi trích xuất Duration trên Desktop Upload

**File: `src/pages/Upload.tsx`**

Thêm logic trích xuất duration từ video file khi user chọn file (sử dụng HTML5 Video API):

```text
User chọn file video
    |
    v
Tạo <video> element ẩn
    |
    v
Load metadata -> lấy video.duration
    |
    v
Lưu duration vào state
    |
    v
Ghi vào database khi insert video record
```

Hiện tại Desktop Upload KHÔNG có trường `duration` trong câu INSERT. Sẽ thêm `duration: Math.round(videoDuration)` vào.

### B. Edge Function mới: `moderate-content` - Kiểm duyệt PPLP bằng Angel AI

**File mới: `supabase/functions/moderate-content/index.ts`**

Sử dụng Lovable AI (LOVABLE_API_KEY đã có sẵn) để kiểm duyệt nội dung:

- **Input**: Tiêu đề video, mô tả, hoặc nội dung comment
- **Output**: `{ approved: boolean, reason: string, score: number }`
- **Tiêu chuẩn PPLP**: Nội dung phải mang tính Ánh sáng, tích cực, yêu thương, hướng thiện
- **Nội dung bị từ chối**: Bạo lực, thù ghét, lừa đảo, nội dung khiêu dâm, spam, quảng cáo không liên quan

**Xử lý nội dung không đạt chuẩn:**
- Video: Đặt `approval_status = 'pending_review'` thay vì 'approved', thông báo cho user rằng video đang được xem xét
- Comment: Cho phép đăng nhưng đánh dấu `is_flagged = true` để admin review
- Thưởng CAMLY: Chỉ cấp thưởng khi nội dung được duyệt

### C. Tích hợp kiểm duyệt vào Upload Flow (Mobile)

**File: `src/contexts/UploadContext.tsx`**

Sau khi tạo video record, gọi `moderate-content` để kiểm tra tiêu đề + mô tả:
- Nếu OK: Giữ `approval_status = 'approved'`, cấp thưởng bình thường
- Nếu không OK: Cập nhật `approval_status = 'pending_review'`, hiển thị toast thông báo video đang được xem xét, KHÔNG cấp thưởng

### D. Tích hợp kiểm duyệt vào Upload Flow (Desktop)

**File: `src/pages/Upload.tsx`**

Cùng logic như mobile - gọi `moderate-content` sau khi insert video.

### E. Tích hợp kiểm duyệt Comment

**File: `src/hooks/useVideoComments.ts` và `src/hooks/usePostComments.ts`**

Trước khi insert comment, gọi `moderate-content`:
- Nếu OK: Insert bình thường
- Nếu không OK: Hiển thị toast cảnh báo, vẫn cho đăng nhưng đánh dấu flag

### F. Backfill Duration cho 432 video NULL

**File mới: `supabase/functions/backfill-video-duration/index.ts`**

Edge function admin-only để:
1. Lấy danh sách video có `duration IS NULL`
2. Dùng video URL để probe duration (HEAD request hoặc ffprobe metadata)
3. Cập nhật `duration` trong database
4. Phân loại lại thưởng nếu cần (nếu video dài bị thưởng nhầm SHORT)

**Lưu ý**: Việc probe duration từ URL remote có thể không chính xác 100%. Phương án thay thế là đặt duration mặc định = 60 (SHORT) cho các video NULL và để hệ thống tự phân loại đúng cho các video mới.

### G. Cập nhật `supabase/config.toml`

Thêm config cho function mới `moderate-content` và `backfill-video-duration`.

---

## Tóm tắt thay đổi

| File | Thay đổi |
|------|----------|
| `src/pages/Upload.tsx` | Thêm trích xuất duration + gọi moderate-content |
| `src/contexts/UploadContext.tsx` | Gọi moderate-content sau khi tạo video |
| `supabase/functions/moderate-content/index.ts` | **MỚI** - Kiểm duyệt PPLP bằng Lovable AI |
| `supabase/functions/backfill-video-duration/index.ts` | **MỚI** - Backfill duration cho video cũ |
| `src/hooks/useVideoComments.ts` | Thêm kiểm duyệt comment |
| `src/hooks/usePostComments.ts` | Thêm kiểm duyệt comment bài viết |
| `supabase/config.toml` | Thêm config functions mới |

## Lưu ý quan trọng
- Lovable AI (LOVABLE_API_KEY) đã có sẵn, không cần API key mới
- Anti-fraud checks hiện tại (daily limits, spam, duplicate) vẫn giữ nguyên
- Nội dung bị từ chối sẽ KHÔNG bị xóa, chỉ chuyển sang trạng thái `pending_review` để admin có thể xem xét lại
- Thưởng CAMLY chỉ được cấp cho nội dung đã qua kiểm duyệt

