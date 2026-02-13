

# Nâng Cấp Trang Users Directory -- Hiển Thị Chi Tiết & Header Cố Định

## Thay đổi chính

### 1. Desktop: Thêm cột hoạt động vào bảng chính + Header cố định

Thêm các cột trực tiếp vào bảng (không cần mở rộng mới thấy):
- **Lượt xem** (views_count)
- **Lượt thích** (likes_count)  
- **Bình luận** (comments_count)
- **Chia sẻ** (shares_count)
- **Upload** (videos_count -- đã có, giữ nguyên)

Header bảng sẽ được cố định (sticky) khi cuộn xuống bằng CSS `sticky top-0 z-10 bg-background`.

### 2. Mobile: Hiển thị stats ngay trên thẻ chính (không cần mở rộng)

Thêm một hàng nhỏ gọn ngay dưới tên user hiển thị:
- 👁 Views | 👍 Likes | 💬 Comments | 🔗 Shares  

Các số liệu này hiển thị ngay mà không cần bấm mở rộng, giúp người dùng thấy được hoạt động tổng quan ngay lập tức.

### 3. Realtime

Hook `usePublicUsersDirectory` đã có sẵn Realtime listener trên `likes`, `comments`, `reward_transactions` với debounce 2 giây -- không cần thay đổi.

## Chi tiết kỹ thuật

| Tệp | Thay đổi |
|------|----------|
| `src/pages/UsersDirectory.tsx` | Thêm cột stats vào desktop table, thêm stats mini vào mobile cards, sticky header |
| `src/components/ui/table.tsx` | Không cần sửa -- dùng className trực tiếp trên TableHeader |

### Desktop Table -- Cấu trúc mới

```
# | User | Views | Likes | Comments | Shares | Tổng CAMLY | Videos | FUN | ▼
```

Header cố định: `<TableHeader className="sticky top-0 z-10 bg-background">`

### Mobile Card -- Cấu trúc mới

```
[Avatar] Tên user              10.5K CAMLY
         @username             
         👁 500  👍 120  💬 45  🔗 30
```

Stats hiển thị trực tiếp, vẫn giữ phần mở rộng cho chi tiết CAMLY breakdown.

