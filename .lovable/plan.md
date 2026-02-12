

# Sửa Mini Player: Không nghe được âm thanh trên mobile

## Nguyên nhân

Trình duyệt mobile (iOS Safari, Chrome Android) **chặn autoplay có âm thanh** nếu chưa có tương tác người dùng. Code hiện tại:

```text
// GlobalMiniPlayer.tsx dòng 36-40
if (isPlaying) {
  video.play().catch(() => {});  // <-- Lỗi bị nuốt im lặng!
}
```

Video gọi `play()` với `muted={false}` nhưng mobile browser chặn -> lỗi bị bắt bởi `.catch(() => {})` -> không có âm thanh, không có thông báo.

## Giải pháp

### File: `src/components/Video/GlobalMiniPlayer.tsx`

1. **Reliable Autoplay Pattern**: Thử play unmuted trước, nếu bị chặn thì tự mute + hiện nút "Bật âm thanh"
2. **Thêm nút Volume/Mute**: Cho phép user bật/tắt âm thanh trực tiếp trên mini player
3. **Thêm thanh progress có thể tương tác**: Hiển thị thời gian và tiến trình phát
4. **Cải thiện UI**: Theo đúng screenshot - hiện label "Đang phát", tên bài, channel, nút Audio, nút Play/Pause, nút Volume

### Chi tiết thay đổi:

```text
User nhấn minimize video
    |
    v
Mini Player hiện lên, thử play() unmuted
    |
    ├── Thành công -> Phát có âm thanh bình thường
    |
    └── Bị chặn (autoplay policy)
        |
        v
    Tự mute video, play() lại (muted)
        |
        v
    Hiện nút "Bật âm thanh" (tap to unmute)
        |
        v
    User tap -> unmute -> phát có tiếng
```

### Thay đổi UI cụ thể:
- Thêm state `isMuted` và `showUnmutePrompt`
- Thêm nút Volume (Volume2/VolumeX icon) bên cạnh nút Close
- Hiện badge "Nhấn để bật âm thanh" khi bị mute do autoplay policy
- Giữ nguyên swipe-to-dismiss, expand, progress bar hiện tại
- Thêm `playsInline` attribute (đã có) để tránh fullscreen trên iOS

## Chỉ 1 file cần sửa

| File | Thay đổi |
|------|----------|
| `src/components/Video/GlobalMiniPlayer.tsx` | Reliable autoplay pattern + nút volume + unmute prompt |

