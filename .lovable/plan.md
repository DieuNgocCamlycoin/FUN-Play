

## Sửa công thức đếm danh sách đình chỉ

### Vấn đề
`totalCount` hiện tại = `bannedUsers.length + blacklistedWallets.length` (user bị ban + tất cả ví bị chặn) = 633. Con số này không phản ánh đúng số lượng user bị đình chỉ.

### Giải pháp
Sửa `totalCount` chỉ đếm số lượng user bị đình chỉ.

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/hooks/usePublicSuspendedList.ts` | Dòng 160: đổi `totalCount` từ `bannedUsers.length + blacklistedWallets.length` thành `bannedUsers.length` |

