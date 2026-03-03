

## Kế hoạch hoàn thiện tính năng Livestream (Phần 2)

Tiếp theo bảng tổng kết, triển khai 4 tính năng nâng cấp ưu tiên cao nhất.

---

### 1. Điều khiển Streamer: Bật/tắt Mic, Camera, Chia sẻ màn hình

**Mục tiêu:** Streamer có thể toggle mic/camera trong khi đang live, và chuyển sang chia sẻ màn hình.

**Thay đổi:**

- **Tạo `src/components/Live/StreamerControls.tsx`**: Component chứa 3 nút: Mic (on/off), Camera (on/off), Screen Share (bật/tắt). Sử dụng `lucide-react` icons (Mic, MicOff, Video, VideoOff, Monitor).

- **Cập nhật `src/hooks/useWebRTC.ts` (useWebRTCStreamer)**: Thêm 3 hàm mới:
  - `toggleMic()`: `streamRef.current.getAudioTracks()[0].enabled = !enabled`
  - `toggleCamera()`: `streamRef.current.getVideoTracks()[0].enabled = !enabled`
  - `shareScreen()`: Gọi `navigator.mediaDevices.getDisplayMedia()`, thay thế video track trên tất cả peer connections bằng `sender.replaceTrack()`. Khi dừng share, đổi lại track camera gốc.
  - Trả thêm state: `isMicOn`, `isCameraOn`, `isScreenSharing`

- **Cập nhật `src/pages/GoLive.tsx`**: Thêm `StreamerControls` vào thanh điều khiển phía dưới video khi `phase === "live"`.

---

### 2. Chat Moderation: Xoá tin nhắn, Cấm người dùng

**Mục tiêu:** Streamer (chủ livestream) có thể xoá tin nhắn và cấm user khỏi chat.

**Thay đổi Database (Migration):**

- **Thêm cột `is_deleted`** vào bảng `livestream_chat` (boolean, default false)
- **Tạo bảng `livestream_bans`**: `id`, `livestream_id`, `user_id`, `banned_by`, `reason`, `created_at`
- **Cập nhật RLS**:
  - Streamer (owner) có thể UPDATE `livestream_chat` (set `is_deleted = true`) trên stream của mình
  - Streamer có thể INSERT/SELECT `livestream_bans` trên stream của mình
  - Trước khi INSERT vào `livestream_chat`, kiểm tra user không bị ban (dùng RLS policy hoặc check ở client)

**Thay đổi Code:**

- **Cập nhật `src/components/Live/LiveChat.tsx`**: 
  - Nhận thêm prop `streamerId` để biết ai là chủ stream
  - Hiển thị nút "Xoá" bên cạnh mỗi tin nhắn (chỉ khi user hiện tại = streamer)
  - Hiển thị nút "Cấm" bên cạnh username (chỉ khi user = streamer, và user đó != streamer)
  - Ẩn tin nhắn có `is_deleted = true` (hoặc hiện "[Đã xoá]")

- **Cập nhật `src/hooks/useLiveChat.ts`**: 
  - Thêm hàm `deleteMessage(messageId)`: UPDATE `is_deleted = true`
  - Thêm hàm `banUser(userId)`: INSERT vào `livestream_bans`
  - Filter bỏ tin nhắn `is_deleted = true` khi load
  - Kiểm tra user bị ban trước khi gửi tin nhắn

- **Cập nhật `src/pages/GoLive.tsx` và `src/pages/LiveWatch.tsx`**: Truyền `streamerId` cho `LiveChat`

---

### 3. Mobile Responsive cho trang xem Live

**Mục tiêu:** LiveWatch và GoLive hiển thị tốt trên mobile (dưới 768px).

**Thay đổi:**

- **Cập nhật `src/pages/LiveWatch.tsx`**:
  - Thay `grid-cols-1 lg:grid-cols-3` thành layout dọc trên mobile: Video full width, chat bên dưới với chiều cao cố định (~40vh)
  - Nút "Tặng CAMLY" thu nhỏ thành icon-only trên mobile
  - Streamer info compact hơn trên mobile

- **Cập nhật `src/pages/GoLive.tsx`**:
  - Controls bar wrap trên mobile
  - Chat panel dưới video thay vì bên cạnh

