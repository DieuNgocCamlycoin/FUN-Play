

## Thay đổi cần thực hiện

### 1. Giảm kích thước viên kim cương xuống 3/4

**File: `src/components/Profile/DiamondBadge.tsx` (dòng 43-49)**

- Kích thước hiện tại: `w-[84px] h-[84px] md:w-24 md:h-24` (84px / 96px)
- Kích thước mới: `w-[63px] h-[63px] md:w-[72px] md:h-[72px]` (63px / 72px)
- Điều chỉnh vị trí: `-top-10 md:-top-12` (thay vì `-top-14 md:-top-16`)

### 2. Tooltip hiển thị tên MXH + link thu gọn nằm ngang

**File: `src/components/Profile/SocialMediaOrbit.tsx` (dòng 275-280)**

Thay thế TooltipContent hiện tại (tên trên, link dưới) bằng layout nằm ngang:
- Tên mạng xã hội (bold) + link thu gọn nằm cùng 1 dòng, cách nhau bằng khoảng trắng
- Logic thu gọn link:
  - `https://www.facebook.com/...` -> `facebook.com/...`
  - `https://t.me/...` -> `t.me/...`
- Giống hình tham chiếu: "Facebook" rồi "www.facebook.com/le.kha.nhi..." hoặc "Telegram" rồi "t.me/LeKhaNhi"

### Tóm tắt

| File | Dòng | Thay đổi |
|---|---|---|
| `DiamondBadge.tsx` | 43-49 | Giảm size 3/4, chỉnh vị trí top |
| `SocialMediaOrbit.tsx` | 275-280 | Tooltip nằm ngang: tên + link thu gọn |

