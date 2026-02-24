

# Sửa lỗi: 2 luồng âm thanh chạy đồng thời khi mở video

## Nguyên nhân gốc

Hệ thống có **5 nguồn phát media độc lập**, mỗi nguồn có thẻ `<video>` hoặc `<audio>` riêng biệt:

| Nguồn | Thẻ phát | Vị trí |
|-------|----------|--------|
| EnhancedVideoPlayer | `<video>` (trang Watch) | Watch.tsx |
| GlobalVideoPlayer | `<video>` (ẩn, chỉ phát âm thanh) | App.tsx (toàn cục) |
| GlobalMiniPlayer | `<video>` (mini overlay) | App.tsx (toàn cục) |
| BackgroundMusicPlayer | `<audio>` (nhạc nền) | Index.tsx |
| MusicPlayerContext | `<audio>` (nhạc duyệt) | App.tsx (toàn cục) |

### Lỗi 1: GlobalVideoPlayer không dừng phát khi vào trang Watch

- Khi `isOnWatchPage = true`, component chỉ gọi `setIsVisible(false)` rồi `return null` (dòng 64-70, 244)
- Nhưng **không gọi `videoRef.current.pause()`** trước khi ẩn
- Effect ở dòng 118-172 có thể **tự động phát video** (dòng 161-163) trước khi component bị unmount
- Kết quả: âm thanh từ GlobalVideoPlayer tiếp tục chạy ngầm 1-2 giây, hoặc trong trường hợp URL matching thất bại, nó **không bao giờ dừng**

### Lỗi 2: Trang Watch không gửi tín hiệu dừng khi mở

- Trang Watch **không bao giờ dispatch** sự kiện `stopGlobalPlayback` khi mount
- Nó chỉ dispatch `startGlobalPlayback` khi **rời đi** (unmount)
- Vì vậy GlobalVideoPlayer không nhận được lệnh dừng khi người dùng mở video mới

### Lỗi 3: BackgroundMusicPlayer không dọn dẹp khi chuyển trang

- `BackgroundMusicPlayer` mount trên trang Index với `autoPlay={true}`
- Khi người dùng chuyển sang trang Watch, component unmount nhưng **không có cleanup pause** cho thẻ `<audio>`
- Nếu React giữ cache component, âm thanh có thể tiếp tục phát

### Lỗi 4: Hệ thống "loại trừ lẫn nhau" có lỗ hổng

- `mediaSessionManager` chỉ gửi sự kiện `mediaPauseRequest` để thông báo các nguồn khác dừng lại
- Nhưng nếu 2 nguồn gọi `requestPlayback` gần như đồng thời (ví dụ khi chuyển trang), cả 2 đều tự cho mình là nguồn được phép phát

---

## Giải pháp

### Thay đổi 1: GlobalVideoPlayer - Dừng phát trước khi ẩn

**Tệp:** `src/components/Video/GlobalVideoPlayer.tsx`

Sửa effect tại dòng 64-70 để gọi `pause()` **ngay lập tức** khi phát hiện đang ở trang Watch:

```typescript
useEffect(() => {
  if (isOnWatchPage) {
    // DỪNG video TRƯỚC khi ẩn - tránh âm thanh chạy ngầm
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setIsVisible(false);
  } else if (globalVideoState) {
    setIsVisible(true);
  }
}, [location.pathname, isOnWatchPage]);
```

Thêm guard vào auto-play tại dòng 161-163:

```typescript
if (globalIsPlaying && !isOnWatchPage) {
  video.play().catch(console.error);
}
```

### Thay đổi 2: Trang Watch - Gửi tín hiệu dừng khi mở

**Tệp:** `src/pages/Watch.tsx`

Thêm effect mới để dispatch `stopGlobalPlayback` ngay khi trang Watch mount, đảm bảo mọi nguồn phát khác đều dừng:

```typescript
// Dừng tất cả nguồn phát khác khi mở trang Watch
useEffect(() => {
  window.dispatchEvent(new Event('stopGlobalPlayback'));
  requestPlayback("video"); // Yêu cầu độc quyền cho video chính
}, [id]); // Chạy lại khi chuyển sang video khác
```

### Thay đổi 3: BackgroundMusicPlayer - Dọn dẹp khi unmount

**Tệp:** `src/components/BackgroundMusicPlayer.tsx`

Thêm cleanup effect để dừng phát và xoá nguồn âm thanh khi component bị gỡ:

```typescript
useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };
}, []);
```

---

## Tóm tắt thay đổi

| Tệp | Nội dung thay đổi |
|------|-------------------|
| `src/components/Video/GlobalVideoPlayer.tsx` | Gọi `pause()` trước khi ẩn; thêm guard `!isOnWatchPage` vào auto-play |
| `src/pages/Watch.tsx` | Dispatch `stopGlobalPlayback` + `requestPlayback("video")` khi mount |
| `src/components/BackgroundMusicPlayer.tsx` | Thêm cleanup pause + xoá src khi unmount |

## Kết quả mong đợi

- Chỉ **duy nhất 1 nguồn âm thanh** phát tại bất kỳ thời điểm nào
- Khi mở trang Watch: GlobalVideoPlayer + BackgroundMusicPlayer + MusicPlayer đều bị dừng
- Khi pause video trên Watch: im lặng hoàn toàn, không có âm thanh nền
