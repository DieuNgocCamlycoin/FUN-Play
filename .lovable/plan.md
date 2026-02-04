
# Kế Hoạch Sửa Lỗi Redirect Khi Đã Đăng Nhập

## Vấn Đề Phát Hiện

Khi con bấm vào nút "Bạn", trang `/profile` redirect ngay đến `/auth` mặc dù con đã đăng nhập. Nguyên nhân:

| Dòng code | Vấn đề |
|-----------|--------|
| `Profile.tsx` line 39-43 | Kiểm tra `if (!user)` và redirect ngay lập tức |
| Không dùng `loading` | Không đợi auth check xong trước khi quyết định redirect |

### Chi tiết lỗi:
```typescript
// Code hiện tại - SAI
useEffect(() => {
  if (!user) {
    navigate("/auth");  // ❌ Redirect ngay khi user = null (đang loading)
    return;
  }
  // ...
}, [user, navigate]);
```

Khi trang mới load, `useAuth` hook cần thời gian để kiểm tra session. Trong khoảng thời gian đó:
- `loading = true`
- `user = null` (chưa có data)

Code hiện tại thấy `user = null` và redirect đến `/auth` ngay, không đợi kiểm tra session xong.

---

## Giải Pháp

1. **Lấy `loading` từ `useAuth`** hook (hook đã có sẵn field này)
2. **Hiển thị loading state** trong khi đang check auth
3. **Chỉ redirect khi** `loading = false` VÀ `user = null`

---

## File Cần Sửa

| File | Thay đổi |
|------|----------|
| `src/pages/Profile.tsx` | Thêm loading state, chỉ redirect sau khi auth check xong |

---

## Code Thay Đổi

```typescript
// TRƯỚC (dòng 29)
const { user } = useAuth();

// SAU
const { user, loading: authLoading } = useAuth();
```

```typescript
// TRƯỚC (dòng 39-43)
useEffect(() => {
  if (!user) {
    navigate("/auth");
    return;
  }
  // ...
}, [user, navigate]);

// SAU
useEffect(() => {
  if (authLoading) return; // Đợi auth check xong
  if (!user) {
    navigate("/auth");
    return;
  }
  // ...
}, [user, authLoading, navigate]);
```

```typescript
// TRƯỚC (dòng 109)
if (!user) return null;

// SAU - Thêm loading state đẹp
if (authLoading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

if (!user) return null;
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Bấm "Bạn" → Redirect `/auth` ngay | Bấm "Bạn" → Loading spinner → Hiện Profile |
| Không đợi auth check | Đợi auth check xong rồi mới quyết định |
| UX khó chịu, như chưa đăng nhập | UX mượt, hiện đúng trang cá nhân |