- **Cập nhật `src/components/Live/LivePlayer.tsx`**: Aspect ratio tự điều chỉnh trên mobile (16:9 trên desktop, gần vuông hơn trên mobile nhỏ)

---

### 4. Tự động kết nối lại cho Viewer

**Mục tiêu:** Khi viewer mất kết nối (mạng yếu, peer disconnect), tự động thử kết nối lại thay vì hiện màn đen.

**Thay đổi:**

- **Cập nhật `src/hooks/useWebRTC.ts` (useWebRTCViewer)**:
  - Khi `connectionState` chuyển sang `"disconnected"` hoặc `"failed"`, tự động gọi lại `connect()` sau 3 giây
  - Giới hạn tối đa 5 lần thử kết nối lại
  - Thêm state `reconnectAttempts` để UI hiển thị trạng thái

- **Cập nhật `src/pages/LiveWatch.tsx`**: 
  - Hiển thị overlay "Đang kết nối lại... (lần X/5)" khi đang reconnect
  - Hiển thị "Không thể kết nối" khi hết lượt thử, kèm nút "Thử lại"

---

### Thứ tự thực hiện

| Thứ tự | Công việc | Độ khó |
|--------|-----------|--------|
| 1 | Migration: thêm `is_deleted` vào `livestream_chat` + tạo bảng `livestream_bans` + RLS | Thấp |
| 2 | Streamer controls (mic/cam/screen share) | Trung bình |
| 3 | Chat moderation (xoá tin, ban user) | Trung bình |
| 4 | Reconnection logic cho viewer | Thấp |
| 5 | Mobile responsive | Thấp |

---

### Bảng tổng kết tính năng Livestream (cập nhật)

#### Đã hoàn thành
| STT | Tính năng | Trạng thái |
|-----|-----------|------------|
| 1 | Database: bảng livestreams, livestream_chat, livestream_reactions với RLS | Xong |
| 2 | WebRTC P2P signaling qua Supabase Realtime broadcast | Xong |
| 3 | Trang GoLive (thiết lập, xem trước, phát sóng) | Xong |
| 4 | Trang LiveWatch (xem stream + thông tin streamer) | Xong |
| 5 | Trang LiveDirectory (danh sách stream đang live) | Xong |
| 6 | Live Chat realtime | Xong |
| 7 | Flying Reactions (emoji bay) | Xong |
| 8 | Tặng thưởng CAMLY với EnhancedDonateModal | Xong |
| 9 | VOD Recording (MediaRecorder + upload R2) | Xong |
| 10 | Thông báo tự động cho subscriber khi bắt đầu live | Xong |
| 11 | Navigation: nút Live trong Header, Sidebar, Studio | Xong |
| 12 | LiveBadge nhấp nháy + LiveAvatarBadge | Xong |
| 13 | Donation alert hiển thị trên màn hình live | Xong |
| 14 | TURN server fallback (Edge Function get-turn-credentials) | Xong |
| 15 | Heartbeat system + tự động dọn stream zombie | Xong |
| 16 | Đồng bộ viewer_count/peak_viewers vào DB | Xong |
| 17 | Sửa DonationAlert parser (Regex thay vì split) | Xong |

#### Sẽ triển khai (kế hoạch này)
| STT | Tính năng | Mức độ |
|-----|-----------|--------|
| 1 | Điều khiển streamer: bật/tắt mic, camera, chia sẻ màn hình | Trung bình |
| 2 | Chat moderation: xoá tin nhắn, cấm người dùng | Trung bình |
| 3 | Tự động kết nối lại cho viewer khi mất kết nối | Thấp |
| 4 | Mobile responsive cho LiveWatch và GoLive | Thấp |

#### Tính năng tương lai (chưa lên kế hoạch)
| STT | Tính năng | Độ khó |
|-----|-----------|--------|
| 1 | Xem trước thumbnail từ stream (canvas capture) | Thấp |
| 2 | Co-streaming (nhiều người phát sóng cùng lúc) | Cao |
| 3 | Chọn chất lượng stream (720p/480p/360p) | Cao |
| 4 | Thống kê chi tiết sau live (biểu đồ viewer, donation, chat) | Trung bình |
| 5 | Lên lịch phát sóng (scheduled livestream) | Trung bình |

