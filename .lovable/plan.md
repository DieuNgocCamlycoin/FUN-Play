

## Ghim cố định thanh danh mục (CategoryChips) trên Trang Chủ

### Vấn đề hiện tại

Thanh danh mục đã có `sticky` nhưng giá trị `top` trên mobile không đúng. Trên mobile, nội dung cuộn bên trong một div riêng (`overflow-y-auto` ở line 358), nên `top` cần là `0` thay vì `calc(safe-area + 3.5rem)`.

### Giải pháp

**File: `src/components/Layout/CategoryChips.tsx` (line 24)**

Sửa class của div ngoài cùng:
- Mobile: `top-0` (vì scroll container nằm bên trong div đã trừ header rồi)
- Desktop: giữ `lg:top-14` (scroll toàn trang, cần trừ header)

```
Trước: sticky top-[calc(env(safe-area-inset-top,0px)+3.5rem)] lg:top-14
Sau:   sticky top-0 lg:top-14
```

Chỉ thay đổi 1 dòng duy nhất trong 1 file.

