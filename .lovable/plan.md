

## Phân Tích Lỗi: Input Mất Focus Sau Mỗi Ký Tự

### Nguyên Nhân Chính Xác

**Bug nằm ở việc định nghĩa component `PasswordInput` BÊN TRONG component `ChangePasswordForm`** (dòng 103-155).

Khi định nghĩa một React component bên trong component khác:

```typescript
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  
  // ❌ Component được định nghĩa TRONG component cha
  const PasswordInput = ({ ... }) => (
    <Input ... />
  );
  
  return <PasswordInput ... />;
}
```

**Mỗi khi state thay đổi** (ví dụ: nhập 1 ký tự → `setCurrentPassword` chạy):
1. `ChangePasswordForm` re-render
2. `PasswordInput` được **tạo lại từ đầu** (function mới)
3. React thấy đây là component **khác hoàn toàn** (reference khác)
4. React **unmount component cũ, mount component mới**
5. Input **mất focus** vì DOM element bị thay thế

### Flow Lỗi

```
User gõ "a" → setCurrentPassword("a") 
           → ChangePasswordForm re-render 
           → PasswordInput được tạo lại (new function)
           → React unmount input cũ, mount input mới
           → Input mới = mất focus
           → User phải click lại để gõ tiếp
```

---

## Giải Pháp

**Di chuyển component `PasswordInput` ra NGOÀI component `ChangePasswordForm`.**

Khi component được định nghĩa ở cấp module (ngoài function component):
- React chỉ tạo component 1 lần
- Re-render chỉ cập nhật props, không thay thế component
- Input giữ nguyên focus

---

## Thay Đổi Code

### Trước (Lỗi)
```typescript
export function ChangePasswordForm() {
  // State...
  
  // ❌ Định nghĩa bên trong - bị tạo lại mỗi render
  const PasswordInput = ({ ... }) => ( ... );
  
  return <PasswordInput ... />;
}
```

### Sau (Đúng)
```typescript
// ✅ Định nghĩa BÊN NGOÀI - chỉ tạo 1 lần
const PasswordInput = ({ ... }: PasswordInputProps) => ( ... );

export function ChangePasswordForm() {
  // State...
  
  return <PasswordInput ... />;
}
```

---

## File Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/components/Profile/ChangePasswordForm.tsx` | Di chuyển `PasswordInput` ra ngoài component chính |

---

## Chi Tiết Kỹ Thuật

1. **Tạo interface `PasswordInputProps`** ở đầu file (trước các component)

2. **Di chuyển function `PasswordInput`** từ dòng 103-155 ra trước `ChangePasswordForm`

3. Thêm React.memo (optional) để tối ưu performance thêm:
```typescript
const PasswordInput = React.memo(({ ... }: PasswordInputProps) => ( ... ));
```

---

## Kết Quả Sau Fix

- User có thể gõ liên tục mà không bị mất focus
- Input hoạt động bình thường như các input khác trong app

