
# Thêm Link Lịch Sử Giao Dịch Vào Menu Di Động

## Kết quả kiểm tra

Trang `/transactions` **đã hoạt động tốt** trên di động:
- Giao diện responsive, hiển thị đầy đủ thống kê (789 giao dịch, 1.67B CAMLY)
- Người chưa đăng nhập vẫn xem được (publicMode: true)
- Bộ lọc, tìm kiếm, nút "Tải thêm" đều hoạt động
- Thẻ giao dịch hiển thị bố cục dọc phù hợp màn hình nhỏ

## Vấn đề duy nhất

**Thiếu link trong menu di động (MobileDrawer)** -- người dùng trên điện thoại không có cách nào truy cập trang này từ menu.

## Kế hoạch sửa

### Tệp: `src/components/Layout/MobileDrawer.tsx`

Thêm 1 mục mới vào mảng `rewardItems` (dòng 70), ngay sau "Lịch Sử Phần Thưởng":

```typescript
{ icon: Globe, label: "Lịch Sử Giao Dịch", href: "/transactions" },
```

Icon `Globe` đã có sẵn trong import. Chỉ cần thêm **1 dòng code**.

### Tổng kết

| Tệp | Thay đổi |
|------|----------|
| `src/components/Layout/MobileDrawer.tsx` | Thêm 1 mục nav "Lịch Sử Giao Dịch" vào `rewardItems` |

Không cần thay đổi gì khác -- trang giao dịch đã sẵn sàng cho di động.
