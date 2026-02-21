

## Thêm cột Tổng thưởng vào trang /suspended

### Thay đổi

Thêm 1 cột "Tổng thưởng" hiển thị tổng CAMLY rewards của mỗi tài khoản bị đình chỉ.

### Chi tiết kỹ thuật

**1. Database Migration -- Cập nhật RPC `get_public_suspended_list`**
- Thêm trường `total_camly_rewards` vào kết quả trả về

```text
RETURNS TABLE(
  ..., total_camly_rewards numeric
)
SELECT ..., COALESCE(total_camly_rewards, 0)
FROM profiles WHERE banned = true
```

**2. File: `src/hooks/usePublicSuspendedList.ts`**
- Thêm `total_camly_rewards: number` vào interface `SuspendedUser` và `SuspendedEntry`
- Map giá trị trong `mergedEntries` (orphan wallets sẽ có giá trị `0`)

**3. File: `src/pages/SuspendedUsers.tsx`**
- Thêm 1 `TableHead` mới: "Tổng thưởng" (class `hidden md:table-cell`) sau cột "Mức độ"
- Thêm 1 `TableCell` tương ứng trong `SuspendedRow`, hiển thị số CAMLY đã format (ví dụ: `1,250,000 CAMLY`)
- Giá trị `0` hiển thị dấu "—"

