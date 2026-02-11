

# Sửa lỗi hiển thị số dư FUN Money trong modal Thưởng & Tặng

---

## Nguyên nhân gốc

Lỗi console: `could not decode result data (value="0x")` — nghĩa là hàm `balanceOf` trả về dữ liệu rỗng. Điều này xảy ra khi:
1. Ví người dùng đang ở **sai mạng** (không phải BSC Mainnet chainId 56) → contract không tồn tại trên mạng đó → trả về `0x`
2. Hệ thống không yêu cầu chuyển mạng trước khi gọi `balanceOf`
3. Khi lỗi xảy ra, `bscBalance` = `null` → hiển thị dấu **"?"** thay vì số dư thật

---

## Giải pháp

### Thay đổi tệp: `src/components/Donate/EnhancedDonateModal.tsx`

**Cập nhật hàm `fetchBscBalance` (dòng 236-283):**

1. **Kiểm tra và chuyển mạng BSC** trước khi đọc số dư:
   - Kiểm tra `chainId` hiện tại
   - Nếu không phải BSC (56), gọi `wallet_switchEthereumChain` để chuyển
   - Nếu chưa thêm BSC, gọi `wallet_addEthereumChain`

2. **Xử lý lỗi `0x` mượt mà**:
   - Bắt lỗi `BAD_DATA` cụ thể
   - Khi gặp lỗi này, đặt `bscBalance = "0"` thay vì `null` (để hiển thị "0.0000 FUN" thay vì "?")

3. **Hiển thị thông báo rõ ràng** khi chưa kết nối ví hoặc sai mạng

### Luồng hoạt động sau khi sửa:

```text
Người dùng chọn FUN Money
  → Kiểm tra ví có kết nối không
    → Không: Hiển thị "Chưa kết nối ví"
    → Có: Kiểm tra chainId
      → Sai mạng: Tự động yêu cầu chuyển sang BSC
      → Đúng BSC: Gọi balanceOf
        → Thành công: Hiển thị số dư thật
        → Lỗi 0x: Hiển thị "0.0000 FUN" (contract chưa có trên mạng này)
```

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Donate/EnhancedDonateModal.tsx` | Thêm logic chuyển mạng BSC trước khi đọc số dư; xử lý lỗi `0x` trả về "0" thay vì `null` |

---

## Kết quả mong đợi

- Số dư FUN Money hiển thị đúng (không còn dấu "?" nữa)
- Ví tự động chuyển sang mạng BSC khi cần
- Nếu số dư = 0, hiển thị rõ ràng "0.0000 FUN" thay vì lỗi
- Nút "Xem lại & Xác nhận" hoạt động bình thường khi có đủ số dư

