

## Thiết kế lại Tooltip MXH theo hình tham chiếu

### Phân tích hình tham chiếu

Từ hình gửi kèm (ví dụ TikTok), tooltip gồm 2 phần xếp dọc:
1. **Tên MXH**: Chữ trắng, nền là màu thương hiệu MXH (TikTok = đen, Facebook = xanh dương, Angel AI = vàng...)
2. **Link MXH**: Chữ xanh blue trên nền trắng

Cả 2 phần bo tròn gọn gàng, tooltip nổi phía trên icon.

### Thay đổi cần thực hiện

**File: `src/components/Profile/SocialMediaOrbit.tsx` (dòng 275-282)**

Thay tooltip hiện tại (1 dòng ngang) bằng tooltip 2 phần dọc:

```text
Trước:
  [TikTok  tiktok.com/@lknhi98]   (1 dòng, màu mặc định)

Sau:
  ┌──────────────┐
  │   TikTok     │  ← chữ trắng, nền màu MXH (#69C9D0 cho TikTok, #1877F2 cho FB...)
  ├──────────────┤
  │www.tiktok... │  ← chữ xanh blue (#2563EB), nền trắng
  └──────────────┘
```

Chi tiết:
- Bỏ style mặc định của `TooltipContent`, thay bằng `bg-transparent border-none shadow-none p-0`
- Phần tên: `rounded-t-md px-3 py-1.5`, nền lấy từ `platform.color`, chữ trắng (`text-white`), font bold, căn giữa
- Phần link: `rounded-b-md px-3 py-1.5`, nền trắng (`bg-white`), chữ xanh blue (`text-blue-600`), cỡ chữ nhỏ (`text-[11px]`), căn giữa
- Màu nền tên MXH dùng đúng `platform.color` đã có sẵn:
  - Fun Profile: `#00E7FF`
  - Angel AI: `#FFD700`
  - Facebook: `#1877F2`
  - YouTube: `#FF0000`
  - X/Twitter: `#1DA1F2`
  - Telegram: `#0088cc`
  - TikTok: `#69C9D0`
  - LinkedIn: `#0A66C2`
  - Zalo: `#0068FF`
- Riêng TikTok nền đen (`#000000`) thay vì `#69C9D0` để đúng thương hiệu
- Link vẫn thu gọn: bỏ `https://www.` hoặc `https://`

### Lưu ý kỹ thuật
- Dùng inline style `backgroundColor: platform.color` cho phần tên (vì mỗi MXH khác màu)
- TikTok sẽ có logic riêng: `platform.key === 'tiktok' ? '#000000' : platform.color`
- Toàn bộ tooltip bọc trong `overflow-hidden rounded-md shadow-lg` để 2 phần liền mạch

| File | Dòng | Thay đổi |
|---|---|---|
| `SocialMediaOrbit.tsx` | 275-282 | Tooltip 2 phần: tên (trắng/nền MXH) + link (xanh blue/nền trắng) |

