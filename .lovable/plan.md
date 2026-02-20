

## Khôi phục hiển thị tiêu đề video

### Vấn đề

Trong tệp `src/components/Video/VideoCard.tsx`, dòng 262-266, thẻ `<h3>` hiển thị tiêu đề video bị trống rỗng -- không có `{title}` bên trong:

```typescript
// Hiện tại (SAI)
<h3 
  className="..."
  onClick={handlePlay}
>
</h3>
```

### Giải pháp

Thêm lại `{title}` vào bên trong thẻ `<h3>`:

```typescript
// Sau khi sửa (ĐÚNG)
<h3 
  className="..."
  onClick={handlePlay}
>
  {title}
</h3>
```

### Tệp thay đổi

| STT | Tệp | Nội dung |
|-----|------|----------|
| 1 | `src/components/Video/VideoCard.tsx` | Thêm `{title}` vào thẻ h3 (dòng 266) |

### Kết quả

- Tiêu đề video sẽ hiển thị lại trên tất cả các VideoCard
- Bấm vào tiêu đề vẫn mở được video (onClick đã có sẵn)

