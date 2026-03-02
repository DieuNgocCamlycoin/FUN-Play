
## Thêm đơn vị tiền tệ vào TransactionSummaryWidget

Thêm ký hiệu token (CAMLY, USDT, BNB, FUN) vào sau mỗi giá trị hiển thị trong widget tổng hợp giao dịch.

### Thay đổi

#### File: `src/components/Transactions/TransactionSummaryWidget.tsx`

1. **Tổng giá trị (line 155)**: Thêm token symbol phía sau -- nếu đang lọc 1 token cụ thể thì hiện tên token đó, nếu chọn "Tất cả" thì hiện "tokens"
2. **GD lớn nhất (line 160-162)**: Thêm `token_symbol` của giao dịch lớn nhất phía sau giá trị
3. **Breakdown theo token (line 178)**: Thêm token symbol sau giá trị mỗi dòng

Ví dụ hiển thị:
- Tổng giá trị: `1.5M CAMLY` (khi lọc CAMLY) hoặc `2.3M tokens` (khi chọn Tất cả)
- GD lớn nhất: `500K CAMLY`
- Breakdown: `12 GD · 1.5M CAMLY`
