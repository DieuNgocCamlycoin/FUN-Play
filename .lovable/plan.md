
## Thêm tiêu đề cho mỗi dropdown filter

Chia mỗi ô filter thành 2 phần: nửa trái là label, nửa phải là dropdown.

### Thay đổi

#### File: `src/components/Transactions/TransactionSummaryWidget.tsx` (dòng 108-130)

Thay thế layout hiện tại từ 2 Select đơn giản thành 2 ô, mỗi ô có cấu trúc:

```
[Label     | Dropdown ▼]  [Label     | Dropdown ▼]
```

Cụ thể:
- Mỗi filter được bọc trong `div className="flex-1 flex items-center rounded-lg bg-muted/60 overflow-hidden"`
- Nửa trái: `span className="px-2 text-[10px] font-medium text-muted-foreground whitespace-nowrap"` chứa tiêu đề ("Loại GD" và "Thời gian")
- Nửa phải: Select component với trigger không có background riêng (`bg-transparent border-0`)
- Giữ nguyên logic filter, chỉ thay đổi layout

### Kết quả
- Mỗi dropdown có label rõ ràng giúp người dùng biết ô đó dùng để lọc gì
- Giao diện gọn gàng, 2 filter vẫn nằm trên 1 hàng
