

## Khắc phục: Video Player và Music Player không chạy đồng thời (giống YouTube)

### Vấn đề hiện tại
Hai hệ thống phát media hoạt động hoàn toàn **độc lập**:
1. **Music Player** (`MusicPlayerContext` + `EnhancedMusicPlayer`) - phát nhạc qua thẻ `<audio>`
2. **Video Player** (`EnhancedVideoPlayer` trên trang Watch + `GlobalVideoPlayer` khi rời trang Watch) - phát video qua thẻ `<video>`

Khi cả hai cùng phát, âm thanh bị chồng lên nhau. YouTube chỉ cho phép một nguồn phát tại một thời điểm.

### Giải pháp: Cơ chế "loại trừ lẫn nhau" (Mutual Exclusion)

Tạo một hệ thống event đơn giản để khi một player bắt đầu phát, nó sẽ tự động tạm dừng player còn lại.

### Chi tiết kỹ thuật

**1. File mới: `src/lib/mediaSessionManager.ts`**

Tạo một module quản lý phiên phát media toàn cục:
- Khi một player muốn phát, nó gọi `requestPlayback("video")` hoặc `requestPlayback("music")`
- Module phát sự kiện `mediaPauseRequest` để yêu cầu player khác dừng lại
- Đơn giản, không phụ thuộc React context

```typescript
// Khi video bắt đầu phát → gửi event yêu cầu music dừng
// Khi music bắt đầu phát → gửi event yêu cầu video dừng
type MediaSource = "video" | "music" | "global-video";

export function requestPlayback(source: MediaSource) {
  window.dispatchEvent(new CustomEvent("mediaPauseRequest", { detail: { except: source } }));
}
```

**2. File sửa: `src/contexts/MusicPlayerContext.tsx`**

- Khi `playTrack` / `playQueue` / `togglePlay` (play) được gọi → gọi `requestPlayback("music")`
- Lắng nghe event `mediaPauseRequest`: nếu `except !== "music"` → tự động pause

**3. File sửa: `src/components/Video/GlobalVideoPlayer.tsx`**

- Khi video bắt đầu phát → gọi `requestPlayback("global-video")`
- Lắng nghe event `mediaPauseRequest`: nếu `except !== "global-video"` → tự động pause

**4. File sửa: `src/components/Video/EnhancedVideoPlayer.tsx`**

- Khi video trên trang Watch bắt đầu phát → gọi `requestPlayback("video")`
- Lắng nghe event `mediaPauseRequest`: nếu `except !== "video"` → tự động pause

**5. File sửa: `src/components/BackgroundMusicPlayer.tsx`**

- Khi nhạc nền bắt đầu phát → gọi `requestPlayback("music")`
- Lắng nghe event `mediaPauseRequest` → tự động pause

### Luồng hoạt động

```text
Người dùng đang nghe nhạc (EnhancedMusicPlayer)
  → Mở trang Watch để xem video
  → EnhancedVideoPlayer gọi requestPlayback("video")
  → Event "mediaPauseRequest" được phát với except="video"
  → MusicPlayerContext nhận event → pause nhạc
  → Chỉ còn video phát

Người dùng đang xem video (trang Watch)
  → Bấm phát một bài nhạc
  → MusicPlayerContext gọi requestPlayback("music")
  → Event "mediaPauseRequest" được phát với except="music"
  → EnhancedVideoPlayer nhận event → pause video
  → Chỉ còn nhạc phát
```

### Tổng hợp thay đổi

| Tệp | Thay đổi |
|------|---------|
| `src/lib/mediaSessionManager.ts` | **Tạo mới** - Module quản lý phiên phát media |
| `src/contexts/MusicPlayerContext.tsx` | Thêm `requestPlayback("music")` khi phát + lắng nghe pause event |
| `src/components/Video/EnhancedVideoPlayer.tsx` | Thêm `requestPlayback("video")` khi phát + lắng nghe pause event |
| `src/components/Video/GlobalVideoPlayer.tsx` | Thêm `requestPlayback("global-video")` khi phát + lắng nghe pause event |
| `src/components/BackgroundMusicPlayer.tsx` | Thêm `requestPlayback("music")` khi phát + lắng nghe pause event |

### Kết quả mong đợi
- Tại bất kỳ thời điểm nào, chỉ có **một nguồn phát** hoạt động
- Chuyển qua lại giữa video và nhạc mượt mà, không bị chồng âm thanh
- Hoạt động giống YouTube: mở video → nhạc tự dừng, phát nhạc → video tự dừng

