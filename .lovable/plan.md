

# Redesign Mini Player theo kiểu YouTube + Sửa lỗi âm thanh

## Vấn đề hiện tại

### 1. Giao diện không giống YouTube
Mini player hiện tại là **ô vuông nhỏ 176px ở góc phải** với video trên, controls dưới. YouTube mobile dùng **thanh ngang full-width ở đáy màn hình** với thumbnail bên trái, thông tin + controls bên phải.

### 2. Không nghe được âm thanh
Hàm `attemptPlay` luôn reset `video.muted = false` mỗi lần `isPlaying` thay đổi, khiến trình duyệt mobile liên tục chặn autoplay. Khi user đã bấm unmute rồi nhưng pause/play lại thì bị mute lại.

## Giải pháp

### File: `src/components/Video/GlobalMiniPlayer.tsx` (viết lại)

**Layout mới theo YouTube:**
```text
+----------------------------------------------------------+
| [Thumbnail] | Đang phát              | [^] [><] [X]      |
|  60x34px    | CHA LUON TRONG TIM...  |                    |
|             | Angle Vinh Nguyen...   |                    |
+========== progress bar (full width) =====================+
| [Audio]     [<<] [ Play/Pause ] [>>]         [Volume]    |
+----------------------------------------------------------+
```

- Thanh ngang full-width, fixed ở bottom (trên bottom nav)
- Thumbnail bên trái, thông tin ở giữa, nút expand/close bên phải
- Progress bar spanning full width
- Hàng controls phía dưới: Audio label, play/pause lớn, volume

**Sửa lỗi âm thanh:**
- Tách biệt logic autoplay khỏi play/pause toggle
- Chỉ chạy autoplay pattern (muted fallback) lần đầu video được load
- Khi user đã tương tác (tap play/unmute), giữ trạng thái muted/unmuted ổn định
- Dùng ref `userHasInteracted` để track và không reset mute state sau tương tác

### Chi tiết kỹ thuật:

**Thay đổi chính:**
1. Layout từ vertical card 176px -> horizontal bar full-width (`left-2 right-2 bottom-[72px]`)
2. Thumbnail tĩnh thay vì video element cho phần hiển thị (tiết kiệm tài nguyên)
3. Video element ẩn (chỉ phát audio), dùng thumbnail cho hình ảnh
4. Fix autoplay: thêm `userInteractedRef` để không reset mute sau khi user đã bấm
5. Hiển thị thời gian (mm:ss) cho currentTime
6. Nút play/pause to hơn, nổi bật hơn với gradient background
7. Giữ nguyên swipe-to-dismiss

## Chỉ 1 file cần sửa

| File | Thay đổi |
|------|----------|
| `src/components/Video/GlobalMiniPlayer.tsx` | Redesign layout YouTube-style + fix audio autoplay logic |

