

# Bổ sung Redirect Deep Links khi người dùng đổi Username

## Vấn đề hiện tại

Khi người dùng đổi username (ví dụ: `oldname` sang `newname`), trang hồ sơ `/:username` (Channel.tsx) đã có logic tra cứu `previous_username` để chuyển hướng. Tuy nhiên, các **deep link** như `/:username/video/:slug` và `/:username/post/:slug` chưa có logic này -- chúng chỉ hiển thị trang 404 "Không tìm thấy".

## Giải pháp

Bổ sung logic tra cứu `previous_username` vào cả 2 tệp `VideoBySlug.tsx` và `PostBySlug.tsx`. Khi không tìm thấy hồ sơ theo username hiện tại, hệ thống sẽ tự động tra cứu `previous_username` và chuyển hướng (replace) sang URL mới với username hiện tại.

## Luồng xử lý (sau khi bổ sung)

```text
Yêu cầu: /oldname/video/my-slug
            |
            v
  Tra cứu profiles WHERE username = 'oldname'
            |
        Không tìm thấy
            |
            v
  Tra cứu profiles WHERE previous_username = 'oldname'
            |
        Tìm thấy: username = 'newname'
            |
            v
  Chuyển hướng 301 -> /newname/video/my-slug
```

## Chi tiết kỹ thuật

### 1. Tệp: `src/pages/VideoBySlug.tsx` (dòng 31-35)

Thay thế khối `if (!profile)` hiện tại bằng logic tra cứu `previous_username`:

```typescript
if (!profile) {
  // Tra cứu previous_username để chuyển hướng (người dùng đã đổi tên)
  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("previous_username", username)
    .maybeSingle();

  if (oldProfile?.username) {
    navigate(`/${oldProfile.username}/video/${slug}`, { replace: true });
    return;
  }

  setNotFound(true);
  setLoading(false);
  return;
}
```

### 2. Tệp: `src/pages/PostBySlug.tsx` (dòng 31-35)

Thay đổi tương tự khối `if (!profile)`:

```typescript
if (!profile) {
  // Tra cứu previous_username để chuyển hướng (người dùng đã đổi tên)
  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("previous_username", username)
    .maybeSingle();

  if (oldProfile?.username) {
    navigate(`/${oldProfile.username}/post/${slug}`, { replace: true });
    return;
  }

  setNotFound(true);
  setLoading(false);
  return;
}
```

## Phạm vi thay đổi

| Tệp | Thay đổi |
|------|----------|
| `src/pages/VideoBySlug.tsx` | Thêm tra cứu `previous_username` khi không tìm thấy hồ sơ |
| `src/pages/PostBySlug.tsx` | Thêm tra cứu `previous_username` khi không tìm thấy hồ sơ |

## Lưu ý

- Mẫu thiết kế này hoàn toàn nhất quán với logic đã có trong `Channel.tsx`
- Không cần thay đổi cơ sở dữ liệu hay chính sách bảo mật -- bảng `profiles` đã có cột `previous_username` và cho phép đọc công khai
- Chuyển hướng sử dụng `navigate(..., { replace: true })` để không lưu URL cũ trong lịch sử trình duyệt (tương đương 301 phía client)

