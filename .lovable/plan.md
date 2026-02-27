

# Kế hoạch: Watch Time Tracking - Phân biệt thưởng Video Ngắn vs Video Dài

## Tổng quan

Hiện tại, tất cả lượt xem video đều nhận **cùng mức thưởng 5,000 CAMLY** (tương đương base reward 10 FUN) bất kể video dài hay ngắn. Điều kiện duy nhất là xem tích lũy đủ **30% thời lượng video**. Kế hoạch này sẽ phân biệt rõ ràng giữa video ngắn (Shorts) và video dài, với điều kiện xem và mức thưởng khác nhau.

---

## Quy tắc thưởng mới

| Loại video | Định nghĩa | Điều kiện xem | Thưởng CAMLY |
|---|---|---|---|
| **Video ngắn (Short)** | Thời lượng dưới hoac bang 3 phút (180s) | Xem hết video (>= 90% thời lượng) | 3,000 CAMLY |
| **Video dài (Long)** | Thời lượng trên 3 phút | Xem tối thiểu 5 phút (300s) thực tế | 8,000 CAMLY |

---

## Các thay đổi cần thực hiện

### 1. Cập nhật Edge Function `batch-award-camly`

Thay đổi logic xử lý VIEW reward:

- Truy vấn `duration` của video từ bảng `videos`
- Phân loại: `duration <= 180` la Short, `> 180` la Long
- **Short**: Yêu cầu `actualWatchTime >= duration * 0.9` (xem gần hết)
- **Long**: Yêu cầu `actualWatchTime >= 300` (xem tối thiểu 5 phút)
- Gán mức thưởng tương ứng (3,000 hoặc 8,000 CAMLY)
- Cập nhật `short_video_count` và `long_video_count` trong `daily_reward_limits`
- Ghi `view_logs` kèm `video_duration_seconds`, `watch_time_seconds`, `watch_percentage`

### 2. Thêm cấu hình vào `reward_config`

Thêm các config key mới để admin có thể điều chỉnh linh hoạt:
- `SHORT_VIDEO_VIEW_REWARD`: 3000
- `LONG_VIDEO_VIEW_REWARD`: 8000
- `SHORT_VIDEO_MIN_WATCH_PERCENT`: 90
- `LONG_VIDEO_MIN_WATCH_SECONDS`: 300
- `SHORT_VIDEO_MAX_DURATION`: 180

### 3. Cập nhật Video Players (3 file)

Sửa logic tích lũy watch time trong 3 player components:

- `EnhancedVideoPlayer.tsx` (Desktop)
- `YouTubeMobilePlayer.tsx` (Mobile)
- `MobileVideoPlayer.tsx` (Shorts)

Thay đổi: Bỏ ngưỡng cứng 30%, thay bằng logic phân loại theo duration:
- Short (duration <= 180s): trigger reward khi `accumulatedWatchTime >= duration * 0.9`
- Long (duration > 180s): trigger reward khi `accumulatedWatchTime >= 300`

### 4. Cập nhật UI hiển thị chính sách

- Sửa `RewardPolicyCard.tsx`: Tách "Xem video" thành 2 dòng riêng cho Short và Long
- Cập nhật mô tả: Short "Xem hết video" = 3,000 CAMLY, Long "Xem tối thiểu 5 phút" = 8,000 CAMLY

### 5. Ghi log chi tiết vào `view_logs`

Edge function sẽ insert vào `view_logs` với đầy đủ thông tin:
- `watch_time_seconds`: Thời gian xem thực tế
- `watch_percentage`: Phần trăm đã xem
- `video_duration_seconds`: Thời lượng video
- `is_valid`: true/false dựa trên điều kiện xem

---

## Chi tiết kỹ thuật

### Logic phân loại trong Edge Function

```text
if (video.duration <= 180) {
  // SHORT VIDEO
  requiredWatch = video.duration * 0.9
  rewardAmount = SHORT_VIDEO_VIEW_REWARD (3000)
  counterField = "short_video_count"
} else {
  // LONG VIDEO  
  requiredWatch = 300 // 5 minutes
  rewardAmount = LONG_VIDEO_VIEW_REWARD (8000)
  counterField = "long_video_count"
}

if (actualWatchTime < requiredWatch) {
  REJECT: "Insufficient watch time"
}
```

### Logic trigger trong Video Player

```text
// Thay thế logic hiện tại (accumulatedWatchTime >= duration * 0.3)
const isShort = duration <= 180
const threshold = isShort ? duration * 0.9 : 300

if (accumulatedWatchTime >= threshold && !viewRewarded) {
  awardViewReward(videoId, { actualWatchTime })
}
```

---

## Thứ tự triển khai

1. Thêm config mới vào bảng `reward_config` (data insert)
2. Cập nhật Edge Function `batch-award-camly` với logic phân loại
3. Cập nhật 3 video player components (client-side threshold)
4. Cập nhật `RewardPolicyCard.tsx` (UI hiển thị)

