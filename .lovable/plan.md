

## Cố định nút "+" tại vị trí 10h trên orbit

### Vấn đề hiện tại
Nút "+" đang nằm trong container orbit có animation `orbit-spin`, khiến nó xoay theo quỹ đạo cùng các icon mạng xã hội khác.

### Giải pháp

**File: `src/components/Profile/SocialMediaOrbit.tsx`**

Di chuyển nút "+" (cùng Popover) ra ngoài div `.orbit-container` (div có animation xoay), đặt nó là phần tử anh em (sibling) với vị trí cố định tại 10 o'clock.

Cụ thể:
1. Wrap toàn bộ return trong một `<>` fragment
2. Giữ nguyên div orbit chứa các icon mạng xã hội (có animation xoay)
3. Đặt nút "+" ra ngoài div orbit, sử dụng `position: absolute` với tọa độ cố định tại vị trí 10h:
   - `left: calc(50% - 50.2%)`
   - `top: calc(50% - 29%)`
   - Bỏ class `orbit-item` và `animate-[orbit-counter-spin_...]` vì nút không còn xoay
4. Bọc fragment trong một div `relative` để cả orbit và nút "+" cùng tham chiếu

### Chi tiết kỹ thuật

- Góc 10h tương ứng 210 deg trong hệ tọa độ code hiện tại
- `cos(210deg) * 58 = -50.2`, `sin(210deg) * 58 = -29` (hướng trên-trái)
- Nút "+" sẽ đứng yên trong khi các icon khác vẫn xoay bình thường
- Popover và toàn bộ logic thêm link giữ nguyên, không thay đổi

