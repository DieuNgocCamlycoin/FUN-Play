

## Khắc phục lỗi video không phát được

### Nguyên nhân gốc

Sau khi thêm Media Session Manager, hàm `togglePlay` trong `EnhancedVideoPlayer.tsx` có xung đột trạng thái:

```text
togglePlay() gọi:
  1. requestPlayback("video")  -- dispatch event
  2. video.play()              -- async, không await
  3. setIsPlaying(!isPlaying)  -- set true ngay lập tức

Đồng thời, video element có:
  onPlay  → setIsPlaying(true)   -- có thể bị ghi đè
  onPause → setIsPlaying(false)  -- nếu play thất bại
```

Nếu `video.play()` thất bại (browser policy, chưa load xong, hoặc bị pause bởi nguồn khác), `onPause` sẽ set `isPlaying = false` nhưng `setIsPlaying(!isPlaying)` đã set `true` trước đó, gây mất đồng bộ giữa state React và trạng thái thực của video element.

### Giải pháp

**1. File: `src/components/Video/EnhancedVideoPlayer.tsx`**

**a) Sửa hàm `togglePlay` (dòng 376-389):**
- Bỏ `setIsPlaying(!isPlaying)` thủ công
- Để trạng thái được điều khiển hoàn toàn bởi native events `onPlay`/`onPause` trên video element
- Await `video.play()` và xử lý lỗi

```typescript
const togglePlay = async () => {
  const video = videoRef.current;
  if (!video) return;

  if (video.paused) {
    try {
      requestPlayback("video");
      await video.play();
      // isPlaying sẽ được set true bởi onPlay event
    } catch (e) {
      console.log("Play failed:", e);
    }
  } else {
    video.pause();
    updateProgress(video.currentTime * 1000);
    // isPlaying sẽ được set false bởi onPause event
  }
};
```

Thay đổi quan trọng:
- Dùng `video.paused` thay vì state `isPlaying` để kiểm tra - đảm bảo luôn đồng bộ với video element thực tế
- Await `video.play()` và bắt lỗi
- Bỏ `setIsPlaying()` thủ công, để native events xử lý

**b) Sửa autoplay effect (dòng 203-219):**
- Thêm kiểm tra video đã sẵn sàng (readyState) trước khi play

**c) Sửa click zone togglePlay (dòng 680-683):**
- Đã gọi `togglePlay()` đúng rồi, không cần sửa

### Tổng hợp

| Tệp | Thay đổi |
|------|---------|
| `src/components/Video/EnhancedVideoPlayer.tsx` | Sửa `togglePlay` dùng `video.paused` thay `isPlaying`, await `video.play()`, bỏ manual `setIsPlaying` |

### Kết quả mong đợi
- Video phát được khi bấm nút Play hoặc click vào vùng video
- Trạng thái play/pause luôn đồng bộ giữa UI và video element
- Không còn xung đột state giữa manual set và native events
