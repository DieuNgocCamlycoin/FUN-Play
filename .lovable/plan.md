
## Hệ Thống Phân Quyền Owner / Admin

### Tổng Quan Yêu Cầu

| Role | Quyền |
|------|-------|
| **Owner** (Diệu Ngọc) | Truy cập Admin Dashboard + Thêm/Xóa Admin |
| **Admin** (Thu Trang, Thu Hà, hoangtydo88) | Truy cập Admin Dashboard, KHÔNG thể thêm/xóa Admin |

---

### Thông Tin Tài Khoản

| Email | Tên hiển thị | User ID | Role mới |
|-------|--------------|---------|----------|
| dieungoc.happycamlycoin@gmail.com | Angel Diệu Ngọc là | `b3f6d0d7-fee7-4988-a8f8-3cd97b6f86c9` | **owner** |
| trang393934@gmail.com | Thu Trang | `43631378-8238-4967-b661-c93f89d03bb9` | admin |
| nguyenha2340@gmail.com | Angel Thu Ha | `d06c21f9-a612-4d0e-8d22-05e89eb5120d` | admin |
| (hoangtydo88) | Hoangtydo | `9372717d-424c-40fa-8d38-c5b757cf85a3` | admin (đã có) |

---

### Các Bước Thực Hiện

#### Bước 1: Thêm role `owner` vào enum `app_role`

Hiện tại enum chỉ có: `admin`, `moderator`, `user`

```sql
ALTER TYPE public.app_role ADD VALUE 'owner';
```

---

#### Bước 2: Tạo function kiểm tra owner

```sql
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;
```

---

#### Bước 3: Cấp quyền cho các tài khoản

```sql
-- Cấp role OWNER cho Diệu Ngọc
INSERT INTO user_roles (user_id, role) VALUES
  ('b3f6d0d7-fee7-4988-a8f8-3cd97b6f86c9', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;

-- Cấp role ADMIN cho Thu Trang và Thu Hà
INSERT INTO user_roles (user_id, role) VALUES
  ('43631378-8238-4967-b661-c93f89d03bb9', 'admin'),
  ('d06c21f9-a612-4d0e-8d22-05e89eb5120d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

#### Bước 4: Tạo component quản lý Admin

**File mới:** `src/components/Admin/tabs/AdminManagementTab.tsx`

Chức năng:
- Hiển thị danh sách tất cả Admin + Owner
- Owner có thể:
  - Thêm Admin mới (tìm user theo username/email → assign role admin)
  - Xóa Admin (remove role admin)
- Admin thường:
  - Chỉ xem danh sách, không có nút thêm/xóa

---

#### Bước 5: Tạo database functions cho Owner

```sql
-- Function: Thêm admin mới (chỉ Owner được gọi)
CREATE OR REPLACE FUNCTION public.add_admin_role(
  p_owner_id uuid, 
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner(p_owner_id) THEN
    RAISE EXCEPTION 'Only owners can add admins';
  END IF;
  
  INSERT INTO user_roles (user_id, role)
  VALUES (p_target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Function: Xóa admin (chỉ Owner được gọi)
CREATE OR REPLACE FUNCTION public.remove_admin_role(
  p_owner_id uuid, 
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner(p_owner_id) THEN
    RAISE EXCEPTION 'Only owners can remove admins';
  END IF;
  
  -- Không cho xóa Owner
  IF public.is_owner(p_target_user_id) THEN
    RAISE EXCEPTION 'Cannot remove owner role';
  END IF;
  
  DELETE FROM user_roles 
  WHERE user_id = p_target_user_id AND role = 'admin';
  
  RETURN true;
END;
$$;
```

---

#### Bước 6: Cập nhật Admin Dashboard UI

Thêm tab "Quản lý Admin" vào `AdminManage.tsx`:
- Chỉ hiển thị nếu user là `owner` HOẶC `admin`
- Các nút thêm/xóa chỉ hiển thị nếu user là `owner`

---

### Sơ Đồ Phân Quyền

```text
┌──────────────────────────────────────────────────────────┐
│                    FUN Play Admin System                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  OWNER (Diệu Ngọc)                                       │
│  ├── ✅ Truy cập Admin Dashboard                         │
│  ├── ✅ Quản lý Users, Videos, Rewards                   │
│  ├── ✅ Xem tất cả thống kê                              │
│  ├── ✅ THÊM Admin mới                                   │
│  └── ✅ XÓA Admin                                        │
│                                                          │
│  ADMIN (Thu Trang, Thu Hà, hoangtydo88)                  │
│  ├── ✅ Truy cập Admin Dashboard                         │
│  ├── ✅ Quản lý Users, Videos, Rewards                   │
│  ├── ✅ Xem tất cả thống kê                              │
│  ├── ❌ KHÔNG thể thêm Admin                             │
│  └── ❌ KHÔNG thể xóa Admin                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Tóm Tắt File Thay Đổi

| File | Thay đổi |
|------|----------|
| **Database Migration** | Thêm role `owner` vào enum, tạo functions |
| `src/components/Admin/tabs/AdminManagementTab.tsx` | **MỚI** - UI quản lý admin |
| `src/pages/AdminManage.tsx` | Thêm tab "Quản lý Admin" |
| `src/hooks/useAdminManage.ts` | Thêm functions addAdmin, removeAdmin |

---

### Bảo Mật

1. **Server-side validation**: Tất cả actions thêm/xóa admin được validate trong database function với `SECURITY DEFINER`
2. **Role-based check**: UI ẩn nút thêm/xóa cho non-owner, nhưng backend vẫn validate
3. **Cannot remove owner**: Function `remove_admin_role` kiểm tra không cho xóa owner

---

### Kết Quả Mong Đợi

Sau khi implement:
- Diệu Ngọc (Owner): Thấy tab "Quản lý Admin", có thể thêm/xóa admin
- Thu Trang, Thu Hà, hoangtydo88 (Admin): Truy cập Admin Dashboard đầy đủ, nhưng KHÔNG thấy nút thêm/xóa admin
