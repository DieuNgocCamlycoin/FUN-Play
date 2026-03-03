

## Tính năng Livestream cho FUN PLAY

### Tổng quan

Xây dựng hệ thống livestream P2P (WebRTC) cho phép người dùng phát sóng trực tiếp, tương tác chat/reaction, nhận tặng thưởng CAMLY, và lưu lại bản ghi sau khi kết thúc.

---

### Giai đoạn 1: Database & Backend

#### Bảng `livestreams`
- `id`, `user_id`, `title`, `description`, `thumbnail_url`
- `status`: draft / live / ended
- `started_at`, `ended_at`
- `viewer_count` (realtime), `peak_viewers`
- `total_donations` (CAMLY nhận được trong live)
- `vod_video_id` (link tới bảng `videos` sau khi kết thúc)
- `category` (music, light_meditation, sound_therapy, mantra)
- RLS: Ai cũng xem được livestream đang live, chỉ chủ sở hữu tạo/cập nhật

#### Bảng `livestream_chat`
- `id`, `livestream_id`, `user_id`, `content`, `message_type` (text/donation/system)
- `created_at`
- Bật Realtime để chat cập nhật tức thì
- RLS: Authenticated users gửi tin, ai cũng đọc được

#### Bảng `livestream_reactions`
- `id`, `livestream_id`, `user_id`, `emoji`, `created_at`
- Bật Realtime cho hiệu ứng reaction bay lên màn hình

#### Thông báo
- Trigger: Khi `livestreams.status` chuyển sang `live`, tự động tạo notification cho tất cả subscriber của channel đó

---

### Giai đoạn 2: WebRTC Livestream Engine

#### Kiến trúc P2P
- **Streamer**: Capture camera/mic via `navigator.mediaDevices.getUserMedia()`
- **Signaling Server**: Edge Function `livestream-signal` sử dụng Supabase Realtime channels làm signaling (trao đổi SDP offer/answer và ICE candidates)
- **Viewers**: Kết nối P2P tới streamer qua RTCPeerConnection
- **Giới hạn**: ~50-100 viewers đồng thời (phù hợp giai đoạn đầu)

#### Luồng hoạt động
```text
Streamer                    Supabase Realtime              Viewer
   |                              |                          |
   |-- Tao livestream (draft) --> |                          |
   |-- Bat camera/mic ---------->|                          |
   |-- Status = "live" --------->|-- Notification --------->|
   |                              |<-- Join request ---------|
   |<-- SDP Offer/Answer ------->|<-- SDP Exchange -------->|
   |<-- ICE Candidates --------->|<-- ICE Exchange -------->|
   |========= Video Stream (P2P) =========================>|
   |                              |<-- Chat/Reaction --------|
   |-- Ket thuc live ----------->|                          |
```

---

### Giai đoạn 3: Giao dien (UI)

#### Trang "Go Live" (`/go-live`)
- Form: Tieu de, mo ta, chon category, thumbnail
- Preview camera truoc khi phat
- Nut "Bat dau phat song" (do, noi bat)
- Dashboard nho: so nguoi xem, thoi gian phat, tong donation

#### Trang xem Live (`/live/:id`)
- Video player toan man hinh (nhan stream WebRTC)
- Live chat panel ben phai (giong Facebook Live)
- Reaction bay len man hinh (emoji animation)
- Nut tang thuong CAMLY (tai su dung `EnhancedDonateModal`)
- Badge "LIVE" do nhap nhay
- So nguoi xem realtime

#### Trang danh sach Live (`/live`)
- Grid cac livestream dang dien ra
- Thumbnail + tieu de + ten streamer + so nguoi xem
- Badge "LIVE" tren moi card
- Sap xep theo so nguoi xem giam dan

#### Tich hop vao giao dien hien tai
- Them nut "Go Live" trong Studio/Channel
- Hien thi badge "LIVE" tren avatar streamer o trang chu
- Tab "Live" trong thanh navigation

---

### Giai đoạn 4: Tang thuong CAMLY khi Live

- Tai su dung he thong donation hien tai (`donation_transactions`)
- Context type = `livestream`, context_id = livestream_id
- Hieu ung tang thuong hien thi tren man hinh live (ten nguoi tang + so CAMLY)
- Tin nhan donation tu dong gui vao livestream_chat

---

### Giai đoạn 5: Luu lai ban ghi (VOD)

- Su dung `MediaRecorder API` de ghi lai stream phia streamer
- Khi ket thuc live, upload file video len storage (R2)
- Tu dong tao ban ghi trong bang `videos` voi `source = 'livestream'`
- Link nguoc lai: `livestreams.vod_video_id = videos.id`
- Nguoi xem co the xem lai nhu video thuong

---

### File can tao moi

| File | Mo ta |
|------|-------|
| `src/pages/GoLive.tsx` | Trang phat song |
| `src/pages/LiveWatch.tsx` | Trang xem live |
| `src/pages/LiveDirectory.tsx` | Danh sach cac live dang dien ra |
| `src/components/Live/LivePlayer.tsx` | Component nhan & hien thi stream |
| `src/components/Live/LiveChat.tsx` | Chat realtime trong live |
| `src/components/Live/LiveReactions.tsx` | Hieu ung reaction bay |
| `src/components/Live/LiveDonationAlert.tsx` | Hien thi thong bao donation |
| `src/components/Live/GoLiveForm.tsx` | Form cau hinh truoc khi live |
| `src/components/Live/LiveCard.tsx` | Card hien thi trong danh sach |
| `src/components/Live/LiveBadge.tsx` | Badge "LIVE" nhap nhay |
| `src/hooks/useWebRTC.ts` | Hook quan ly WebRTC connections |
| `src/hooks/useLiveChat.ts` | Hook quan ly chat realtime |
| `src/hooks/useLivestream.ts` | Hook CRUD livestream |
| `supabase/functions/livestream-signal/index.ts` | Signaling server |
| Migration SQL | Tao bang livestreams, livestream_chat, livestream_reactions |

### File can cap nhat

| File | Mo ta |
|------|-------|
| `src/App.tsx` | Them routes /go-live, /live, /live/:id |
| `src/components/Layout/*` | Them tab/nut Live trong navigation |
| `src/components/Studio/*` | Them nut "Go Live" |

---

### Ghi chu ky thuat

- **WebRTC STUN/TURN**: Su dung Google STUN server mien phi (`stun:stun.l.google.com:19302`). Neu can TURN server cho mang phuc tap, se can dich vu ben ngoai (Metered, Xirsys)
- **Gioi han P2P**: Moi viewer tao 1 ket noi rieng toi streamer. Streamer can bang thong upload tot. Gioi han thuc te ~30-50 viewers tren mang binh thuong
- **VOD**: MediaRecorder ghi file WebM, sau do upload len R2 storage
- **Realtime**: Su dung Supabase Realtime channels cho signaling, chat va reactions (khong can WebSocket server rieng)

