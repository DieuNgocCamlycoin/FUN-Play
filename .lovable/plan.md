
# Sửa lỗi phân loại video dài + Cập nhật thưởng cho "8 Câu Thần Chú Của Cha"

## Vấn đề gốc

Khi upload video, hệ thống dùng HTML5 Video API để đọc thời lượng. Với một số định dạng video, API này **không đọc được duration** (trả về 0 hoặc NaN). Kết quả:

```text
Client: duration = 0 -> 0 <= 180 -> SHORT_VIDEO_UPLOAD (20K)
Server (award-camly): nhận type = SHORT_VIDEO_UPLOAD -> tin tưởng, cấp 20K
Database: duration = NULL (vì 0 bị lọc thành null)
```

Video **"8 Câu Thần Chú Của Cha"** (id: 34da877e) bị ảnh hưởng: duration = NULL, nhận 20K thay vì 70K.

## Kế hoạch sửa (3 bước)

### Bước 1: Sửa dữ liệu cho "8 Câu Thần Chú Của Cha"

Cập nhật SQL:
- Set duration cho video (cần xác nhận thời lượng thực, tạm đặt 240s)
- Sửa reward_transaction: SHORT -> LONG, 20000 -> 70000
- Bù 50.000 CAMLY vào approved_reward va total_camly_rewards

### Bước 2: Server-side validation trong `award-camly` Edge Function

Thêm logic: khi nhận `SHORT_VIDEO_UPLOAD` hoặc `LONG_VIDEO_UPLOAD`, **kiểm tra duration thực từ database** để tự sửa loại nếu client gửi sai:

```text
Client gửi: type = SHORT_VIDEO_UPLOAD, videoId = xxx
    |
    v
Server đọc videos.duration WHERE id = videoId
    |
    ├── duration > 180 -> Override type = LONG_VIDEO_UPLOAD, amount = 70K
    ├── duration <= 180 -> Giữ SHORT_VIDEO_UPLOAD, amount = 20K
    └── duration = NULL -> Giữ nguyên type client gửi (an toàn), log cảnh báo
```

### Bước 3: Cải thiện client-side duration detection

Trong cả `Upload.tsx` (desktop) và `UploadContext.tsx` (mobile), thêm retry logic cho trường hợp `onloadedmetadata` không fire:

```text
Attempt 1: onloadedmetadata event
    |
    ├── duration > 0 -> Dùng giá trị này
    └── duration = 0/NaN -> Timeout 5s
        |
        v
Attempt 2: Dùng video.readyState check + requestVideoFrameCallback
        |
        └── Vẫn fail -> Log cảnh báo, để server tự phân loại từ DB
```

## Chi tiết kỹ thuật

### Files cần sửa

| File | Thay đổi |
|------|----------|
| SQL (data fix) | Cập nhật duration, reward_type, bù 50K CAMLY cho "8 Câu Thần Chú" |
| `supabase/functions/award-camly/index.ts` | Thêm server-side duration verification cho UPLOAD rewards |
| `src/contexts/UploadContext.tsx` | Cải thiện duration detection + retry logic cho mobile |
| `src/pages/Upload.tsx` | Cải thiện duration detection + retry logic cho desktop |

### SQL Data Fix
```text
-- Cập nhật duration cho video "8 Câu Thần Chú Của Cha"
UPDATE videos SET duration = 240 WHERE id = '34da877e-9d68-4bd2-b23e-0de8481263a4';

-- Sửa reward: SHORT -> LONG, 20000 -> 70000
UPDATE reward_transactions 
SET reward_type = 'LONG_VIDEO_UPLOAD', amount = 70000 
WHERE video_id = '34da877e-9d68-4bd2-b23e-0de8481263a4' 
  AND reward_type = 'SHORT_VIDEO_UPLOAD';

-- Bù 50000 CAMLY
UPDATE profiles 
SET approved_reward = COALESCE(approved_reward, 0) + 50000,
    total_camly_rewards = COALESCE(total_camly_rewards, 0) + 50000
WHERE id = 'd06c21f9-a612-4d0e-8d22-05e89eb5120d';
```

### award-camly Edge Function - Server-side Duration Check (dòng 227-234)
Thêm block moi sau dòng 228 (`if (amount === 0)`):
```text
// For upload rewards, verify duration from database to override client classification
if ((type === 'SHORT_VIDEO_UPLOAD' || type === 'LONG_VIDEO_UPLOAD') && videoId) {
  const { data: videoData } = await adminSupabase
    .from('videos').select('duration').eq('id', videoId).single();
  
  if (videoData?.duration && videoData.duration > 180 && type === 'SHORT_VIDEO_UPLOAD') {
    console.warn(`Override: Video ${videoId} duration=${videoData.duration}s, changing SHORT -> LONG`);
    type = 'LONG_VIDEO_UPLOAD';
    amount = REWARD_AMOUNTS['LONG_VIDEO_UPLOAD'];
  } else if (videoData?.duration && videoData.duration <= 180 && type === 'LONG_VIDEO_UPLOAD') {
    console.warn(`Override: Video ${videoId} duration=${videoData.duration}s, changing LONG -> SHORT`);
    type = 'SHORT_VIDEO_UPLOAD'; 
    amount = REWARD_AMOUNTS['SHORT_VIDEO_UPLOAD'];
  } else if (!videoData?.duration) {
    console.warn(`Video ${videoId} has NULL duration, keeping client type: ${type}`);
  }
}
```

### Client Duration Detection (cả Upload.tsx va UploadContext.tsx)
Thay the Promise don gian bang retry logic:
```text
// Retry-capable duration extraction
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    let resolved = false;
    
    const finish = (dur: number) => {
      if (resolved) return;
      resolved = true;
      URL.revokeObjectURL(video.src);
      resolve(dur);
    };
    
    video.onloadedmetadata = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        finish(video.duration);
      }
    };
    
    video.ondurationchange = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        finish(video.duration);
      }
    };
    
    video.onerror = () => finish(0);
    
    // Timeout fallback
    setTimeout(() => finish(0), 10000);
    
    video.src = URL.createObjectURL(file);
  });
};
```
