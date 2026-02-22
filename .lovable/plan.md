
## Chỉnh sửa Tooltip mạng xã hội trên Orbit

### Thay đổi

**File: `src/components/Profile/SocialMediaOrbit.tsx` (dòng 275-282)**

Thay thế tooltip hiện tại (1 dòng ngang: tên + link) bằng layout mới:

- **Hàng 1**: Tên mạng xã hội (font-semibold, căn giữa)
- **Hàng 2**: Link thu gọn (text nhỏ, muted)
- **Hàng 3**: Hình tròn nhỏ chứa avatar MXH tương ứng (căn giữa)

Layout sẽ dùng `flex flex-col items-center` để tên và avatar nằm giữa so với link. Tooltip luôn hiển thị phía trên (`side="top"`) để nằm ngang, không bị xéo theo orbit.

### Chi tiết kỹ thuật

```text
TooltipContent side="top"
  flex flex-col items-center gap-1
    ├─ Hàng 1: <span font-semibold>{platform.label}</span>
    ├─ Hàng 2: <span text-muted truncate>{shortened URL}</span>
    └─ Hàng 3: <div w-6 h-6 rounded-full overflow-hidden>
                  <img src={displayUrl} /> hoặc <Icon />
               </div>
```

Biến `displayUrl` đã có sẵn trong scope (dòng 250), chỉ cần sử dụng trong tooltip.
