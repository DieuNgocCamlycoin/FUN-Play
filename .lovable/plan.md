

# Sửa lỗi: Click video trên trang cá nhân không xem được

## Nguyên nhân

Trong `VideoCard.tsx`, khi click vào thumbnail, hàm `handlePlay` được gọi:

```text
const handlePlay = () => {
  lightTap();
  if (onPlay && videoId) {
    onPlay(videoId);  // Chỉ gọi callback nếu có prop onPlay
  }
  // Nếu KHÔNG có onPlay -> KHÔNG làm gì cả!
};
```

`ProfileVideosTab.tsx` render `VideoCard` mà KHÔNG truyền prop `onPlay`, nên click vào video không dẫn tới trang xem video.

## Sửa lỗi

**File: `src/components/Video/VideoCard.tsx`**

Thêm fallback navigation khi không có `onPlay` prop: nếu `onPlay` không được truyền vào, tự động navigate tới `/watch/${videoId}`.

```text
const handlePlay = () => {
  lightTap();
  if (onPlay && videoId) {
    onPlay(videoId);
  } else if (videoId) {
    navigate(`/watch/${videoId}`);  // Fallback: navigate trực tiếp
  }
};
```

Thay doi chi 1 dong, dam bao tat ca VideoCard trong app deu hoat dong dung - ca khi co onPlay callback va khi khong co.

## Chi 1 file can sua

| File | Thay doi |
|------|----------|
| `src/components/Video/VideoCard.tsx` | Them fallback `navigate(/watch/${videoId})` trong `handlePlay` |

