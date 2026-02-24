

## Sửa lỗi: Link chia sẻ video luôn hiển thị thumbnail đúng

### Nguyên nhân gốc

Khi người dùng **copy link** (nút "Copy") trong ShareModal, link được copy là `https://play.fun.rich/username/slug` -- đây là link SPA. Khi dán vào Telegram/Facebook, crawler truy cập trực tiếp domain `play.fun.rich` và nhận được file `index.html` tĩnh với OG image mặc định (logo FUN Play).

Chỉ khi bấm nút share riêng (Telegram, Facebook...) thì link prerender mới được sử dụng.

### Giải pháp

Thay đổi link được **copy vào clipboard** và **hiển thị** trong ShareModal thành link prerender (edge function) cho nội dung video/music. Edge function này đã có sẵn logic:
- Bot/crawler: nhận HTML với đúng OG tags (thumbnail, title, description)
- Người dùng thường: tự động redirect về `play.fun.rich/...` qua JavaScript

Nhờ vậy, dù paste link ở đâu, preview đều hiển thị đúng thumbnail.

### Thay đổi kỹ thuật

**File: `src/components/Video/ShareModal.tsx`**

1. Thay đổi `handleCopyLink` để copy `prerenderUrl` thay vì `shareUrl` cho video/music/ai-music
2. Thay đổi phần hiển thị link trong giao diện (input box) để hiện `shareUrl` thân thiện nhưng copy `prerenderUrl`
3. Giữ nguyên `shareUrl` dạng `play.fun.rich/...` cho `og:url` (Telegram sẽ hiển thị domain đẹp)

Cụ thể:
- `handleCopyLink`: copy `prerenderUrl` thay vì `shareUrl`
- Phần input hiển thị: vẫn hiển thị `shareUrl` (đẹp, ngắn gọn) nhưng khi copy thì dùng `prerenderUrl`
- Native Share API: dùng `prerenderUrl`
- Các nút share platform: giữ nguyên (đã dùng `prerenderUrl`)

### Kết quả mong đợi

| Hành động | Trước | Sau |
|-----------|-------|-----|
| Copy link + paste vào Telegram | Hiện logo FUN Play mặc định | Hiện thumbnail + title đúng của video |
| Bấm nút share Telegram | Hiện thumbnail đúng | Giữ nguyên, vẫn đúng |
| Người dùng click link | Mở trang video | Vẫn mở trang video (redirect tự động) |

| Tệp | Thay đổi |
|------|---------|
| `src/components/Video/ShareModal.tsx` | Copy link và Native Share dùng `prerenderUrl` thay vì `shareUrl` |

