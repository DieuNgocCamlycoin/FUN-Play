

# Cải thiện Users Directory: Mobile Nav + Bộ lọc thời gian

## Kết quả kiểm tra trang /users

Trang `/users` hoạt động tốt khi chưa đăng nhập:
- Hiển thị 247 thành viên hoạt động
- Bảng desktop với avatar, tên, CAMLY, Views, Videos, Comments, Donated, FUN
- Tìm kiếm và sắp xếp hoạt động bình thường
- Sidebar đã có link "Users Directory"

## Thay doi 1: Them link vao MobileDrawer

Them muc "Users Directory" vao phan `mainNavItems` trong `MobileDrawer.tsx`, ngay sau "Kenh dang ky", voi icon `Users` (hoac `Globe` cho dong bo voi sidebar).

## Thay doi 2: Bo loc thoi gian tham gia

Them Select dropdown moi ben canh dropdown sap xep trong `UsersDirectory.tsx`:
- **Tat ca** (mac dinh) - hien tat ca users
- **Tuan nay** - chi users tham gia trong 7 ngay gan nhat
- **Thang nay** - chi users tham gia trong 30 ngay gan nhat  
- **3 thang** - chi users tham gia trong 90 ngay gan nhat

Logic loc se dua tren truong `created_at` cua moi user, loc phia client (du lieu da co san tu RPC).

## Tep thay doi

| # | Tep | Thay doi |
|---|------|----------|
| 1 | `src/components/Layout/MobileDrawer.tsx` | Them "Users Directory" vao mainNavItems |
| 2 | `src/pages/UsersDirectory.tsx` | Them dropdown loc theo thoi gian tham gia |

## Chi tiet ky thuat

### MobileDrawer - Them nav item

Them vao mang `mainNavItems` (dong 37-42):
```text
{ icon: Users, label: "Users Directory", href: "/users" }
```
(Icon `Users` da duoc import san trong file)

### UsersDirectory - Bo loc thoi gian

- Them state `timeFilter` voi cac gia tri: `"all"`, `"week"`, `"month"`, `"3months"`
- Trong `useMemo` filtered, them buoc loc theo `created_at`:
  - `"week"`: `created_at >= now - 7 ngay`
  - `"month"`: `created_at >= now - 30 ngay`
  - `"3months"`: `created_at >= now - 90 ngay`
- Them 1 Select dropdown moi ben canh dropdown sap xep hien tai
- Hien thi so luong ket qua sau khi loc (thay doi dong "X thanh vien hoat dong")

