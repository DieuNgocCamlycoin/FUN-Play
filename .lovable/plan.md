

## Sửa lỗi: Bấm vào màn hình video để Dừng/Phát và Bấm đúp để tua ±10 giây

### Vấn đề hiện tại

Lớp overlay điều khiển (dòng 644-648) phủ toàn bộ bề mặt video với `absolute inset-0`, chặn mọi sự kiện chuột. Sự kiện `onClick={togglePlay}` trên thẻ `<video>` (dòng 562) không bao giờ được kích hoạt vì overlay nằm phía trên. Ngoài ra, chưa có logic xử lý bấm đúp (double-click) để tua nhanh ±10 giây trên desktop.

### Giải pháp

**Tệp**: `src/components/Video/EnhancedVideoPlayer.tsx`

#### Bước 1: Thêm state mới cho hiệu ứng tua

- `skipIndicator`: hiển thị biểu tượng tua lùi/tua tới khi bấm đúp (giống YouTubeMobilePlayer đã có sẵn)
- `clickTimeout`: ref lưu timeout để phân biệt bấm đơn và bấm đúp

#### Bước 2: Thêm vùng bấm (click zone) trong overlay

- Thêm một div trong suốt nằm giữa overlay, phía trên thanh điều khiển dưới cùng nhưng phía dưới nút Close
- Chia vùng bấm thành 2 nửa: trái và phải
- Xử lý logic:
  - **Bấm đơn** (single click): gọi `togglePlay()` — dừng hoặc phát video
  - **Bấm đúp nửa trái** (double-click left): gọi `seekRelative(-10)` — tua lùi 10 giây
  - **Bấm đúp nửa phải** (double-click right): gọi `seekRelative(10)` — tua tới 10 giây

#### Bước 3: Hiệu ứng phản hồi trực quan

- Khi bấm đúp trái: hiện biểu tượng tua lùi kèm chữ "-10 giây" rồi tự động ẩn sau 600ms
- Khi bấm đúp phải: hiện biểu tượng tua tới kèm chữ "+10 giây" rồi tự động ẩn sau 600ms

#### Bước 4: Xóa onClick thừa trên thẻ video

- Xóa `onClick={togglePlay}` khỏi thẻ `<video>` vì sự kiện này không bao giờ được kích hoạt (bị overlay chặn)

### Chi tiết kỹ thuật

- Sử dụng `setTimeout` 300ms để phân biệt bấm đơn và bấm đúp
- Khi bấm lần đầu: đặt timeout 300ms, nếu không có bấm thêm thì kích hoạt Play/Pause
- Khi bấm lần hai trong 300ms: hủy timeout, xác định vị trí bấm (trái/phải) rồi tua tương ứng
- Sử dụng `e.clientX` và `getBoundingClientRect()` để xác định nửa trái hay nửa phải

### Tệp thay đổi

| STT | Tệp | Nội dung |
|-----|------|----------|
| 1 | `src/components/Video/EnhancedVideoPlayer.tsx` | Thêm vùng bấm với logic bấm đơn/bấm đúp, hiệu ứng tua, xóa onClick thừa trên video |

### Kết quả

- Bấm vào bất kỳ vị trí nào trên video sẽ Dừng/Phát
- Bấm đúp nửa trái tua lùi 10 giây với hiệu ứng trực quan
- Bấm đúp nửa phải tua tới 10 giây với hiệu ứng trực quan
- Phím tắt vẫn hoạt động bình thường (J/L/K/Space)

