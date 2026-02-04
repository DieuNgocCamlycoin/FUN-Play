
# Kế Hoạch Sửa Lỗi Hiển Thị Tên và Redirect

## Vấn Đề 1: Tên hiển thị sai "Angel Diệu Ngọc's Channel"

### Nguyên nhân
- Database bảng `channels` lưu tên kênh là "Angel Diệu Ngọc's Channel"
- Trang Channel.tsx hiển thị trực tiếp `channel.name` thay vì `profile.display_name`

### Giải pháp
Ưu tiên hiển thị `profile.display_name` nếu có, fallback về `channel.name`

| File | Dòng | Thay đổi |
|------|------|----------|
| `src/pages/Channel.tsx` | 427-429 | Đổi từ `channel.name` → `profile?.display_name || channel.name` |

---

## Vấn Đề 2: Redirect về /auth dù đã đăng nhập

### Nguyên nhân
Giống lỗi Profile.tsx trước đó - không đợi auth check xong trước khi redirect

### Các file cần sửa

| File | Vấn đề |
|------|--------|
| `src/pages/ManagePlaylists.tsx` | Dòng 54-58: `if (!user) navigate("/auth")` không check `loading` |
| `src/pages/YourVideosMobile.tsx` | Dòng 50-54: `if (!user) navigate("/auth")` không check `loading` |

---

## Chi Tiết Sửa Đổi

### 1. ManagePlaylists.tsx

```typescript
// TRƯỚC (dòng 50-60)
const { user } = useAuth();

useEffect(() => {
  if (!user) {
    navigate("/auth");
    return;
  }
  fetchPlaylists();
}, [user, navigate]);

// SAU
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return; // Đợi auth check xong
  if (!user) {
    navigate("/auth");
    return;
  }
  fetchPlaylists();
}, [user, authLoading, navigate]);

// Thêm loading state trước khi render
if (authLoading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
```

### 2. YourVideosMobile.tsx

```typescript
// TRƯỚC (dòng 41 và 50-54)
const { user } = useAuth();

useEffect(() => {
  if (!user) {
    navigate("/auth");
    return;
  }
  // ...
}, [user, navigate]);

// SAU
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return; // Đợi auth check xong
  if (!user) {
    navigate("/auth");
    return;
  }
  // ...
}, [user, authLoading, navigate]);

// Thêm loading state
if (authLoading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
```

### 3. Channel.tsx - Hiển thị tên đúng

```typescript
// TRƯỚC (dòng 427-429)
<h1 className="text-3xl font-bold text-foreground mb-1">
  {channel.name}
</h1>

// SAU - Ưu tiên display_name từ profile
<h1 className="text-3xl font-bold text-foreground mb-1">
  {profile?.display_name || channel.name.replace("'s Channel", "")}
</h1>
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Tên hiển thị "Angel Diệu Ngọc's Channel" | Chỉ hiện "Angel Diệu Ngọc" |
| Bấm "Tạo playlist" → Redirect /auth | Hiện trang quản lý playlist |
| Bấm "Video của bạn" → Redirect /auth | Hiện trang video của bạn |
| UX khó chịu, như chưa đăng nhập | Chuyển trang mượt mà |
