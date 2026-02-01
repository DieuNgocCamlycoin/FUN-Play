

## Thêm Tính Năng Đổi Mật Khẩu Trong Profile Settings

### Tại Sao Cần Thêm?

Hiện tại user chỉ có thể đổi mật khẩu qua flow "Quên mật khẩu" từ trang đăng nhập. Điều này **không tiện** vì:
1. User đã đăng nhập phải logout mới reset được
2. Phải chờ email
3. Không có cách đổi mật khẩu trực tiếp khi đã biết mật khẩu cũ

### Giải Pháp

Thêm một section **"Bảo Mật"** trong trang Profile Settings với form đổi mật khẩu:

```
┌─────────────────────────────────────────┐
│  🔒 Bảo Mật                             │
├─────────────────────────────────────────┤
│  Mật khẩu hiện tại: [____________]      │
│  Mật khẩu mới:      [____________] 👁   │
│  Xác nhận mật khẩu: [____________] 👁   │
│                                         │
│           [ Đổi Mật Khẩu ]              │
└─────────────────────────────────────────┘
```

### Chi Tiết Kỹ Thuật

**1. Tạo component `ChangePasswordForm.tsx`**

| Trường | Mô tả |
|--------|-------|
| `currentPassword` | Mật khẩu hiện tại (bắt buộc xác thực) |
| `newPassword` | Mật khẩu mới (min 6 ký tự) |
| `confirmPassword` | Xác nhận mật khẩu mới (phải trùng khớp) |

**Logic xử lý:**
```typescript
// Bước 1: Xác thực mật khẩu cũ bằng cách re-authenticate
const { error: authError } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: currentPassword,
});

if (authError) {
  // Mật khẩu hiện tại sai
  throw new Error("Mật khẩu hiện tại không đúng");
}

// Bước 2: Cập nhật mật khẩu mới
const { error: updateError } = await supabase.auth.updateUser({
  password: newPassword,
});

if (updateError) throw updateError;

// Thành công!
toast({ title: "Đổi mật khẩu thành công!" });
```

**2. Validation Rules**
- Mật khẩu hiện tại: Bắt buộc nhập
- Mật khẩu mới: Tối thiểu 6 ký tự
- Xác nhận: Phải trùng với mật khẩu mới
- Cảnh báo nếu có khoảng trắng đầu/cuối

**3. Tích hợp vào ProfileSettings.tsx**

Thêm section mới sau phần "Cài đặt thông báo giọng nói":
```tsx
{/* Security Section */}
<div className="border-t border-border pt-6 mt-6">
  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
    <Lock className="h-5 w-5" />
    Bảo Mật
  </h3>
  <ChangePasswordForm userEmail={user?.email || ""} />
</div>
```

---

### Files Cần Tạo/Chỉnh Sửa

| File | Hành động |
|------|-----------|
| `src/components/Profile/ChangePasswordForm.tsx` | **Tạo mới** - Form đổi mật khẩu độc lập |
| `src/pages/ProfileSettings.tsx` | **Chỉnh sửa** - Thêm section Bảo Mật |

---

### Giao Diện Sau Khi Hoàn Thành

```
Profile Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Display Name: [_______________]
Wallet Address: [_______________]
Avatar: [Drag & Drop]
Banner: [Drag & Drop]  
Bio: [_______________]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cài đặt thông báo giọng nói "RICH"
Music URL: [_______________]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Bảo Mật                    ← MỚI!

Mật khẩu hiện tại: [_______________]
Mật khẩu mới:      [_______________] 👁
Xác nhận:          [_______________] 👁

         [ Đổi Mật Khẩu ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Cancel]                        [Save]
```

---

### Bảo Mật

1. **Yêu cầu mật khẩu cũ**: Đảm bảo chỉ chủ tài khoản mới đổi được
2. **Re-authenticate trước khi update**: Gọi `signInWithPassword` để xác thực
3. **Không lưu mật khẩu vào state lâu**: Clear form sau khi submit

