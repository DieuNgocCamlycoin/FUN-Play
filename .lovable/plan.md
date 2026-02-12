
# Sửa thưởng video "Return To The Light" + Cải thiện xử lý duration NULL

## Vấn đề tìm thấy

Video **"Return To The Light"** (id: `f52736ad`) của **Angel Thu Ha** có `duration = NULL` trong database. Khi backfill chạy, hệ thống coi NULL = 0, và `0 > 180` = false nên phân loại là SHORT_VIDEO_UPLOAD (20.000 CAMLY). Thực tế video dài trên 4 phút, đáng lẽ phải nhận LONG_VIDEO_UPLOAD (70.000 CAMLY).

## Kế hoạch sửa

### Bước 1: Cập nhật database trực tiếp (SQL Migration)

Chạy SQL để:
1. Cập nhật `duration` cho video "Return To The Light" (đặt 240s = 4 phút, hoặc giá trị chính xác nếu biết)
2. Sửa reward_transaction: cập nhật `reward_type` từ SHORT sang LONG và `amount` từ 20.000 lên 70.000
3. Bù thêm 50.000 CAMLY vào `approved_reward` của user

### Bước 2: Sửa backfill Edge Function

**File: `supabase/functions/backfill-upload-rewards/index.ts`** (dòng 112)

Hiện tại: `if (duration > 180)` -- NULL/0 luôn bị coi là SHORT.

Sửa: Giữ nguyên logic (NULL = SHORT là đúng vì an toàn tài chính), nhưng thêm log cảnh báo khi duration là NULL để admin biết cần kiểm tra thủ công.

### Bước 3: Cập nhật duration cho video "8 Câu Thần Chú Của Cha"

Video này (id: `34da877e`) cũng có `duration = NULL` và cũng của cùng user. Cần kiểm tra và cập nhật nếu cần.

## Chi tiết kỹ thuật

### SQL Migration
```text
-- 1. Cập nhật duration cho video "Return To The Light" (4 phút = 240s)
UPDATE videos SET duration = 240 WHERE id = 'f52736ad-d0d7-42d3-988c-5f2809dc147b';

-- 2. Sửa reward_transaction: SHORT -> LONG, 20000 -> 70000
UPDATE reward_transactions 
SET reward_type = 'LONG_VIDEO_UPLOAD', amount = 70000 
WHERE video_id = 'f52736ad-d0d7-42d3-988c-5f2809dc147b' 
  AND reward_type = 'SHORT_VIDEO_UPLOAD';

-- 3. Bù 50000 CAMLY vào approved_reward
UPDATE profiles 
SET approved_reward = COALESCE(approved_reward, 0) + 50000,
    total_camly_rewards = COALESCE(total_camly_rewards, 0) + 50000
WHERE id = 'd06c21f9-a612-4d0e-8d22-05e89eb5120d';
```

### File sửa: `supabase/functions/backfill-upload-rewards/index.ts`
- Thêm log cảnh báo khi `duration` là NULL: `console.warn("Video has NULL duration, defaulting to SHORT")`
- Giữ logic an toàn: NULL = SHORT (20.000 CAMLY)

## Tóm tắt

| Thay đổi | Mô tả |
|----------|-------|
| SQL Migration | Cập nhật duration, sửa reward, bù 50.000 CAMLY |
| backfill-upload-rewards | Thêm cảnh báo khi duration NULL |
