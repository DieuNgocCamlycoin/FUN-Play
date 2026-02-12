

# Cập nhật tên hiển thị ví hệ thống

## Tổng quan
Đổi tên hiển thị của 2 ví dùng để tặng thưởng bằng tay thành tên dễ hiểu hơn.

---

## Thay đổi trong `src/config/systemWallets.ts`

### Ví TREASURY (0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998)
- Tên cũ: "FUN PLAY TREASURY"
- **Tên mới: "Ví tặng thưởng 1"**
- Username: @vitangthuong1
- Channel: "Ví tặng thưởng 1"

### Ví mới (0x7b32E82C64FF4f02dA024B47A8653e1707003339)
- **Tên hiển thị: "Ví tặng thưởng 2"**
- Username: @vitangthuong2
- Channel: "Ví tặng thưởng 2"

### Ví REWARD (0x8f09...) giữ nguyên
- Vẫn là "FUN PLAY TẶNG & THƯỞNG" -- đây là ví hệ thống tự động, không phải ví tặng tay

---

## Chi tiết kỹ thuật

### File cần sửa:
- `src/config/systemWallets.ts` -- Đổi displayName của TREASURY thành "Ví tặng thưởng 1", thêm ví mới 0x7b32 với displayName "Ví tặng thưởng 2", cập nhật hàm `getSystemWalletInfo()` để nhận diện ví mới

Thay đổi này sẽ tự động áp dụng cho tất cả các trang hiển thị giao dịch (lịch sử giao dịch, Users Directory, Admin Stats...) vì các trang đó đều gọi hàm `getSystemWalletInfo()` để lấy tên hiển thị.

