

## Cập nhật sidebar: Toggle cho FUN Ecosystem + Mặc định ẩn/hiện

### Thay đổi

| Nội dung | Chi tiết |
|---|---|
| Thêm toggle cho FUN Ecosystem | Thêm `CollapsibleTrigger` với ChevronUp/Down cho nhóm FUN Ecosystem, giống 4 nhóm còn lại |
| Mặc định ẩn/hiện | FUN Ecosystem và Điều hướng mở (`true`), Thư viện / Phần thưởng / Quản lý đóng (`false`) |

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/components/Layout/CollapsibleSidebar.tsx` | (1) Thêm key `ecosystem: true` vào `openSections` state, đổi `library/rewards/manage` thành `false`. (2) Bọc phần FUN Ecosystem trong `Collapsible` với trigger có ChevronUp/Down |

### Chi tiết kỹ thuật

1. Sửa state mặc định:
```typescript
const [openSections, setOpenSections] = useState({
  ecosystem: true,   // mới - mặc định mở
  nav: true,         // giữ nguyên mở
  library: false,    // đổi thành đóng
  rewards: false,    // đổi thành đóng
  manage: false,     // đổi thành đóng
});
```

2. Bọc block FUN Ecosystem (phần hiển thị các platform cards) trong `Collapsible` component với `CollapsibleTrigger` có label "FUN ECOSYSTEM" + icon ChevronUp/Down, style giống 4 nhóm kia.

