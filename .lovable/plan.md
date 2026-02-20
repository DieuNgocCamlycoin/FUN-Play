

## Sửa lỗi các nút điều khiển video không hoạt động

### Nguyên nhân

Trong `EnhancedVideoPlayer.tsx`, có một vùng click zone (div dùng để xử lý click play/pause và double-click tua) được đặt `z-10` phủ lên toàn bộ video. Tuy nhiên, phần overlay chứa các nút điều khiển (Play, Pause, Volume, Settings, PiP, Theater, Fullscreen...) lại **không có z-index**, nên dù các nút có `pointer-events-auto`, chúng vẫn bị vùng click zone chặn mất sự kiện click.

### Giải pháp

Thêm `z-20` vào div overlay chứa các nút điều khiển để nó nằm trên vùng click zone (`z-10`). Đồng thời thêm `e.stopPropagation()` vào tất cả các nút điều khiển chưa có để đảm bảo click không bị truyền ngược lên vùng click zone.

### Chi tiết kỹ thuật

| STT | Tệp | Nội dung thay đổi |
|-----|------|-------------------|
| 1 | `src/components/Video/EnhancedVideoPlayer.tsx` | Thêm `z-20` vào controls overlay div (dòng 714), thêm `e.stopPropagation()` vào các nút chưa có |

**Thay đổi cụ thể:**

1. **Dòng 714** - Controls overlay: Thêm `z-20` để nằm trên click zone
   - Trước: `"absolute inset-0 transition-opacity duration-300 pointer-events-none"`
   - Sau: `"absolute inset-0 transition-opacity duration-300 pointer-events-none z-20"`

2. **Các nút điều khiển** (Play, Prev, Next, Volume, PiP, Theater, Fullscreen): Thêm `e.stopPropagation()` vào `onClick` để ngăn sự kiện truyền lên click zone phía dưới.

### Kết quả mong đợi

- Tất cả các nút điều khiển (Play/Pause, Previous, Next, Volume, Settings, PiP, Theater, Fullscreen) hoạt động bình thường khi rê chuột vào video
- Click vào vùng trống của video vẫn toggle Play/Pause như trước
- Double-click tua +-10 giây vẫn hoạt động bình thường

