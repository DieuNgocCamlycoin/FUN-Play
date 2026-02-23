

## Thêm Tab "Đã Xác Minh" và nút Cấp/Gỡ tick xanh trên trang Profile

### 1. Tab "Đã Xác Minh" trong Admin Panel (Quản Lý Users)

**File: `src/components/Admin/tabs/UsersManagementTab.tsx`**

Thêm tab mới "Đã Xác Minh" vào `TabsList`, lọc users có `avatar_verified === true` và truyền vào `AllUsersTab` (tái sử dụng component hiện có):

```typescript
<TabsTrigger value="verified" className="gap-1 text-xs">
  <ShieldCheck className="w-3 h-3" /> Đã Xác Minh ({users.filter(u => u.avatar_verified).length})
</TabsTrigger>

<TabsContent value="verified">
  <AllUsersTab
    users={users.filter(u => u.avatar_verified)}
    onBan={banUser}
    onUnban={unbanUser}
    onToggleVerified={toggleVerified}
    onFreezeRewards={freezeRewards}
    onWipeRewards={wipeAllRewards}
    actionLoading={actionLoading}
  />
</TabsContent>
```

Tái sử dụng hoàn toàn `AllUsersTab` (đã có sẵn search, export CSV, dropdown actions) -- không cần tạo component mới.

### 2. Nút Cấp/Gỡ tick xanh trên trang Profile (dành cho Admin)

**File: `src/components/Admin/AdminChannelActions.tsx`**

Thêm nút "Cấp tick xanh" / "Gỡ tick xanh" vào dropdown menu hiện tại (cùng chỗ với Suspend và Gửi cảnh báo). Cần:

- Thêm props `isVerified` (boolean) vào `AdminChannelActionsProps`
- Fetch trạng thái `is_verified` từ bảng `channels` khi component mount
- Gọi RPC `toggle_user_avatar_verified` khi admin click
- Hiển thị menu item với icon `ShieldCheck` (cấp) hoặc `ShieldOff` (gỡ)

**File: `src/components/Profile/ProfileInfo.tsx`**

Không cần thay đổi -- `AdminChannelActions` sẽ tự quản lý state nội bộ.

### Chi tiết kỹ thuật

**AdminChannelActions.tsx** -- thêm vào dropdown:
- State mới: `channelVerified` (boolean), fetch từ `channels` table theo `targetUserId`
- Handler `handleToggleVerified`: gọi `supabase.rpc("toggle_user_avatar_verified", { p_admin_id, p_user_id })`, sau khi thanh cong reload trang
- Menu item mới giua "Gửi cảnh báo" va separator:

```typescript
<DropdownMenuItem onClick={handleToggleVerified} disabled={actionLoading}>
  {channelVerified 
    ? <><ShieldOff className="w-4 h-4 mr-2" /> Gỡ tick xanh</>
    : <><ShieldCheck className="w-4 h-4 mr-2 text-blue-500" /> Cấp tick xanh</>
  }
</DropdownMenuItem>
```

### Tong ket cac file thay doi

| File | Thay doi |
|------|---------|
| `src/components/Admin/tabs/UsersManagementTab.tsx` | Them tab "Da Xac Minh" |
| `src/components/Admin/AdminChannelActions.tsx` | Them nut cap/go tick xanh vao dropdown |

