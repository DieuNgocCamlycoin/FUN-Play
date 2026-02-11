

# Cải thiện xuất CSV & thêm xuất PDF cho User Stats

## Vấn đề hiện tại

File CSV xuất ra bị rối vì:
- Thiếu BOM (Byte Order Mark) nên Excel không nhận diện UTF-8, chữ tiếng Việt bị lỗi
- Các giá trị không được bọc trong dấu ngoặc kép, nếu tên user có dấu phẩy sẽ vỡ cột
- Không có định dạng số, số thập phân hiển thị dài

## Giải pháp

### 1. Sửa hàm `exportCSV` trong `UserStatsTab.tsx`

- Thêm BOM `\uFEFF` vào đầu file (giống `TransactionExport.tsx` đã làm)
- Bọc tất cả giá trị text trong dấu ngoặc kép `""`
- Format số cho gọn gàng (làm tròn 2 chữ số thập phân)
- Thêm thêm cột: Wallet Address, Ngày tham gia, Trạng thái (Active/Banned)

### 2. Thêm xuất PDF

- Sử dụng thư viện `jsPDF` + `jspdf-autotable` (đã có trong project)
- Tạo PDF landscape với header FUN PLAY, bảng dữ liệu gọn gàng
- Có phân trang, footer với số trang
- Theo mẫu giống `TransactionExport.tsx`

### 3. Thay nút Export đơn thành Dropdown menu

- Dropdown với 2 lựa chọn: "Xuất CSV (Excel)" và "Xuất PDF"
- Icon phù hợp cho mỗi loại (xanh cho CSV, đỏ cho PDF)

## Tệp thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Admin/tabs/UserStatsTab.tsx` | Sửa exportCSV, thêm exportPDF, đổi nút thành dropdown |

