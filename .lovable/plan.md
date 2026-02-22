

## Sửa lỗi trang cá nhân chớp/load lại liên tục

### Nguyên nhân gốc

Vòng lặp vô hạn xảy ra theo chuỗi:

1. `SocialMediaOrbit` mount, phát hiện thiếu avatar MXH, gọi edge function `fetch-social-avatar`
2. Khi xong, gọi `onProfileUpdate()` -- chính là `fetchChannelAndProfile` trong Channel.tsx
3. `fetchChannelAndProfile` gọi `setLoading(true)` (dòng 177) -- hiển thị spinner "Đang tải..."
4. Spinner **unmount** toàn bộ `SocialMediaOrbit`, xóa biến `fetchTriggered.current`
5. Khi load xong, `SocialMediaOrbit` **mount lại** với `fetchTriggered.current = false`
6. Quay lại bước 1 -- lặp vô tận!

### Giải pháp

**File: `src/pages/Channel.tsx`** (dòng 175-177)

Tách biệt lần load đầu tiên (hiện spinner) và lần refresh sau đó (không hiện spinner):

- Thêm biến `initialLoadDone` dùng `useRef` để biết đã load xong lần đầu chưa
- Lần đầu: `setLoading(true)` bình thường
- Các lần sau (do `onProfileUpdate` gọi lại): **không gọi** `setLoading(true)`, chỉ cập nhật dữ liệu profile/channel mà không unmount component

```text
Trước:
  fetchChannelAndProfile() -> setLoading(true) -> unmount tất cả -> mount lại -> loop

Sau:
  fetchChannelAndProfile() -> chỉ setLoading(true) lần đầu -> các lần sau giữ UI ổn định
```

### Chi tiết kỹ thuật

| File | Thay doi |
|---|---|
| `src/pages/Channel.tsx` | Thêm `useRef(false)` cho `initialLoadDone`, chỉ `setLoading(true)` khi chưa load lần đầu |

