

## Xay dung lai tab Quan Ly Users trong Admin Panel

### Van de hien tai

1. **Du lieu trong (0 users)**: Ham RPC `get_users_directory_stats` co dieu kien `WHERE has_role(auth.uid(), 'admin')` nhung tai khoan Owner (angel_dngoc) chi co role `owner`, khong co role `admin`. Vi vay Owner dang nhap se thay 0 users.

2. **Giao dien don gian**: Tab hien tai thieu nhieu thong tin chi tiet va cac hanh dong quan tri ma nguoi dung yeu cau.

### Giai phap

#### Buoc 1: Sua ham RPC `get_users_directory_stats` (Database Migration)

Thay doi dieu kien kiem tra quyen tu:
```sql
WHERE has_role(auth.uid(), 'admin')
```
thanh:
```sql
WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
```

Dieu nay cho phep ca Owner va Admin deu co the truy cap du lieu nguoi dung.

#### Buoc 2: Tao ham RPC moi cho cac hanh dong quan tri

- `toggle_user_avatar_verified`: Bat/tat huy hieu tick xanh cho user (cap nhat `avatar_verified` trong bang `profiles`)
- `freeze_user_rewards`: Treo thuong user (dat `pending_rewards = 0` va ghi log)
- `wipe_user_rewards`: Xoa tat ca phan thuong cua user (reset `total_camly_rewards`, `pending_rewards`, `approved_reward` ve 0)

#### Buoc 3: Cap nhat hook `useAdminManage.ts`

- Them cac ham moi: `toggleVerified`, `freezeRewards`, `wipeAllRewards`
- Cap nhat `fetchUsers` de su dung du lieu tu RPC da sua

#### Buoc 4: Xay dung lai `AllUsersTab.tsx`

Thiet ke lai giao dien giong trang Users Directory (Hinh 2) nhung them cot va hanh dong admin:

**Bang du lieu hien thi:**

| # | User (Avatar + Ten + Username + Badge) | Views | Likes | Comments | Shares | Tong CAMLY | Videos | Trang thai | ... (Menu) |

**Menu hanh dong "..." cho moi user (DropdownMenu):**
- Xem Profile (mo tab moi)
- Cap huy hieu tick xanh / Go huy hieu
- Treo thuong (freeze rewards)
- Xoa tat ca phan thuong (wipe all rewards)
- Ban user (voi dialog xac nhan)
- Unban user (neu da bi ban)

**Tinh nang bo sung:**
- Click vao dong de mo chi tiet (Collapsible) giong Users Directory, hien thi:
  - Phan ra CAMLY theo hoat dong (RewardBreakdownGrid)
  - Tien trinh nhan thuong (ThreeSegmentProgress)
  - Thong tin vi, ngay tham gia, so bai viet...
- Tim kiem, loc theo trang thai (Tat ca / Banned / Verified / Anomaly)
- Sap xep theo nhieu tieu chi

#### Buoc 5: Cap nhat `UsersManagementTab.tsx`

Don gian hoa component chinh, truyen them cac ham hanh dong moi vao `AllUsersTab`.

### Chi tiet ky thuat

**Tep thay doi:**

| STT | Tep / SQL | Noi dung |
|-----|-----------|----------|
| 1 | Database Migration | Sua ham `get_users_directory_stats` them dieu kien `OR has_role(auth.uid(), 'owner')` |
| 2 | Database Migration | Tao ham `toggle_user_avatar_verified`, `freeze_user_rewards`, `wipe_user_rewards` |
| 3 | `src/hooks/useAdminManage.ts` | Them ham `toggleVerified`, `freezeRewards`, `wipeAllRewards`; cap nhat interface `AdminUser` them cac truong tu RPC (views_count, likes_count, shares_count...) |
| 4 | `src/components/Admin/tabs/AllUsersTab.tsx` | Xay dung lai giao dien bang voi Collapsible, DropdownMenu hanh dong, loc va sap xep nang cao |
| 5 | `src/components/Admin/tabs/UsersManagementTab.tsx` | Truyen them cac ham hanh dong moi xuong AllUsersTab |

### Ket qua mong doi

- Owner va Admin deu thay day du danh sach 771+ users
- Bang hien thi chi tiet: Views, Likes, Comments, Shares, Tong CAMLY, Videos
- Click vao dong de xem chi tiet phan thuong
- Menu "..." voi cac hanh dong: Cap/go tick xanh, Treo thuong, Xoa thuong, Ban/Unban
- Giao dien giong trang Users Directory nhung co them cong cu quan tri

