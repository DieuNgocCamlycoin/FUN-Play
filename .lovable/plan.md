

## Thay viên kim cương SVG bằng hình ảnh thật

### Thay đổi

**File 1: `public/images/diamond-badge.png`**
- Copy hình `user-uploads://Viên_kim_cương_xanh_hoàn_hảo.png` vào đây

**File 2: `src/components/Profile/DiamondBadge.tsx`**
- Thay toàn bộ SVG (dòng 43-87) bằng thẻ `<img src="/images/diamond-badge.png">`
- Kích thước: `w-[42px] h-[42px]` mobile, `md:w-12 md:h-12` desktop (giữ nguyên kích thước hiện tại)
- Giữ nguyên logic glow theo lightScore (filter drop-shadow vẫn hoạt động trên img)
- Thêm CSS filter theo cấp độ:
  - **Banned** (gray): `filter: grayscale(1) opacity(0.5)` -- viên kim cương xám mờ
  - **High risk** (black): `filter: brightness(0.3)` -- viên kim cương tối đen
  - **Các cấp khác**: giữ nguyên hình gốc + glow effect tương ứng (hình đã là kim cương xanh đẹp, phù hợp mọi cấp)
- Bỏ sparkle overlay (div diamond-sparkle-ray) vì hình ảnh thật đã có hiệu ứng sẵn

### Tóm tắt

| File | Thay đổi |
|---|---|
| `public/images/diamond-badge.png` | Copy hình kim cương mới |
| `src/components/Profile/DiamondBadge.tsx` | Thay SVG bằng img, giữ glow + thêm filter cho banned/high-risk |

