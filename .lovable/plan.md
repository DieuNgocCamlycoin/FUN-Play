

## Cập nhật thống kê Admin Dashboard: Chỉ sửa Tổng bình luận

### Thay đổi duy nhất

Sửa hàm RPC `get_admin_dashboard_stats` trong database:

- **`totalComments`**: Bỏ điều kiện lọc user banned -- đếm tất cả bình luận kể cả từ user bị ban
- **`totalUsers`**: **Giữ nguyên** -- vẫn chỉ đếm user không bị ban như hiện tại

### Chi tiết kỹ thuật

| Mục | Hiện tại | Sau khi sửa |
|---|---|---|
| `totalUsers` | `COUNT(*) FROM profiles WHERE COALESCE(banned,false)=false` | **Giữ nguyên** |
| `totalComments` | `COUNT(*) FROM comments WHERE user_id IN (SELECT id FROM profiles WHERE COALESCE(banned,false)=false)` | `COUNT(*) FROM comments` |

### Không thay đổi

- `totalUsers`: giữ nguyên (chỉ đếm user đang hoạt động)
- `totalVideos`, `totalViews`, `totalRewardsDistributed`, `activeUsersToday`: giữ nguyên
- Top 10 Earners, Top 10 Creators: giữ nguyên (vẫn loại user bị ban)
- `dailyStats`: giữ nguyên
- Honor Board, bảng xếp hạng công khai: giữ nguyên (vẫn loại user bị ban)
- Không cần sửa file TypeScript hay giao diện -- chỉ thay đổi logic tính toán phía database

Chỉ cần 1 SQL migration duy nhất để tạo lại hàm `get_admin_dashboard_stats`.

