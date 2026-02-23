

## Sửa nút "Báo cáo" trong VideoCard

### Vấn đề

Nút "Báo cáo" trong menu dropdown của VideoCard (trang profile, trang chủ...) chỉ hiện toast "Đã báo cáo" ngay lập tức mà **không lưu vào database** và **không cho chọn lý do**. Trong khi đó, component `ReportSpamButton` đã có sẵn dialog đầy đủ với 6 lý do + ô nhập chi tiết, nhưng chưa được dùng ở VideoCard.

### Giải pháp

Thay thế nút báo cáo giả trong `VideoCard.tsx` bằng component `ReportSpamButton` có sẵn -- giống cách đã dùng trong trang Watch và VideoActionsBar.

### Chi tiết kỹ thuật

**File: `src/components/Video/VideoCard.tsx`**

1. Import `ReportSpamButton` component
2. Thay dòng 320-323 (DropdownMenuItem fake) bằng `ReportSpamButton` được wrap trong `DropdownMenuItem asChild`, truyền `videoId` vào

Kết quả: Khi bấm "Báo cáo", sẽ mở dialog cho chọn lý do (spam, trùng lặp, chất lượng thấp, vi phạm cộng đồng, nội dung có hại, thông tin sai lệch) + ô nhập chi tiết, rồi mới gửi báo cáo thực sự vào database.

| File | Thay đổi |
|------|---------|
| `src/components/Video/VideoCard.tsx` | Import ReportSpamButton, thay nút báo cáo giả bằng component thật |

