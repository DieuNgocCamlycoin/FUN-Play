

## Phân nhóm sidebar trái với tên nhóm và nút ẩn/hiện riêng

### Vấn đề hiện tại
Sidebar trái (`CollapsibleSidebar.tsx`) hiện có 1 nút "Điều hướng" duy nhất để ẩn/hiện **toàn bộ** nội dung (4 nhóm: Main nav, Library, Rewards, Manage). Không có tên nhóm hay khả năng ẩn/hiện từng nhóm riêng lẻ.

### Giải pháp
Thay thế 1 Collapsible lớn bằng 4 Collapsible riêng biệt, mỗi nhóm có:
- Tên nhóm (label) hiển thị rõ ràng
- Nút ChevronDown/Up để ẩn/hiện nội dung trong nhóm

### Phân nhóm

| Nhóm | Tên hiển thị | Nội dung |
|---|---|---|
| FUN ECOSYSTEM | FUN ECOSYSTEM | FUN PROFILE, FUN FARM, FUN PLANET (giữ nguyên, luôn hiện) |
| Điều hướng | Điều hướng | Trang chủ, Shorts, Kênh đăng ký, Users Directory, Thiền cùng Cha, Tạo Nhạc Ánh Sáng |
| Thư viện | Thư viện | Thư viện, Lịch sử, Video của bạn, Xem sau, Video đã thích, Bộ sưu tập NFT |
| Phần thưởng | Phần thưởng | Bảng Xếp Hạng, Lịch Sử Phần Thưởng, Lịch Sử Giao Dịch, Danh Sách Đình Chỉ, FUN Money, Giới Thiệu Bạn Bè, Build and Bounty |
| Quản lý | Quản lý | Studio, Quản lý kênh, Danh sách phát, Bài viết của bạn, Ví |

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Layout/CollapsibleSidebar.tsx` | Thay 1 Collapsible lớn bằng 4 Collapsible riêng (Dieu huong, Thu vien, Phan thuong, Quan ly), mỗi cái có label + nút toggle |

### Chi tiết kỹ thuật

1. Thay `sectionsOpen` (1 state) bằng object state cho từng nhóm:
```typescript
const [openSections, setOpenSections] = useState({
  nav: true,
  library: true,
  rewards: true,
  manage: true,
});
```

2. Tạo component `SidebarSection` tái sử dụng:
```typescript
const SidebarSection = ({ label, sectionKey, items }) => (
  <Collapsible open={openSections[sectionKey]} onOpenChange={(open) => 
    setOpenSections(prev => ({...prev, [sectionKey]: open}))
  }>
    <CollapsibleTrigger> {label} + ChevronDown/Up </CollapsibleTrigger>
    <CollapsibleContent> {items.map(...)} </CollapsibleContent>
  </Collapsible>
);
```

3. Thay thế block dòng 177-223 (1 Collapsible lớn) bằng 4 `SidebarSection` nối tiếp nhau, ngăn cách bởi border.

4. Mini mode (sidebar thu nhỏ) giữ nguyên logic hiện tại.

