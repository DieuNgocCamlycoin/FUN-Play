

## Them tab "Dang Hoat Dong" vao trang Quan Ly Users

### Van de

Hien tai tab "Tat Ca" hien thi ca user dang hoat dong lan user bi ban, gay kho khan khi quan ly user binh thuong.

### Giai phap

Them mot tab moi "Dang Hoat Dong" (Active) ke ben tab "Tat Ca", chi hien thi nhung user chua bi ban (`banned = false`).

### Chi tiet ky thuat

**Tep thay doi:**

| STT | Tep | Noi dung |
|-----|------|----------|
| 1 | `src/components/Admin/tabs/UsersManagementTab.tsx` | Them tab "Dang Hoat Dong" voi icon UserCheck, dem so user active, truyen danh sach user da loc (khong banned) vao AllUsersTab |

**Thay doi cu the trong `UsersManagementTab.tsx`:**

- Tinh `activeUsers = users.filter(u => !u.banned)` va `activeCount`
- Them TabsTrigger moi: "Dang Hoat Dong (activeCount)" voi icon UserCheck, dat giua "Tat Ca" va "Dang Ban"
- Them TabsContent moi su dung lai component `AllUsersTab` nhung truyen `activeUsers` thay vi `users`

**Thu tu tab moi:**
1. Tat Ca (tong so)
2. Dang Hoat Dong (so user khong bi ban) -- **MAC DINH**
3. Dang Ban (so user bi ban)
4. Xoa Nhanh

### Ket qua

- Tab "Dang Hoat Dong" la tab mac dinh khi mo trang Quan Ly Users
- Chi hien thi user chua bi ban, de quan ly nhanh hon
- Tab "Tat Ca" van giu nguyen, hien thi toan bo user
- Khong can thay doi AllUsersTab.tsx vi component nay da nhan `users` tu props

