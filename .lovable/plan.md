

# Sửa 4 Giao Dịch LIKE Còn Sót & Đồng Bộ Lại Số Dư

## Vấn đề
Có **4 giao dịch LIKE** chưa claim vẫn đang ở mức thưởng cũ (5.000 CAMLY thay vì 2.000 CAMLY). Đây là các giao dịch được tạo trong khoảng thời gian giữa lúc migration chạy xong và Edge Function được cập nhật. Chênh lệch: 4 x 3.000 = **12.000 CAMLY**.

## Kế hoạch thực hiện

### Bước 1: Database Migration

Chạy SQL để:

1. Cập nhật 4 giao dịch LIKE còn sót về mức 2.000 CAMLY
2. Chạy lại `sync_reward_totals()` để đồng bộ số dư

```sql
-- Sửa 4 giao dịch LIKE còn ở mức 5.000
UPDATE reward_transactions
SET amount = 2000
WHERE reward_type = 'LIKE'
  AND claimed = false
  AND amount != 2000;

-- Đồng bộ lại số dư cho tất cả người dùng
SELECT sync_reward_totals();
```

### Tác động

- Giảm thêm **12.000 CAMLY** (4 giao dịch x 3.000 chênh lệch)
- Sau khi sửa: **0 giao dịch LIKE sai mức** trong hệ thống

### Tệp cần thay đổi

| Tệp | Nội dung |
|------|----------|
| Database migration (SQL) | Cập nhật 4 LIKE còn sót + chạy `sync_reward_totals()` |

Không cần thay đổi Edge Function hay code client -- tất cả đã được cập nhật đúng từ lần trước.

