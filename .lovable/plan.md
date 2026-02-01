

## Sửa Lỗi: Không Chuyển Trang Sau Khi Đăng Nhập Lại

### Nguyên Nhân Gốc

Sau khi user đặt mật khẩu mới thành công và đăng nhập lại, hệ thống **không tự động chuyển về trang chủ** vì:

1. **`isRecoveryRef.current` không được reset**: Khi hoàn thành đặt mật khẩu, callback `onSuccess` chỉ đổi state `setIsPasswordRecovery(false)` nhưng **KHÔNG reset ref** `isRecoveryRef.current = false`

2. **Logic redirect bị skip**: Khi user đăng nhập lại, trong `onAuthStateChange`:
   ```typescript
   if (isRecoveryRef.current) {  // ← Vẫn là true!
     return; // Skip redirect về "/"
   }
   ```

### Giải Pháp

Reset `isRecoveryRef.current = false` khi user hoàn thành đặt mật khẩu.

### Thay Đổi Cần Thực Hiện

**File:** `src/pages/Auth.tsx`

**Vị trí:** Callback `onSuccess` của `SetNewPasswordForm` (khoảng dòng 306-313)

**Trước:**
```typescript
onSuccess={() => {
  setIsPasswordRecovery(false);
  toast({
    title: "Mật khẩu đã được cập nhật!",
    description: "Hãy đăng nhập với mật khẩu mới.",
  });
  setSuccessMessage("Mật khẩu đã được đặt lại thành công!");
}}
```

**Sau:**
```typescript
onSuccess={() => {
  isRecoveryRef.current = false;  // ✅ THÊM: Reset ref để cho phép redirect
  setIsPasswordRecovery(false);
  toast({
    title: "Mật khẩu đã được cập nhật!",
    description: "Hãy đăng nhập với mật khẩu mới.",
  });
  setSuccessMessage("Mật khẩu đã được đặt lại thành công!");
}}
```

**Cũng cần sửa callback `onBackToLogin`** (khoảng dòng 314-317):
```typescript
onBackToLogin={async () => {
  isRecoveryRef.current = false;  // ✅ THÊM: Reset ref nếu user quay lại
  await supabase.auth.signOut();
  setIsPasswordRecovery(false);
}}
```

---

### Flow Sau Khi Fix

```
User click link recovery 
→ isRecoveryRef = true (block redirect)
→ Hiện form đặt mật khẩu mới
→ User nhập mật khẩu mới → Submit
→ signOut() chạy
→ onSuccess() được gọi:
   → isRecoveryRef = false ✅ (cho phép redirect lại)
   → Hiện form đăng nhập
→ User nhập email/password → Đăng nhập
→ onAuthStateChange SIGNED_IN:
   → isRecoveryRef = false → KHÔNG skip redirect
   → navigate("/") ✅ → Về trang chủ!
```

---

### File Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/pages/Auth.tsx` | Reset `isRecoveryRef.current = false` trong cả `onSuccess` và `onBackToLogin` callbacks |

