

## Cập nhật Tooltip MXH trên Orbit

### 4 thay đổi cần thực hiện

**1. Tooltip không xoay theo orbit (luôn nằm ngang)**

Tooltip hiện tại nằm trong container đang xoay nên bị xoay theo. Sẽ thêm class `animate-[orbit-counter-spin_25s_linear_infinite]` vào `TooltipContent` (không cần translate vì tooltip tự định vị) hoặc dùng CSS riêng để counter-rotate tooltip.

Cụ thể: Thêm 1 keyframe mới `orbit-tooltip-counter-spin` trong `src/index.css` chỉ xoay ngược (không translate), và áp dụng cho TooltipContent.

**2. Tách khoảng cách giữa nền tên MXH và nền link**

Thay vì bọc cả 2 trong 1 div `overflow-hidden rounded-md`, sẽ tách thành 2 div riêng biệt, mỗi div tự bo tròn (`rounded-md`), cách nhau bằng `gap-1` trong flex container.

**3. Chiều ngang nền tên MXH vừa với text**

Bỏ `min-w-[120px]`, dùng `w-fit` và `whitespace-nowrap` để nền chỉ rộng vừa đủ tên MXH. Cả 2 phần (tên + link) sẽ nằm trong `flex flex-col items-center gap-1` để căn giữa nhưng mỗi phần có chiều rộng riêng.

**4. Đổi màu Fun Profile sang xanh green**

Đổi `color` của `funplay` từ `#00E7FF` (cyan) sang `#22C55E` (green-500).

---

### Chi tiết kỹ thuật

| File | Thay đổi |
|---|---|
| `src/index.css` | Thêm `@keyframes orbit-tooltip-counter-spin` (chỉ rotate, không translate) |
| `src/components/Profile/SocialMediaOrbit.tsx` dòng 66 | Đổi `color: "#00E7FF"` thành `color: "#22C55E"` cho funplay |
| `src/components/Profile/SocialMediaOrbit.tsx` dòng 275-288 | Tooltip: tách 2 phần ra bằng gap, bỏ min-w, thêm counter-spin animation |

### Kết quả mong đợi

```text
        Fun Profile          (chữ trắng, nền xanh green, bo tròn, vừa text)
            ↕ gap nhỏ
   fun.rich/angelkhanhi       (chữ xanh blue, nền trắng, bo tròn)
```

Tooltip luôn nằm ngang bất kể vị trí trên orbit.
