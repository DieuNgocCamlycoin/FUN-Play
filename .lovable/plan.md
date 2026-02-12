

# Sửa Lỗi Giới Hạn Hiển Thị Giao Dịch Onchain

## Kết quả kiểm tra chi tiết

Sau khi kiểm tra toàn bộ hệ thống:

### Dữ liệu trong cơ sở dữ liệu
- **502** giao dịch wallet_transactions (CAMLY: 390, USDT: 107, BNB: 3, BTC: 3)
- **182** giao dịch donation_transactions
- **23** giao dịch claim_requests
- **Tổng: 707** giao dịch onchain
- **73** giao dịch từ ví bên ngoài (không có tài khoản trên Fun Play)

### Trang Ví cá nhân (Angel Thu Ha)
- 10 wallet_transactions + 11 donation_transactions = **11 sau dedup** -- Hiển thị **đầy đủ** và đúng
- Query mở rộng theo wallet_address hoạt động tốt

### Trang Giao Dịch công khai (/transactions)
- Hiển thị **707 tổng** nhưng thực tế chỉ tải tối đa **500 wallet_transactions** do giới hạn hardcode
- **2 giao dịch cũ nhất bị thiếu** (502 - 500 = 2)
- Con số này sẽ tăng khi có thêm giao dịch mới

### Mobile UI
- Layout responsive đã hoạt động tốt (dọc trên mobile, ngang trên desktop)
- Thông tin hiển thị đầy đủ, không bị cắt

## Vấn đề cần sửa

1. **Giới hạn 500 record cho wallet_transactions**: Dòng 142 hardcode `walletLimit = Math.max(limit, 500)`. Với 502+ records hiện tại, giao dịch cũ bị mất
2. **Pagination không đồng bộ**: Offset dùng chung cho 3 bảng nhưng mỗi bảng có số lượng khác nhau

## Giải pháp

### Sửa `src/hooks/useTransactionHistory.ts`

**Thay đổi 1: Tăng giới hạn wallet_transactions**

Thay `walletLimit = Math.max(limit, 500)` thành `walletLimit = Math.max(limit, 1000)` để đảm bảo lấy đủ dữ liệu khi số giao dịch tăng.

**Thay đổi 2: Đảm bảo donation và claim cũng lấy đủ**

Tăng limit cho donation_transactions và claim_requests trong public mode từ `limit` (200) lên `Math.max(limit, 500)` để không bỏ sót giao dịch cũ.

## Chi tiết kỹ thuật

| File | Thay đổi |
|------|----------|
| `src/hooks/useTransactionHistory.ts` | Dòng 142: tăng walletLimit từ 500 lên 1000. Dòng 144-163: tăng limit cho donations/claims trong public mode |

### Thay đổi cụ thể

Dòng 142:
```text
-- Trước:
const walletLimit = Math.max(limit, 500);
-- Sau:
const walletLimit = Math.max(limit, 1000);
```

Dòng 144-163 (donation query):
```text
-- Trước (public mode):
.range(currentOffset, currentOffset + limit - 1);
-- Sau (public mode):
.range(currentOffset, currentOffset + Math.max(limit, 500) - 1);
```

Tương tự cho claim_requests query (dòng 174-191).

## Tác động

- Trang `/transactions` sẽ hiển thị **tất cả 707+ giao dịch** thay vì bị giới hạn
- Trang `/wallet` (cá nhân) không ảnh hưởng vì số giao dịch cá nhân luôn nhỏ hơn 500
- Tương thích cả desktop và mobile
- Không thay đổi logic UI, chỉ sửa giới hạn truy vấn

