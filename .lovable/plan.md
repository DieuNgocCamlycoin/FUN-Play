

## Nguyên nhân VOD chỉ ghi được 6 giây

### Root cause

Trong `useMediaRecorder.ts` dòng 60, khi bắt đầu ghi, code thực hiện **`stream.clone()`** để tạo bản sao stream. Vấn đề:

- `MediaStream.clone()` tạo track mới nhưng **chung nguồn media gốc** với track ban đầu
- Khi streamer thực hiện bất kỳ thao tác nào thay đổi track (flip camera, screen share, hoặc thậm chí trình duyệt tự renegotiate), code gọi `oldVideoTrack.stop()` → **track clone cũng chết theo**
- MediaRecorder tiếp tục chạy nhưng **không nhận được data nữa** → chỉ ghi được vài giây đầu trước khi track bị thay đổi

Ngay cả khi không flip camera, một số trình duyệt/thiết bị có thể tự restart track nội bộ, khiến clone stream mất kết nối.

### Giải pháp

**Bỏ clone stream** + thêm method `replaceTrack` vào `useMediaRecorder` để cập nhật recording stream khi camera thay đổi.

---

### Thay đổi cụ thể

#### 1. `src/hooks/useMediaRecorder.ts`
- **Bỏ `stream.clone()`**, dùng stream gốc trực tiếp cho MediaRecorder
- Thêm method **`replaceVideoTrack(newTrack)`**: khi camera flip hoặc screen share, cập nhật track trong recording stream
- Khi track mới được add, MediaRecorder tiếp tục ghi mượt mà

#### 2. `src/hooks/useWebRTC.ts`  
- Hàm `flipCamera` và `toggleScreenShare`: sau khi thay track trên peer connections, gọi thêm callback (nếu có) để thông báo track mới cho recorder

#### 3. `src/pages/GoLive.tsx`
- Truyền `replaceVideoTrack` từ useMediaRecorder vào flow, gọi khi camera/screen thay đổi
- Hoặc đơn giản hơn: vì bỏ clone, recorder tự dùng `streamRef.current` → khi track thay đổi trên stream gốc, MediaRecorder tự nhận track mới

### Phương án đơn giản nhất

Chỉ cần sửa **1 dòng** trong `useMediaRecorder.ts`: thay `stream.clone()` → dùng `stream` trực tiếp, và bỏ `cleanupStream` (không cần stop track clone nữa, vì track gốc do WebRTC quản lý).

| File | Thay đổi |
|------|----------|
| `useMediaRecorder.ts` | Bỏ clone, dùng stream gốc, bỏ cleanupStream khi stop |
| `useWebRTC.ts` | Không đổi (track đã được add/remove trên streamRef.current) |
| `GoLive.tsx` | Không đổi |

