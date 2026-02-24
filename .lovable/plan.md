
Mình đã khoanh đúng nguyên nhân gây lỗi “bấm phát được ~1 giây rồi tự dừng”.

## Chẩn đoán nhanh

- Triệu chứng user báo: video phát được 1s rồi pause.
- Mình đã đối chiếu các file liên quan:
  - `src/components/Video/EnhancedVideoPlayer.tsx`
  - `src/components/Video/GlobalVideoPlayer.tsx`
  - `src/contexts/MusicPlayerContext.tsx`
  - `src/components/BackgroundMusicPlayer.tsx`
  - `src/pages/Watch.tsx`
- Điểm lỗi nằm ở **`src/pages/Watch.tsx`**, không phải ở `togglePlay` của player nữa.

## Nguyên nhân gốc (root cause)

Trong `Watch.tsx` có effect “Enable global playback when navigating away”:

- Effect này có dependency: `[video, isPlaying, currentTime, duration]`
- Vì `currentTime` cập nhật liên tục khi video đang chạy, React sẽ:
  1) chạy cleanup effect cũ
  2) rồi chạy effect mới
- Cleanup hiện tại lại dispatch:
  - `startGlobalPlayback`
  - bên `GlobalVideoPlayer` nhận event và gọi `requestPlayback("global-video")`
  - event này gửi yêu cầu pause tất cả source khác, bao gồm `EnhancedVideoPlayer` (`source = "video"`)

Kết quả: video trang Watch vừa play được 1 nhịp timeupdate thì bị source global yêu cầu pause, đúng pattern “1 giây là dừng”.

## Do I know what the issue is?

**Yes.** Lỗi là do cleanup của `useEffect` trong `Watch.tsx` đang bị kích hoạt lặp theo dependency thay vì chỉ khi rời trang/unmount.

## Kế hoạch sửa

### 1) Sửa effect global playback trong `Watch.tsx` để chỉ chạy khi unmount/rời Watch thật sự
- Chuyển sang pattern:
  - 1 effect cập nhật `refs` chứa giá trị mới nhất: `video`, `isPlaying`, `currentTime`, `duration`
  - 1 effect cleanup với dependency tối thiểu (hoặc `[]`) để cleanup chỉ chạy khi unmount
- Trong cleanup:
  - chỉ dispatch `startGlobalPlayback` nếu snapshot hợp lệ:
    - có `video`
    - `isPlaying === true`
    - `currentTime > 0`
- Tránh cleanup chạy lại mỗi lần `currentTime` đổi.

### 2) Thêm guard điều kiện route trước khi phát global player
- Trước khi dispatch `startGlobalPlayback`, kiểm tra đang rời khỏi trang watch (không phải re-render nội bộ).
- Mục tiêu: không bật GlobalVideoPlayer khi vẫn đang ở chính trang watch.

### 3) Giữ nguyên cơ chế Mutual Exclusion hiện tại
- `mediaSessionManager.ts` không cần đổi kiến trúc.
- Logic pause chéo video/music hiện tại đúng; lỗi đến từ trigger sai thời điểm ở Watch page.

### 4) Kiểm tra hồi quy (regression checks)
Sau khi sửa sẽ test đủ các flow:
1. Mở watch page → bấm play: video phải chạy liên tục, không tự pause sau 1s.
2. Khi video đang phát, bật music player: video pause đúng.
3. Khi music đang phát, bấm play video: music pause đúng.
4. Rời watch page khi video đang phát: global player xuất hiện và tiếp tục từ đúng thời điểm.
5. Quay lại watch page: không tạo vòng pause qua lại giữa watch/global.

## Files sẽ chỉnh
- `src/pages/Watch.tsx` (trọng tâm, sửa lifecycle effect gây pause sau 1 giây)

## Rủi ro & cách kiểm soát
- Rủi ro: mất tính năng continue-play khi rời trang.
- Kiểm soát: dùng ref snapshot + cleanup unmount-only + test đầy đủ 5 luồng phía trên.

Sau khi bạn approve plan này, mình sẽ sửa ngay đúng file `Watch.tsx` để dứt điểm lỗi “play 1s rồi dừng”.
