

# Thêm cập nhật thời gian thực cho Users Directory

## Vấn đề hiện tại

Trang Users Directory chỉ tải dữ liệu 1 lần khi mở trang. Khi có người dùng khác like hoặc comment, số liệu không tự động cập nhật mà phải tải lại trang.

## Giải pháp

Thêm Realtime listener vào hook `usePublicUsersDirectory` để lắng nghe thay đổi từ các bảng `likes`, `comments`, và `reward_transactions`. Khi có thay đổi, tự động gọi lại RPC để cập nhật số liệu.

## Tệp thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/hooks/usePublicUsersDirectory.ts` | Thêm Supabase Realtime listener với debounce 2 giây |

## Chi tiết kỹ thuật

### Cách hoạt động

- Lắng nghe `postgres_changes` trên 3 bảng: `likes`, `comments`, `reward_transactions`
- Khi có bất kỳ thay đổi nào (INSERT, UPDATE, DELETE), đợi 2 giây (debounce) rồi gọi lại `fetchData()`
- Debounce giúp tránh gọi RPC quá nhiều lần khi có nhiều thay đổi liên tiếp
- Tự động hủy đăng ký khi rời khỏi trang

### Cấu trúc code mới

```text
useEffect(() => {
  const channel = supabase
    .channel('users-directory-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, debouncedRefetch)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, debouncedRefetch)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_transactions' }, debouncedRefetch)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

Lưu ý: Các bảng `likes`, `comments`, `reward_transactions` đã được thêm vào `supabase_realtime` publication nên không cần migration thêm.

