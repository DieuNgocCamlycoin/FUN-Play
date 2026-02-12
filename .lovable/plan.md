
# Sửa Giao Diện Lịch Sử Giao Dịch Trên Mobile

## Kết quả kiểm tra

Sau khi phân tích kỹ lưỡng:
- **Dữ liệu đúng và đầy đủ**: User hiện tại có 11 giao dịch onchain (11 wallet_transactions + 11 donation_transactions trùng tx_hash, sau dedup còn 11). Tất cả đều hiển thị.
- **Desktop**: Hiển thị tốt, đầy đủ thông tin.
- **Mobile**: Có lỗi hiển thị nghiêm trọng - card giao dịch bị tràn ngang, text bị cắt ("FUN ...", "Angel..."), số tiền bị cắt ("CAMLY C..."), badges xếp lộn xộn.

## Vấn đề cần sửa

1. **TransactionCard trên mobile**: Layout sender -> receiver nằm ngang không vừa màn hình nhỏ
2. **Tên hiển thị bị cắt**: Tên người gửi/nhận quá ngắn trên mobile
3. **Số tiền bị cắt**: Amount + token symbol tràn ra ngoài
4. **Badges chồng chéo**: "Tặng thưởng" + "Onchain" wrap xấu
5. **Footer thông tin quá dài**: Trạng thái, thời gian, chain, TX hash nằm 1 dòng bị tràn

## Giải pháp

### Sửa `TransactionCard.tsx` - Layout responsive cho mobile

Thay đổi layout từ **1 hàng ngang** (Sender -> Receiver) sang **layout dọc xếp chồng** trên mobile:

**Mobile (< 640px):**
```text
+----------------------------------+
| [Avatar] Tên Người Gửi          |
|   0xa496...DA5d                  |
|           ↓                      |
| [Avatar] Tên Người Nhận         |
|   0xa2e2...CC59                  |
+----------------------------------+
| Tặng thưởng  Onchain    +100 USDT|
+----------------------------------+
| "Lời nhắn..."                    |
+----------------------------------+
| Thành công • 09:04 12/02/2026    |
| BSC • TX: 0x6f15... [Copy] [Link]|
+----------------------------------+
```

**Desktop (>= 640px):** Giữ nguyên layout ngang hiện tại.

Cụ thể thay đổi:

1. **Header (Sender -> Receiver)**: Dùng `flex-col sm:flex-row` để trên mobile hiển thị dọc, desktop hiển thị ngang
2. **Arrow**: Đổi từ `ArrowRight` sang `ArrowDown` trên mobile
3. **Amount section**: Đưa số tiền xuống dòng riêng trên mobile, font-size lớn hơn
4. **Footer**: Chia thành 2 dòng trên mobile (dòng 1: trạng thái + thời gian, dòng 2: chain + TX hash)
5. **Badges**: Cho phép wrap tự nhiên với gap nhỏ hơn

### Sửa `TransactionHistorySection.tsx` - Header buttons responsive

Các nút "Làm mới", "Xem Tất Cả", "Xuất CSV" trên mobile bị tràn. Thay đổi:
- Ẩn text trên mobile, chỉ hiện icon
- Sắp xếp lại flex-wrap

## Chi tiết kỹ thuật

### File cần sửa

| File | Thay đổi |
|------|----------|
| `src/components/Transactions/TransactionCard.tsx` | Layout responsive: dọc trên mobile, ngang trên desktop |
| `src/components/Wallet/TransactionHistorySection.tsx` | Header buttons responsive |

### Thay đổi trong `TransactionCard.tsx`

**Dòng 107-174 (Header section):**
- Thay `flex items-center justify-between gap-4` thành `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4`
- Sender block: bỏ `flex-1` trên mobile, dùng full width
- Arrow: `hidden sm:flex` cho ArrowRight ngang, thêm ArrowDown `flex sm:hidden` cho mobile
- Receiver block: bỏ `justify-end` trên mobile

**Dòng 176-197 (Amount & Type):**
- Thay `flex items-center justify-between` thành `flex flex-wrap items-center justify-between gap-2`
- Đảm bảo amount không bị cắt: thêm `whitespace-nowrap`

**Dòng 218-262 (Footer):**
- Thay thành `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2`
- Dòng 1: trạng thái + thời gian
- Dòng 2: chain + TX hash + copy/link buttons

### Thay đổi trong `TransactionHistorySection.tsx`

**Dòng 46-67 (Header buttons):**
- "Làm mới": ẩn text trên mobile `<span className="hidden sm:inline">Làm mới</span>`
- "Xem Tất Cả": ẩn text trên mobile
- Cả 3 nút dùng `size="icon"` trên mobile via responsive classes

## Tác động

- Giao dịch sẽ hiển thị đầy đủ thông tin trên cả mobile và desktop
- Không thay đổi logic dữ liệu - chỉ sửa giao diện
- Tương thích với tất cả kích thước màn hình (iPhone SE đến desktop)
