

# Plan: Set test data cho FUN TREASURY

## User được chọn

| Field | Value |
|---|---|
| ID | c0b4d60c-6845-478d-92dd-d38a973af486 |
| Username | funtreasury |
| Display Name | FUN TREASURY |
| Wallet | 0xa4967da72d012151950627483285c3042957DA5d |
| Light Score hiện tại | **0** |
| PPLP Accepted | **chưa (NULL)** |
| Banned | false |

## Cần thực hiện

Chạy 1 lệnh UPDATE để user đủ điều kiện test mint FUN:

```sql
UPDATE profiles
SET light_score = 60,
    pplp_accepted_at = now()
WHERE id = 'c0b4d60c-6845-478d-92dd-d38a973af486';
```

Sau khi update:
- `light_score` = 60 (đủ ngưỡng mint)
- `pplp_accepted_at` = thời điểm hiện tại (đã chấp nhận PPLP Charter)

User FUN TREASURY sẽ đủ điều kiện để tạo mint request trên MultisigMintTab. Không cần thay đổi code.

