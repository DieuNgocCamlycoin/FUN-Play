

# Sửa Mini Player: Video ẩn không phát được trên mobile

## Nguyên nhân gốc

**1. `display: none` chặn phát video trên mobile**
File `GlobalMiniPlayer.tsx` dòng 154-155:
```text
<video
  className="hidden"   // Tailwind "hidden" = display: none
```
Trình duyệt mobile (iOS Safari, Chrome Android) **từ chối load/play** video có `display: none`. Đây là lý do console báo: `"Failed to load because no supported source was found"`.

**2. Vòng lặp state giữa onPlay/onPause và isPlaying**
Video element có `onPlay={() => setIsPlaying(true)}` và `onPause={() => setIsPlaying(false)}`. Khi `isPlaying` thay đổi, `useEffect` gọi `video.play()` hoặc `video.pause()`, lại trigger `onPlay`/`onPause` -> vòng lặp.

## Giải pháp

### File: `src/components/Video/GlobalMiniPlayer.tsx`

**Thay đổi 1: Thay `className="hidden"` bằng visually hidden nhưng vẫn render**
```text
// Trước:
className="hidden"

// Sau:
className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
```
Video vẫn tồn tại trong DOM, trình duyệt vẫn load và play được, nhưng không nhìn thấy.

**Thay đổi 2: Loại bỏ vòng lặp state**
- Xóa `onPlay` và `onPause` event handlers trên video element (chúng tạo vòng lặp với `useEffect`)
- Chỉ giữ `onEnded` để dừng khi hết video
- State `isPlaying` được quản lý hoàn toàn qua context, không qua video events

**Thay đổi 3: Thêm console.log để debug**
- Log khi video load thành công/thất bại
- Log khi play/pause được gọi
- Giúp debug dễ hơn trong tương lai

## Chỉ 1 file cần sửa

| File | Thay đổi |
|------|----------|
| `src/components/Video/GlobalMiniPlayer.tsx` | `hidden` -> visually hidden, xóa onPlay/onPause loop, thêm onError/onLoadedData handlers |
