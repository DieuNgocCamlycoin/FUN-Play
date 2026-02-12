
# Cập nhật dữ liệu thưởng tay trên trang CAMLY Rewards Admin

## Phát hiện từ dữ liệu database

### Vấn đề 1: Thiếu block_timestamp
- **65 trên 132** giao dịch từ Ví 1 có `block_timestamp = NULL` (do backfill cũ từ BscScan không lấy timestamp)
- Cần chạy lại `backfill-moralis` cho Ví 1 để cập nhật timestamp cho các giao dịch cũ

### Vấn đề 2: Hiển thị sai avatar/tên người nhận
- Địa chỉ `0xB34F...2e18` không có profile nào trong database, nên hiển thị dạng địa chỉ rút gọn thay vì avatar
- Các địa chỉ khác đã có đầy đủ profile (Kim. Rich, Angel Thu Huyền, Huỳnh Tỷ Đô, Angel Ngọc Lắm, v.v.)

### Vấn đề 3: Chưa phân tách CAMLY và USDT
- Có 6 giao dịch USDT (tổng 72 USDT) từ Ví 1 -- cùng token_contract nhưng khác `token_type`
- Hiện tại code gộp tất cả vào "CAMLY" mà không phân biệt

### Dữ liệu thực tế đã kiểm chứng:
- **Ví 1** (trước 8/1/2026): 59 giao dịch CAMLY, tổng ~19.691.562 CAMLY
- **Ví 2** (trước 18/1/2026): 7 giao dịch CAMLY, tổng 3.500.000 CAMLY
- **USDT** (Ví 1): 6 giao dịch, tổng 72 USDT (đều chưa có timestamp)

---

## Bước 1: Chạy lại backfill để cập nhật block_timestamp

Gọi Edge Function `backfill-moralis` để lấy lại dữ liệu từ blockchain cho Ví 1, cập nhật timestamp cho 65 giao dịch đang thiếu.

---

## Bước 2: Cập nhật `RewardPoolTab.tsx`

### 2a. Bỏ lọc theo token_contract, thêm phân tách CAMLY/USDT
- Xoá bộ lọc `.ilike("token_contract", camly)` để lấy TẤT CẢ giao dịch (CAMLY + USDT + BNB + BTC)
- Tính riêng tổng CAMLY và tổng USDT dựa trên trường `token_type`
- Hiển thị tổng từng loại trên card ví

### 2b. Thêm bộ lọc ngày cho phần thống kê tặng thưởng
- Ví 1: chỉ tính giao dịch có `block_timestamp < 2026-01-09` (trước ngày 8/1/2026)
- Ví 2: chỉ tính giao dịch có `block_timestamp < 2026-01-19` (trước ngày 18/1/2026)
- Ghi chú rõ mốc thời gian trên mỗi card ví

### 2c. Sửa hiển thị người nhận
- Giữ nguyên logic lookup profile qua `wallet_address`
- Với địa chỉ không có profile: hiển thị địa chỉ rút gọn kèm link BscScan (thay vì avatar trống)
- Hiển thị đúng avatar cho các user đã có profile

### 2d. Hiển thị số lượng riêng CAMLY và USDT trong bảng
- Thêm cột hoặc badge hiển thị loại token (CAMLY/USDT)
- Số lượng CAMLY hiển thị màu vàng, USDT hiển thị màu xanh lá

### 2e. Cập nhật card "Tổng đã tặng thưởng hệ thống"
- Tổng = Đã claim + Thưởng tay CAMLY
- Hiển thị riêng dòng phụ cho USDT

---

## Chi tiết kỹ thuật

### File cần sửa (1 file):
`src/components/Admin/tabs/RewardPoolTab.tsx`

### Thay đổi trong `fetchManualRewards()`:
- Xoá filter `.ilike("token_contract", camly)`
- Thêm xử lý phân loại theo `token_type` khi tính tổng
- Thêm điều kiện lọc ngày cho mỗi ví
- Cập nhật state `manualStats` để chứa thêm `wallet1Usdt`, `wallet2Usdt`, `totalUsdt`

### Thay đổi giao diện:
- Card ví: hiển thị "X CAMLY + Y USDT"
- Bảng giao dịch: thêm badge token_type cho mỗi dòng
- Card tổng: thêm dòng USDT riêng

### Thứ tự thực hiện:
1. Chạy `backfill-moralis` để cập nhật block_timestamp cho các giao dịch cũ
2. Cập nhật `RewardPoolTab.tsx` với logic mới (phân tách token, lọc ngày, avatar chính xác)
3. Kiểm tra hiển thị trên web và mobile
