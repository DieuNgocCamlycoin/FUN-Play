

## Gộp Direction và Time filter về cùng 1 hàng

Chuyển 2 mục "Loại giao dịch" và "Thời gian tổng hợp" từ dạng segmented control riêng biệt thành 2 dropdown/select filter nằm trên cùng 1 hàng, giúp giao diện gọn hơn.

### Thay đổi

#### File: `src/components/Transactions/TransactionSummaryWidget.tsx`

1. **Xóa 2 segmented control** hiện tại (dòng 107-124 cho Direction, dòng 144-160 cho Time)

2. **Thay bằng 1 hàng chứa 2 Select** (dùng Radix Select component đã có sẵn):
   - Select 1: Loại GD -- "Tất cả" / "Đã gửi" / "Đã nhận"
   - Select 2: Thời gian -- "Hôm nay" / "7 ngày" / "30 ngày" / "Tất cả"
   - Cả 2 nằm trong `div className="flex gap-2"`, mỗi select chiếm `flex-1`
   - Styling nhỏ gọn: `h-7 text-xs rounded-lg bg-muted/60 border-0`

3. **Import thêm** `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` từ `@/components/ui/select`

### Kết quả
- 2 dòng filter rút gọn thành 1 dòng duy nhất với 2 dropdown
- Tiết kiệm không gian dọc đáng kể
- Vẫn giữ nguyên logic filter hiện tại
