

# Sửa Mini Player: Tăng cường debug + xử lý edge cases

## Phân tích

Code hiện tại đã được sửa đúng hướng (thay `hidden` bằng visually hidden, loại bỏ vòng lặp state). Tuy nhiên vẫn còn vấn đề:

### Vấn đề 1: Fallback play muted cũng bị nuốt lỗi
```text
// Dòng 46-51 hiện tại:
catch {
  video.muted = true;
  setIsMuted(true);
  setShowUnmutePrompt(true);
  try { await video.play(); } catch { /* give up */ }  // <-- Lỗi bị nuốt!
}
```
Nếu cả muted play cũng thất bại (ví dụ video URL lỗi, hoặc mobile browser chặn hoàn toàn), không có log nào cho biết.

### Vấn đề 2: Thiếu `preload` attribute
Video element không có `preload="auto"` hoặc `preload="metadata"`, trình duyệt mobile có thể không tải video cho đến khi có tương tác.

### Vấn đề 3: `currentTime` set quá sớm
Dòng 72-74 set `video.currentTime` ngay khi video mới load, nhưng video có thể chưa sẵn sàng (chưa có metadata). Cần đợi `loadedmetadata` event.

### Vấn đề 4: Không có crossOrigin
Video từ R2 CDN (domain khác) có thể cần `crossOrigin` attribute.

## Giải pháp

### File: `src/components/Video/GlobalMiniPlayer.tsx`

**1. Thêm logging chi tiết cho mọi bước play/pause:**
- Log khi gọi play unmuted
- Log khi fallback sang muted
- Log khi cả muted cũng fail (kèm error message)
- Log khi video loaded, khi set currentTime

**2. Thêm attributes cho video element:**
- `preload="auto"` - bắt trình duyệt tải video ngay
- `crossOrigin="anonymous"` - cho phép load từ R2 CDN

**3. Set currentTime an toàn hơn:**
- Dùng `onLoadedMetadata` event thay vì useEffect để set currentTime
- Đảm bảo video đã sẵn sàng trước khi seek

**4. Cải thiện error handling:**
- Log chi tiết lỗi khi muted play cũng fail
- Hiển thị trạng thái rõ ràng hơn cho user

## Chi tiết kỹ thuật

| Thay doi | Mo ta |
|----------|-------|
| Thêm `preload="auto"` trên video element | Buộc trình duyệt tải video |
| Thêm `crossOrigin="anonymous"` | Cho phép load từ CDN domain khác |
| Thêm `onLoadedMetadata` handler | Set currentTime an toàn |
| Cải thiện logging trong initialPlay | Log chi tiết mọi bước: unmuted attempt, muted fallback, final failure |
| Log video src khi component mount | Debug xác nhận URL video đúng |

## Chỉ 1 file cần sửa

| File | Thay đổi |
|------|----------|
| `src/components/Video/GlobalMiniPlayer.tsx` | Thêm preload, crossOrigin, logging chi tiết, set currentTime an toàn |
