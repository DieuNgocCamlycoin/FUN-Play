

## Rà soát Video Player — Báo cáo & Kế hoạch khắc phục

### Kiến trúc hiện tại

| Thiết bị | Player component | Nơi sử dụng |
|----------|-----------------|-------------|
| PC/Desktop | `EnhancedVideoPlayer` | `Watch.tsx` (khi `!isMobile`) |
| Mobile | `YouTubeMobilePlayer` | `MobileWatchView` → `Watch.tsx` (khi `isMobile`) |
| Tablet | `EnhancedVideoPlayer` | Breakpoint 768px+ → dùng desktop layout |
| Global mini | `GlobalVideoPlayer` | Phát nền khi rời trang Watch |
| Legacy mobile | `MobileVideoPlayer` | **Không được sử dụng** ở đâu trong flow chính |

### Bảng đánh giá

```text
┌──────────────────────────────────┬──────┬────────┬────────┐
│ Tính năng                        │  PC  │ Mobile │ Tablet │
├──────────────────────────────────┼──────┼────────┼────────┤
│ Phát / Dừng video                │  ✅  │  ✅   │  ✅   │
│ Đồng bộ state (play/pause event) │  ✅  │  ✅   │  ✅   │
│ Autoplay                         │  ✅  │  ⚠️   │  ✅   │
│ Xử lý autoplay thất bại         │  ❌  │  ✅   │  ❌   │
│ Fullscreen                       │  ✅  │  ⚠️   │  ✅   │
│ iOS Fullscreen (Safari)          │  N/A │  ❌   │  ❌   │
│ Double-click/tap tua 10s         │  ✅  │  ✅   │  ✅   │
│ Keyboard shortcuts               │  ✅  │  N/A  │  ✅   │
│ PiP (Picture-in-Picture)         │  ✅  │  N/A  │  ✅   │
│ Progress bar + chapters          │  ✅  │  ✅   │  ✅   │
│ Ambient mode                     │  ✅  │  ✅   │  ✅   │
│ View reward tracking             │  ✅  │  ✅   │  ✅   │
│ Global mini player               │  ✅  │  ✅   │  ✅   │
│ Duration auto-fix (trùng lặp)    │  ⚠️  │  ⚠️   │  ⚠️   │
└──────────────────────────────────┴──────┴────────┴────────┘
```

### Chi tiết vấn đề

#### 1. iOS Safari Fullscreen không hoạt động (❌ High — Mobile + Tablet)

Cả `EnhancedVideoPlayer` và `YouTubeMobilePlayer` dùng `container.requestFullscreen()`. iOS Safari **không hỗ trợ Fullscreen API trên container** — chỉ hỗ trợ `video.webkitEnterFullscreen()` trực tiếp trên phần tử video.

**Sửa:** Trong `toggleFullscreen`, thêm fallback:
```
if (video.webkitEnterFullscreen) video.webkitEnterFullscreen()
```

**Files:** `EnhancedVideoPlayer.tsx`, `YouTubeMobilePlayer.tsx`

#### 2. Desktop/Tablet không có overlay khi autoplay thất bại (❌ Medium)

`YouTubeMobilePlayer` có `autoplayFailed` state → hiện nút Play lớn. Nhưng `EnhancedVideoPlayer` (dùng trên PC + tablet) chỉ log `"Autoplay prevented"` mà **không hiện UI** nào cho user nhấn play. Trên tablet (đặc biệt iPad), autoplay thường bị chặn.

**Sửa:** Thêm state `autoplayFailed` + overlay nút Play vào `EnhancedVideoPlayer.tsx`, tương tự logic đã có ở YouTubeMobilePlayer.

**File:** `EnhancedVideoPlayer.tsx`

#### 3. Duration auto-fix chạy trùng lặp (⚠️ Low)

`Watch.tsx` tạo một `<video>` element ẩn chỉ để check duration (dòng 281-303). `YouTubeMobilePlayer` cũng tự fix duration trong `onLoadedMetadata` (dòng 471-483). Trên mobile, cả hai đều chạy → query DB 2 lần.

**Sửa:** Bỏ logic tạo video element ẩn trong `Watch.tsx`. Để player component (đã load video) tự fix trong `onLoadedMetadata` — hiện cả `EnhancedVideoPlayer` chưa có logic này, cần thêm.

**Files:** `Watch.tsx`, `EnhancedVideoPlayer.tsx`

#### 4. `MobileVideoPlayer.tsx` — Dead code (⚠️ Low)

Component này không được import/sử dụng ở flow nào. Nó có bug `togglePlay` (set state thủ công thay vì dùng events). Nên xóa để tránh nhầm lẫn.

**File:** Xóa `MobileVideoPlayer.tsx`

---

### Kế hoạch thực hiện

| # | Task | Priority | Files |
|---|------|----------|-------|
| 1 | Thêm iOS Safari fullscreen fallback | High | `EnhancedVideoPlayer.tsx`, `YouTubeMobilePlayer.tsx` |
| 2 | Thêm autoplay-failed overlay cho desktop/tablet | Medium | `EnhancedVideoPlayer.tsx` |
| 3 | Gom logic duration auto-fix, bỏ trùng lặp | Low | `Watch.tsx`, `EnhancedVideoPlayer.tsx` |
| 4 | Xóa MobileVideoPlayer.tsx (dead code) | Low | `MobileVideoPlayer.tsx` |

