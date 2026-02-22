

## Thêm link profile FUN Play bên cạnh mã ví

### Mô tả
Thêm một pill hiển thị link rút gọn `play.fun.rich/"username"` ngay bên cạnh (cùng hàng) với pill mã ví hiện tại. Khi nhấn nút copy, sẽ copy link đầy đủ `https://play.fun.rich/"username"`.

### Vị trí hiển thị
Dòng 128-147 trong `ProfileInfo.tsx` -- ngay sau pill mã ví, cùng hàng:

```text
[ Wallet icon | 0x1234...5678 | Copy ]   [ Link icon | play.fun.rich/username | Copy ]
```

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Profile/ProfileInfo.tsx` | Bọc wallet pill + profile link pill trong `flex` container. Thêm pill mới hiển thị link rút gọn với nút copy |

### Chi tiết kỹ thuật

1. **Wrap trong flex row**: Bọc wallet pill hiện có (dòng 129-147) trong một `div className="flex flex-wrap items-center gap-2"`
2. **Thêm profile link pill** ngay sau wallet pill, cùng style (rounded-full, bg-muted/60, border):
   - Icon: `Link` từ lucide-react
   - Hiển thị text rút gọn: `play.fun.rich/{username}`
   - Nút Copy: click sẽ copy full URL `https://play.fun.rich/{username}`
   - Toast: "Da copy link profile!"
3. **Profile link pill luon hien thi** (khong phu thuoc vao wallet_address) -- vi moi user deu co username
4. **Responsive**: Dung `flex-wrap` de xuong dong tren man hinh nho

### Luu y
- Profile link pill se hien thi **bat ke** user co wallet hay khong (di chuyen ra ngoai block `if wallet_address`)
- Style dong nhat voi wallet pill: `inline-flex items-center gap-2.5 px-4 py-2 bg-muted/60 border border-primary/30 rounded-full`

