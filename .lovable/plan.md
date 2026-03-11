

## Đánh giá Livestream trên Mobile & Tablet

### Kết quả kiểm tra: 5 vấn đề cần sửa

---

### 1. Không có nút đổi camera trước/sau (Mobile) — **Quan trọng**

Mobile có 2 camera (front/back) nhưng hiện tại chỉ dùng `facingMode: "user"` cố định. Cần thêm nút **Flip Camera** trong `StreamerControls` và gọi lại `getUserMedia` với `facingMode: "environment"`.

**Thay đổi:** `useWebRTC.ts` (thêm `flipCamera`), `StreamerControls.tsx` (thêm nút), chỉ hiện trên mobile.

---

### 2. Nút Screen Share hiện trên Mobile nhưng không hoạt động — **Trung bình**

`getDisplayMedia()` không được hỗ trợ trên hầu hết trình duyệt mobile. Nút vẫn hiện → user bấm → lỗi.

**Thay đổi:** `StreamerControls.tsx` — ẩn nút Screen Share trên mobile (dùng `useIsMobile` hoặc check `navigator.mediaDevices.getDisplayMedia`).

---

### 3. Nút Moderation (Xóa/Ban) dùng `group-hover` — không hoạt động trên Touch — **Trung bình**

`hidden group-hover:flex` trong `LiveChat.tsx` ChatBubble không bao giờ hiện trên màn hình cảm ứng vì không có hover.

**Thay đổi:** `LiveChat.tsx` — Thay bằng long-press hoặc hiện luôn icon nhỏ cho streamer trên mobile. Đơn giản nhất: dùng `@media (hover: none)` hoặc luôn hiện trên touch devices.

---

### 4. MediaRecorder trên iOS Safari — **Quan trọng**

iOS Safari (trước 17.1) không hỗ trợ `MediaRecorder` hoặc chỉ hỗ trợ `video/mp4`. Danh sách MIME hiện tại ưu tiên webm → có thể fail trên iOS.

**Thay đổi:** `useMediaRecorder.ts` — đã có `"video/mp4"` trong MIME_CANDIDATES nhưng đứng cuối. Cần đẩy lên trước cho iOS. Thêm fallback message rõ ràng hơn nếu MediaRecorder không khả dụng.

---

### 5. Layout Chat panel trên Tablet — **Nhỏ**

Chat panel dùng `h-[60vh]` trên GoLive và `h-[50vh]` trên LiveWatch khi mobile. Trên tablet landscape (768-1024px) vẫn stack dọc → lãng phí không gian.

**Thay đổi:** `GoLive.tsx` và `LiveWatch.tsx` — thêm breakpoint `md:grid-cols-3` cho tablet landscape.

---

### Kế hoạch thực hiện

| # | Task | Files |
|---|------|-------|
| 1 | Thêm Flip Camera cho mobile | `useWebRTC.ts`, `StreamerControls.tsx` |
| 2 | Ẩn Screen Share trên mobile | `StreamerControls.tsx` |
| 3 | Fix moderation buttons cho touch | `LiveChat.tsx` |
| 4 | Tối ưu MediaRecorder cho iOS | `useMediaRecorder.ts` |
| 5 | Cải thiện layout tablet | `GoLive.tsx`, `LiveWatch.tsx` |

Tổng cộng sửa ~6 files, không ảnh hưởng logic WebRTC hay VOD flow hiện tại.

