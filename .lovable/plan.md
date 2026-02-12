

# Backfill thưởng Upload CAMLY cho 433 video chưa được thưởng

## Vấn đề

Hiện có **433 video** đã upload thành công nhưng chưa nhận được phần thưởng CAMLY. Nguyên nhân do các lỗi trước đó trong code upload đã được sửa, nhưng các video cũ vẫn chưa được bù thưởng.

**Thống kê theo user (top):**
- Trần Văn Lực: 56 video chưa thưởng
- Hoangtydo: 54 video
- Hồng ThienHanh68: 35 video
- THU TRANG: 27 video
- ... và 40+ users khác

## Giải pháp

Tạo một **edge function mới** `backfill-upload-rewards` chạy server-side (admin-only) để:

1. Tìm tất cả video chưa có upload reward trong bảng `reward_transactions`
2. Với mỗi video:
   - Kiểm tra `first_upload_rewarded` của user -> nếu chưa, thưởng FIRST_UPLOAD (500K)
   - Nếu đã có first upload, thưởng theo duration: SHORT (20K) nếu duration <= 180s hoặc NULL, LONG (70K) nếu > 180s
3. Cập nhật `upload_rewarded = true` trên video
4. Cập nhật `first_upload_rewarded = true` trên profile nếu cần
5. Tạo `reward_transaction` record với auto-approve

### Chi tiết kỹ thuật

**File mới: `supabase/functions/backfill-upload-rewards/index.ts`**
- Chỉ admin mới gọi được (kiểm tra `user_roles`)
- Xử lý theo batch (50 video/lần) để tránh timeout
- Sử dụng `atomic_increment_reward` RPC để cập nhật profile an toàn
- Log chi tiết từng video được thưởng
- Trả về báo cáo tổng hợp

**Cập nhật: `src/pages/RewardHistory.tsx`**
- Không cần thay đổi - realtime subscription đã có sẽ tự động hiển thị rewards mới khi backfill chạy

### Flow xử lý

```text
Admin gọi backfill-upload-rewards
    |
    v
Lấy danh sách video chưa thưởng (batch 50)
    |
    v
Với mỗi video:
  - User chưa có first_upload_rewarded? -> FIRST_UPLOAD (500K)
  - Đã có? -> Duration <= 180s/NULL -> SHORT (20K)
  -          Duration > 180s -> LONG (70K)
    |
    v
Tạo reward_transaction + atomic_increment_reward
    |
    v
Cập nhật video.upload_rewarded = true
    |
    v
RewardHistory tự động nhận qua Realtime
```

### Kết quả mong đợi
- 433 video sẽ được thưởng chính xác
- Khoảng 20 users chưa có `first_upload_rewarded` sẽ nhận 500K
- Trang Lịch sử thưởng cập nhật realtime ngay sau khi backfill chạy
- Tất cả hoạt động đồng bộ trên mobile

## File cần tạo/sửa
1. **Tạo mới**: `supabase/functions/backfill-upload-rewards/index.ts`
2. **Cập nhật**: `supabase/config.toml` (thêm config cho function mới, verify_jwt = false)

