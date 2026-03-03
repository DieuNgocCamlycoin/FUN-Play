

## Kế hoạch sửa 3 vấn đề nghiêm trọng của Livestream

---

### Vấn đề 1: TURN Server

**Hiện tại:** Chỉ dùng Google STUN servers. Khi streamer/viewer ở sau symmetric NAT hoặc firewall nghiêm ngặt, kết nối P2P sẽ thất bại (không có fallback).

**Giải pháp:** Thêm TURN server vào ICE configuration trong `useWebRTC.ts`.

- Sử dụng dịch vụ TURN miễn phí hoặc tự host (VD: Metered.ca cung cấp free tier)
- Lưu TURN credentials vào Edge Function secret, tạo edge function `get-turn-credentials` trả về thông tin TURN cho client
- Client gọi edge function khi khởi tạo peer connection để lấy ICE servers động (bao gồm cả STUN + TURN)
- Fallback: Nếu edge function lỗi, vẫn dùng STUN mặc định

**File thay đổi:**
- Tạo `supabase/functions/get-turn-credentials/index.ts` — trả về TURN config từ secrets
- Cập nhật `src/hooks/useWebRTC.ts` — gọi edge function lấy ICE servers trước khi tạo RTCPeerConnection

---

### Vấn đề 2: Heartbeat System (Tự động kết thúc live khi mất kết nối)

**Hiện tại:** Nếu streamer đóng tab hoặc mất mạng, livestream vẫn ở trạng thái `live` vĩnh viễn trong database. Viewer thấy trạng thái "đang live" nhưng không nhận được stream.

**Giải pháp:** Hệ thống heartbeat 3 lớp:

**Lớp 1 — Client heartbeat (Streamer):**
- Mỗi 15 giây, streamer gửi `UPDATE livestreams SET last_heartbeat_at = now()`
- Thêm cột `last_heartbeat_at` vào bảng `livestreams`

**Lớp 2 — Database cleanup (Edge Function):**
- Tạo edge function `livestream-cleanup` chạy định kỳ
- Logic: Tìm tất cả livestreams có `status = 'live'` và `last_heartbeat_at < now() - interval '45 seconds'`, cập nhật `status = 'ended'`
- Viewer khi kết nối cũng kiểm tra `last_heartbeat_at` — nếu quá cũ thì hiện "Stream đã kết thúc"

**Lớp 3 — beforeunload event:**
- Khi streamer đóng tab, bắt sự kiện `beforeunload` để gọi `endLive()` (best effort, không đảm bảo 100%)

**File thay đổi:**
- Migration: Thêm cột `last_heartbeat_at` vào `livestreams`
- Cập nhật `src/hooks/useWebRTC.ts` (useWebRTCStreamer) — thêm heartbeat interval mỗi 15s
- Cập nhật `src/pages/GoLive.tsx` — thêm beforeunload handler
- Tạo `supabase/functions/livestream-cleanup/index.ts` — tìm và kết thúc các stream "zombie"
- Cập nhật `src/pages/LiveWatch.tsx` — kiểm tra heartbeat trước khi kết nối

---

### Vấn đề 3: Đồng bộ Viewer Count

**Hiện tại:** `viewer_count` trong database không được cập nhật. `viewerCount` chỉ là số peer connections local của streamer (`peersRef.current.size`), không đồng bộ vào DB. `peak_viewers` dùng logic `count` thay vì `GREATEST`.

**Giải pháp:** Hệ thống viewer tracking chính xác:

**Phía Streamer:**
- Khi `peersRef.current.size` thay đổi (thêm/xóa peer), gọi `updateViewerCount` để cập nhật DB
- Sử dụng `GREATEST(peak_viewers, $count)` trong SQL để chỉ tăng `peak_viewers`, không giảm

**Phía Viewer:**
- Khi viewer rời đi (disconnect/beforeunload), giảm `viewer_count` -1

**Cập nhật SQL:**
- Tạo DB function `update_livestream_viewers` dùng `GREATEST` cho `peak_viewers`

**File thay đổi:**
- Migration: Tạo DB function `update_livestream_viewers`
- Cập nhật `src/hooks/useLivestream.ts` — sửa `updateViewerCount` dùng RPC thay vì update trực tiếp
- Cập nhật `src/hooks/useWebRTC.ts` (useWebRTCStreamer) — gọi `updateViewerCount` khi peers thay đổi
- Cập nhật `src/hooks/useWebRTC.ts` (useWebRTCViewer) — thêm beforeunload giảm viewer count

---

### Sửa kèm: DonationAlert parse sai format

**Hiện tại:** `LiveDonationAlert` dùng `split("|")` để parse nội dung donation nhưng chat message gửi dạng text thuần, dẫn đến amount luôn = 0.

**Giải pháp:** Chuẩn hoá format donation message khi gửi vào chat, và cập nhật parser cho khớp.

---

### Thứ tự thực hiện

| Thứ tự | Công việc | Độ khó |
|--------|-----------|--------|
| 1 | Migration: thêm `last_heartbeat_at` + DB function `update_livestream_viewers` | Thấp |
| 2 | Heartbeat system (client + cleanup edge function) | Trung bình |
| 3 | Đồng bộ viewer count (streamer cập nhật DB khi peers thay đổi) | Trung bình |
| 4 | TURN server (edge function + cập nhật ICE config) | Trung bình |
| 5 | beforeunload handlers (GoLive + LiveWatch) | Thấp |
| 6 | Sửa DonationAlert parser | Thấp |

---

### Bảng tổng kết tính năng Livestream

#### Đã có (hoàn thành)
| STT | Tính năng | Trạng thái |
|-----|-----------|------------|
| 1 | Database: bảng livestreams, livestream_chat, livestream_reactions với RLS | Xong |
| 2 | WebRTC P2P signaling qua Supabase Realtime broadcast | Xong |
| 3 | Trang GoLive (thiết lập -> xem trước -> phát sóng) | Xong |
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

#### Vấn đề cần khắc phục (kế hoạch này)
| STT | Vấn đề | Mức độ | Trạng thái |
|-----|--------|--------|------------|
| 1 | Chỉ có STUN, thiếu TURN server — kết nối thất bại trên nhiều mạng | Nghiêm trọng | Sẽ sửa |
| 2 | Không có heartbeat — stream "zombie" vĩnh viễn trong DB | Nghiêm trọng | Sẽ sửa |
| 3 | viewer_count/peak_viewers không đồng bộ vào DB | Nghiêm trọng | Sẽ sửa |
| 4 | DonationAlert parse sai format (amount luôn = 0) | Trung bình | Sẽ sửa kèm |

#### Tính năng cần nâng cấp (tương lai)
| STT | Tính năng | Độ khó |
|-----|-----------|--------|
| 1 | Điều khiển streamer: bật/tắt mic, camera, chia sẻ màn hình | Trung bình |
| 2 | Quản lý chat: xoá tin nhắn, cấm người dùng khỏi phòng chat | Trung bình |
| 3 | Giao diện mobile responsive cho trang xem live | Thấp |
| 4 | Tự động kết nối lại cho viewer khi mất kết nối | Trung bình |
| 5 | Xem trước thumbnail từ stream (canvas capture) | Thấp |
| 6 | Co-streaming (nhiều người phát sóng cùng lúc) | Cao |
| 7 | Chọn chất lượng stream (720p/480p/360p) | Cao |

