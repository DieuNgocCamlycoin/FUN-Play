

## Báo cáo tổng hợp: Khả năng hoạt động Livestream trên PC / Mobile / Tablet

---

### Tổng quan hệ thống

Livestream gồm **14 files chính**: 9 components (`src/components/Live/*`), 3 hooks (`useWebRTC`, `useLivestream`, `useMediaRecorder`), 3 pages (`GoLive`, `LiveWatch`, `LiveDirectory`), và entry point mobile (`MobileUploadFlow`).

---

### Bảng đánh giá theo thiết bị

```text
┌─────────────────────────────┬──────┬────────┬────────┐
│ Tính năng                   │  PC  │ Mobile │ Tablet │
├─────────────────────────────┼──────┼────────┼────────┤
│ Truy cập /go-live trực tiếp │  ✅  │  ✅   │  ✅   │
│ Truy cập từ MobileUpload    │  N/A │  ❌   │  ❌   │
│ Bật camera (getUserMedia)   │  ✅  │  ⚠️   │  ⚠️   │
│ Xem preview trước phát sóng │  ✅  │  ⚠️   │  ⚠️   │
│ Phát sóng (WebRTC P2P)      │  ✅  │  ✅   │  ✅   │
│ Flip camera trước/sau       │  N/A │  ⚠️   │  ⚠️   │
│ Chia sẻ màn hình            │  ✅  │  ✅*  │  ✅*  │
│ Xem livestream (Viewer)     │  ✅  │  ⚠️   │  ✅   │
│ Chat trực tiếp              │  ✅  │  ✅   │  ✅   │
│ Reactions (emoji)           │  ✅  │  ✅   │  ✅   │
│ Tặng CAMLY (Donate)         │  ✅  │  ✅   │  ✅   │
│ Ghi VOD (MediaRecorder)     │  ✅  │  ⚠️   │  ⚠️   │
│ Layout responsive           │  ✅  │  ✅   │  ✅   │
│ Moderation (Xóa/Ban)        │  ✅  │  ✅   │  ✅   │
└─────────────────────────────┴──────┴────────┴────────┘

✅ = Hoạt động    ⚠️ = Có lỗi/giới hạn    ❌ = Không hoạt động
* Ẩn đúng trên mobile nhưng logic check chưa chặt trên một số tablet
```

---

### Chi tiết 7 vấn đề cần khắc phục

#### 1. MobileUploadFlow không điều hướng đến /go-live (❌ Critical)

**Vấn đề:** Khi user nhấn tab "Trực tiếp" trong MobileUploadFlow, code chỉ `setSelectedType("live")` nhưng vẫn hiển thị `VideoGalleryPicker`. Không có logic nào chuyển đến `/go-live`.

**File:** `MobileUploadFlow.tsx` dòng 441
**Sửa:** Khi `type.id === "live"`, gọi `handleClose()` + `navigate("/go-live")` thay vì `setSelectedType`.

---

#### 2. Camera constraints quá nghiêm ngặt (⚠️ High)

**Vấn đề:** `startCamera` dùng `{ width: 1280, height: 720 }` cố định. Nhiều điện thoại không hỗ trợ chính xác resolution này → `getUserMedia` reject → camera không bật → toàn bộ flow dừng.

**File:** `useWebRTC.ts` dòng 45 và dòng 136
**Sửa:** Đổi sang `{ width: { ideal: 1280 }, height: { ideal: 720 } }` cho cả `startCamera` và `flipCamera`.

---

#### 3. iOS Safari video autoplay bị chặn (⚠️ High)

**Vấn đề:** `LivePlayer` set `srcObject` nhưng không gọi `.play()` thủ công. iOS Safari thường chặn autoplay ngay cả với `muted` + `playsInline`.

**File:** `LivePlayer.tsx` dòng 17-21
**Sửa:** Thêm `videoRef.current.play().catch(() => {})` sau khi set `srcObject`.

---

#### 4. flipCamera cũng dùng constraints cứng (⚠️ Medium)

**Vấn đề:** Tương tự issue #2, `flipCamera` ở dòng 136 dùng `width: 1280, height: 720` cố định.

**File:** `useWebRTC.ts` dòng 136
**Sửa:** Cùng fix với issue #2, dùng `ideal`.

---

#### 5. Screen Share button hiện trên tablet nhưng có thể không hoạt động (⚠️ Low)

**Vấn đề:** `StreamerControls` check `!isMobile` (breakpoint 768px), nhưng nhiều tablet ở landscape > 768px → hiện nút Screen Share → `getDisplayMedia` có thể fail trên tablet browsers.

**File:** `StreamerControls.tsx` dòng 70
**Sửa:** Ngoài `!isMobile`, thêm check `supportsScreenShare` (đã có) là đủ — cần đảm bảo nút ẩn khi API không khả dụng, bất kể breakpoint.

---

#### 6. Không có error handling khi camera bị từ chối quyền (⚠️ Medium)

**Vấn đề:** `startCamera` throw error nhưng `handleFormSubmit` chỉ hiện toast generic. Trên mobile, user thường deny permission → cần hướng dẫn rõ ràng hơn (mở Settings).

**File:** `GoLive.tsx` dòng 58
**Sửa:** Phân loại lỗi: `NotAllowedError` → hướng dẫn cấp quyền, `NotFoundError` → thiết bị không có camera, `OverconstrainedError` → tự retry với constraints thấp hơn.

---

#### 7. Viewer video trên iOS không tự phát (⚠️ Medium)

**Vấn đề:** Tương tự issue #3, viewer nhận `remoteStream` qua WebRTC nhưng video không tự play trên iOS.

**File:** `LivePlayer.tsx` — cùng fix với issue #3.

---

### Kế hoạch thực hiện

| # | Task | Priority | Files |
|---|------|----------|-------|
| 1 | Điều hướng "Trực tiếp" → /go-live trên mobile | Critical | `MobileUploadFlow.tsx` |
| 2 | Đổi camera constraints sang `ideal` | High | `useWebRTC.ts` |
| 3 | Thêm `.play().catch()` cho iOS autoplay | High | `LivePlayer.tsx` |
| 4 | Phân loại lỗi camera với hướng dẫn cụ thể | Medium | `GoLive.tsx` |
| 5 | Đảm bảo Screen Share ẩn đúng trên tablet | Low | `StreamerControls.tsx` |

Tổng: sửa **5 files**, thay đổi nhỏ, không ảnh hưởng logic WebRTC/VOD/Chat hiện tại.

