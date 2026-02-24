

# Sửa lỗi còn lại: GlobalMiniPlayer + BackgroundMusicPlayer

## Vấn đề phát hiện

### Lỗi 1: GlobalMiniPlayer không tham gia mediaSessionManager (Cao)

`GlobalMiniPlayer` có thẻ `<video>` phát âm thanh độc lập nhưng **hoàn toàn không tích hợp** với hệ thống loại trừ lẫn nhau (`mediaSessionManager`):
- Không gọi `requestPlayback()` khi bắt đầu phát
- Không lắng nghe `onPauseRequest()` để dừng khi nguồn khác phát

Hậu quả: MiniPlayer có thể phát đồng thời với EnhancedVideoPlayer, GlobalVideoPlayer, BackgroundMusicPlayer hoặc MusicPlayer.

### Lỗi 2: GlobalMiniPlayer không pause trước khi ẩn (Cao)

Khi người dùng vào trang Watch (`shouldHide = true`), component chỉ `return null` mà không gọi `videoRef.current.pause()` trước. Video element có thể tiếp tục phát âm thanh ngầm trước khi React unmount hoàn tất.

### Lỗi 3: BackgroundMusicPlayer UI không đồng bộ (Thấp)

Hàm `onPauseRequest` chỉ gọi `pause()` trên audio element nhưng không gọi `setIsPlaying(false)`. Mặc dù event `onPause` trên thẻ `<audio>` sẽ đồng bộ lại, nhưng trong trường hợp race condition, icon Play/Pause có thể hiển thị sai.

---

## Giải pháp

### Thay đổi 1: GlobalMiniPlayer - Tích hợp mediaSessionManager

**Tệp:** `src/components/Video/GlobalMiniPlayer.tsx`

- Import `requestPlayback` và `onPauseRequest` từ `mediaSessionManager`
- Thêm `useEffect` lắng nghe `onPauseRequest("video")` để tự động dừng khi nguồn khác phát
- Gọi `requestPlayback("video")` trong hàm `attemptPlay` trước khi phát
- Thêm logic pause video **trước khi** return null khi `shouldHide = true`

```typescript
// Thêm import
import { requestPlayback, onPauseRequest } from "@/lib/mediaSessionManager";

// Lắng nghe yêu cầu dừng từ nguồn khác
useEffect(() => {
  return onPauseRequest("video", () => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  });
}, [setIsPlaying]);

// Pause video trước khi ẩn trên trang Watch
useEffect(() => {
  if (shouldHide && videoRef.current && !videoRef.current.paused) {
    videoRef.current.pause();
  }
}, [shouldHide]);

// Trong attemptPlay, thêm requestPlayback trước khi play
const attemptPlay = useCallback(async (video: HTMLVideoElement) => {
  requestPlayback("video");
  video.muted = false;
  // ... phần còn lại giữ nguyên
}, []);
```

### Thay đổi 2: BackgroundMusicPlayer - Đồng bộ UI state

**Tệp:** `src/components/BackgroundMusicPlayer.tsx`

Không cần sửa vì thẻ `<audio>` đã có `onPause={() => setIsPlaying(false)}` ở dòng 135, sẽ tự đồng bộ khi `audioRef.current.pause()` được gọi. Lỗi này rủi ro thấp.

---

## Tóm tắt

| Tệp | Thay đổi |
|------|----------|
| `src/components/Video/GlobalMiniPlayer.tsx` | Tích hợp `requestPlayback` + `onPauseRequest`; pause trước khi ẩn trên trang Watch |

Chỉ cần sửa **1 tệp** duy nhất. Sau khi sửa, toàn bộ 5 nguồn phát media đều tham gia hệ thống loại trừ lẫn nhau, đảm bảo chỉ 1 nguồn âm thanh phát tại bất kỳ thời điểm nào.

