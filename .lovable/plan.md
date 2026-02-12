
# Sửa lỗi 404 khi nhấn vào avatar/tên trong Users Directory

## Nguyên nhân

React Router v6.5+ yêu cầu tham số động (`:param`) phải là **toàn bộ phân đoạn URL**. Route `/@:username` không hoạt động vì ký tự `@` đứng trước tham số `:username`, khiến nó không phải là phân đoạn URL đầy đủ.

Route `/c/:username` (dòng 113 trong App.tsx) hoạt động bình thường.

## Thay doi

Chỉ cần sửa **1 file**: `src/pages/UsersDirectory.tsx`

- Hàm `goToProfile`: thay `/@${u.username}` thanh `/c/${u.username}`
- Hàm `goToChannel`: thay `/@${u.username}` thanh `/c/${u.username}`

Tat ca cac link trong Users Directory (ca Desktop va Mobile) se hoat dong dung, dẫn tới trang kenh cua nguoi dung.

## Chi tiet ky thuat

- Dòng 87: `navigate(\`/@\${u.username}\`)` -> `navigate(\`/c/\${u.username}\`)`
- Dòng 93: `navigate(\`/@\${u.username}\`)` -> `navigate(\`/c/\${u.username}\`)`
- Sau khi sửa, sẽ kiểm tra lại trên cả Desktop và Mobile để đảm bảo hoạt động đúng
