
## Kế Hoạch Hoàn Thiện Admin Dashboard

### Vấn Đề Đã Xác Định

**Diệu Ngọc có role `owner` trong database nhưng Admin Dashboard chỉ kiểm tra role `admin`:**

```
Database hiện tại:
- b3f6d0d7... (Diệu Ngọc): role = owner + user  ✓
- 43631378... (Thu Trang): role = admin + user  ✓
- d06c21f9... (Thu Hà): role = admin + user  ✓
```

**Bug trong code AdminDashboard.tsx (dòng 25-38):**

```typescript
// CHỈ KIỂM TRA ROLE ADMIN - KHÔNG KIỂM TRA OWNER
const { data } = await supabase.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'   // <-- Diệu Ngọc có role "owner", KHÔNG có "admin"
});
setIsAdmin(data === true);  // FALSE cho Diệu Ngọc!
```

---

### Tổng Quan Sửa Lỗi

| File | Vấn đề | Cách sửa |
|------|--------|----------|
| `AdminDashboard.tsx` | Chỉ check `admin` | Thêm check `is_owner` |
| `AdminRewardConfig.tsx` | Chỉ check `admin` | Thêm check `is_owner` |
| `AdminVideoStats.tsx` | Chỉ check `admin` | Thêm check `is_owner` |
| `AdminClaimHistory.tsx` | Chỉ check `admin` | Thêm check `is_owner` |
| `AdminVideoApproval.tsx` | Check table thay vì RPC | Thêm check `is_owner` + dùng RPC |
| `AdminManage.tsx` | Đã check cả 2 role ✓ | Không cần sửa |

---

### Chi Tiết Sửa Lỗi

#### Bước 1: Sửa AdminDashboard.tsx (dòng 25-38)

**Trước:**
```typescript
useEffect(() => {
  const checkAdminRole = async () => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    setIsAdmin(data === true);
    setCheckingRole(false);
  };
  checkAdminRole();
}, [user]);
```

**Sau:**
```typescript
useEffect(() => {
  const checkAdminRole = async () => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    
    // Check BOTH admin and owner roles
    const { data: adminData } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    const { data: ownerData } = await supabase.rpc('is_owner', {
      _user_id: user.id,
    });
    
    setIsAdmin(adminData === true || ownerData === true);
    setCheckingRole(false);
  };
  checkAdminRole();
}, [user]);
```

---

#### Bước 2: Sửa AdminRewardConfig.tsx (dòng 36-50)

Thay thế logic check role:

```typescript
useEffect(() => {
  const checkAdminRole = async () => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    
    const { data: adminData } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    const { data: ownerData } = await supabase.rpc('is_owner', {
      _user_id: user.id,
    });
    
    setIsAdmin(adminData === true || ownerData === true);
    setCheckingRole(false);
  };
  checkAdminRole();
}, [user]);
```

---

#### Bước 3: Sửa AdminVideoStats.tsx (dòng 82-96)

Thêm check owner role tương tự.

---

#### Bước 4: Sửa AdminClaimHistory.tsx (dòng 74-88)

Thêm check owner role tương tự.

---

#### Bước 5: Sửa AdminVideoApproval.tsx (dòng 59-80)

File này check trực tiếp từ table thay vì RPC, cần sửa:

**Trước:**
```typescript
const checkAdminRole = async () => {
  if (!user) return;
  
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  
  if (data) {
    setIsAdmin(true);
    fetchVideos();
  } else {
    // Redirect...
  }
};
```

**Sau:**
```typescript
const checkAdminRole = async () => {
  if (!user) return;
  
  const { data: adminData } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });
  
  const { data: ownerData } = await supabase.rpc('is_owner', {
    _user_id: user.id,
  });
  
  if (adminData === true || ownerData === true) {
    setIsAdmin(true);
    fetchVideos();
  } else {
    // Redirect...
  }
};
```

---

### Tóm Tắt Thay Đổi

| File | Số dòng thay đổi |
|------|------------------|
| `src/pages/AdminDashboard.tsx` | ~15 dòng |
| `src/pages/AdminRewardConfig.tsx` | ~15 dòng |
| `src/pages/AdminVideoStats.tsx` | ~15 dòng |
| `src/pages/AdminClaimHistory.tsx` | ~15 dòng |
| `src/pages/AdminVideoApproval.tsx` | ~15 dòng |

---

### Kết Quả Sau Khi Sửa

| Tài khoản | Role | Truy cập Admin Dashboard |
|-----------|------|-------------------------|
| **Diệu Ngọc** | owner | ✅ VÀO ĐƯỢC |
| Thu Trang | admin | ✅ Vào được |
| Thu Hà | admin | ✅ Vào được |
| Hoangtydo | admin | ✅ Vào được |
| VŨ LINH | user | ❌ Bị từ chối (đúng) |

---

### Lưu Ý Bảo Mật

- Tất cả check quyền được thực hiện bằng **RPC functions** với `SECURITY DEFINER`
- Owner có thể truy cập mọi trang admin + quản lý admin
- Admin có thể truy cập mọi trang admin (trừ tab Quản lý Admin)
- User thường bị từ chối hoàn toàn

---

### Cha Sẽ Cập Nhật Ngay Sau Khi Con Approve Plan Này
