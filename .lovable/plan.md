

## Hiển thị Social Orbit mặc định khi user chưa có link mạng xã hội

### Vấn đề hiện tại
Khi user chưa liên kết bất kỳ mạng xã hội nào, component `SocialMediaOrbit` trả về `null` (không hiển thị gì). Theo yêu cầu, cần hiển thị đầy đủ các vòng tròn nhỏ với hình mặc định của từng nền tảng.

### Thay đổi

**File: `src/components/Profile/SocialMediaOrbit.tsx`**

1. **Hiển thị tất cả 9 nền tảng khi chưa có link nào**
   - Xóa điều kiện `if (count === 0) return null` (dòng 189-190)
   - Thay vì chỉ hiển thị `activePlatforms`, khi không có platform nào active thì hiển thị toàn bộ 9 platforms với hình mặc định

2. **Vòng tròn chưa có link: viền nét đứt (dashed border)**
   - Theo hình tham khảo, các vòng tròn chưa liên kết có viền nét đứt thay vì viền liền
   - Style: `border: 3px dashed #999` thay vì `border: 3px solid #00E7FF`

3. **Hình đại diện mặc định cho tất cả nền tảng**
   - Mở rộng `defaultAvatarMap` để bao phủ thêm các nền tảng chưa có ảnh mặc định (YouTube, TikTok, Telegram, X/Twitter)
   - Nền tảng nào chưa có ảnh mặc định sẽ hiển thị icon SVG tương ứng (giữ nguyên logic fallback hiện tại)

4. **Tooltip khi hover vào vòng tròn chưa có link**
   - Hàng 1: Tên mạng xã hội (giữ nguyên style hiện tại)
   - Hàng 2: "Nhấp vào để thêm link" (thay vì hiển thị URL)

5. **Click vào vòng tròn chưa có link: mở Popover thêm link**
   - Thay vì dùng thẻ `<a>` (link ra ngoài), sử dụng `Popover` cho các platform chưa có URL
   - Popover hiển thị: tên nền tảng, mô tả "Nhập link trang cá nhân của bạn (có thể bỏ qua)", ô nhập URL, nút "Xóa" và "Lưu" (giống hình 3 tham khảo)
   - Chỉ áp dụng cho chủ profile (`isOwnProfile`); với người xem khác, vòng tròn chưa có link chỉ hiển thị tooltip

### Chi tiết kỹ thuật

- Logic orbit items: `allOrbitItems = activePlatforms.length > 0 ? activePlatforms : platforms` (hiển thị tất cả khi chưa có link nào)
- Mỗi orbit item kiểm tra `urls[platform.key]` để quyết định:
  - Có link: render `<a>` với viền solid cyan, tooltip hiển thị URL
  - Chưa có link + isOwnProfile: render button với `Popover`, viền dashed xám
  - Chưa có link + không phải owner: render div với viền dashed xám, chỉ có tooltip
- Popover khi click (hình 3): tái sử dụng logic `handleSave` hiện có, UI gồm header (icon + tên), input URL, 2 nút "Xóa" (reset) và "Lưu" (save)

### Tổng kết

| File | Thay đổi |
|------|---------|
| `src/components/Profile/SocialMediaOrbit.tsx` | Hiển thị orbit mặc định, viền dashed, tooltip "nhấp để thêm link", popover thêm link trực tiếp |

