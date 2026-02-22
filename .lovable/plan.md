

## Cập nhật hình đại diện mặc định cho Facebook trên orbit

### Thay đổi
1. **Copy hình ảnh** Facebook icon được upload vào `public/images/facebook-default.png` (ghi đè file cũ nếu có)
2. **Không cần sửa code** vì `SocialMediaOrbit.tsx` đã tham chiếu đến `/images/facebook-default.png` rồi - chỉ cần thay file ảnh

### File thay đổi

| File | Thay đổi |
|---|---|
| `public/images/facebook-default.png` | Thay thế bằng hình Facebook icon mới (hình tròn xanh có chữ "f" trắng) |

