

## Khắc phục tooltip mạng xã hội bị xoay theo orbit

### Vấn đề
Tooltip (tên nền tảng + link) hiển thị trên các icon mạng xã hội bị xoay theo animation orbit thay vì nằm ngang cố định. Nguyên nhân: Tooltip trigger nằm bên trong container có `animate-[orbit-spin_25s_linear_infinite]`, khiến vị trí anchor liên tục thay đổi, gây tooltip nhấp nháy hoặc xoay theo.

### Giải pháp
Thay thế Radix Tooltip bằng tooltip tùy chỉnh được render bên ngoài orbit container, sử dụng vị trí tuyệt đối tính toán từ góc orbit hiện tại. Tooltip sẽ hoàn toàn tĩnh, nằm ngang, không bị ảnh hưởng bởi animation.

### Chi tiết thay đổi

**File: `src/components/Profile/SocialMediaOrbit.tsx`**

1. Loại bỏ Radix Tooltip imports (giữ lại TooltipProvider nếu cần cho các phần khác)
2. Thay thế `<Tooltip>` / `<TooltipTrigger>` / `<TooltipContent>` bằng:
   - Các icon orbit giữ nguyên `onMouseEnter`/`onMouseLeave` để set `activeTooltip`
   - Tooltip content được render **bên ngoài** div `.orbit-container` (ngang hàng với nó), sử dụng CSS position tuyệt đối
3. Tính toán vị trí tooltip dựa trên góc orbit hiện tại:
   - Dùng `useRef` + `requestAnimationFrame` để theo dõi góc xoay thực tế của orbit container
   - Hoặc đơn giản hơn: dùng `getComputedStyle` / `getBoundingClientRect` trên icon element để lấy vị trí thực
4. Tooltip hiển thị phía trên icon, nằm ngang cố định, với cấu trúc 2 phần (tên nền tảng + link) giống thiết kế hiện tại

**Cách tiếp cận cụ thể:**
- Mỗi icon orbit gán `ref` callback hoặc `data-platform` attribute
- Khi `activeTooltip` thay đổi, dùng `getBoundingClientRect()` của icon element (đã bao gồm mọi transform) để đặt tooltip ở vị trí chính xác phía trên
- Tooltip được render ở level cao nhất (ngoài orbit container), với `position: fixed` hoặc `position: absolute` relative to inset-0 wrapper
- Dùng `useEffect` + `requestAnimationFrame` loop để cập nhật vị trí tooltip liên tục khi orbit xoay (đảm bảo tooltip bám theo icon nhưng không xoay)

### Thiết kế tooltip giữ nguyên
- Phần trên: tên nền tảng (chữ trắng trên nền màu thương hiệu, bo tròn)
- Phần dưới: link (chữ xanh trên nền trắng, bo tròn)
- Khoảng cách nhỏ giữa hai phần
- Không xoay, luôn nằm ngang

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Profile/SocialMediaOrbit.tsx` | Thay Radix Tooltip bằng custom tooltip render ngoài orbit, dùng RAF + getBoundingClientRect để tracking vị trí |

