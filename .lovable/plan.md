

## Căn trục trung tâm avatar trùng ảnh bìa trên mobile

### Phân tích
- Ảnh bìa (line 44): nằm trong container `w-full` bên trong div `relative` ngoài cùng (line 42) -- trung tâm = 50% width của container cha.
- Avatar (line 63): đang dùng `left-[50vw]` -- tính theo **viewport**, không phải theo container cha. Nếu có bất kỳ offset nào (scrollbar, padding ẩn...) thì sẽ lệch so với ảnh bìa.

### Giải pháp (1 thay đổi duy nhất, chỉ mobile)
Đổi `left-[50vw]` về lại `left-1/2` trên mobile tại dòng 63 trong `src/components/Profile/ProfileHeader.tsx`.

`left-1/2` tính 50% theo chính container cha (`relative w-full` ở line 58), đảm bảo trục trung tâm avatar **luôn trùng** với trục trung tâm ảnh bìa vì cả hai đều tính theo cùng một hệ tọa độ parent.

```text
Từ:  left-[50vw] -translate-x-1/2 md:left-auto md:translate-x-0
Thành: left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0
```

### Tại sao cách này đúng
- Ảnh bìa dùng `w-full` trong parent -- trung tâm = 50% parent width
- Avatar dùng `left-1/2` trong cùng cây layout -- trung tâm = 50% parent width  
- Cả hai tính cùng hệ tọa độ nên **luôn trùng trục**, bất kể kích thước màn hình
- Desktop không bị ảnh hưởng nhờ `md:left-auto md:translate-x-0`

### Phạm vi
- **1 file**: `src/components/Profile/ProfileHeader.tsx`
- **1 dòng**: dòng 63, thay 1 class

