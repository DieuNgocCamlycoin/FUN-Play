

## Thêm mục "Trang cá nhân" vào menu dropdown avatar

### Vấn đề
Khi bấm vào avatar ở góc phải trên, menu chỉ hiển thị: "Bảng điều khiển", "Cài đặt tài khoản" và "Đăng xuất". Không có cách nào để truy cập nhanh vào trang cá nhân từ menu này.

### Giải pháp
Thêm mục **"Trang cá nhân"** vào menu dropdown avatar trên cả giao diện **mobile** (`MobileHeader.tsx`) và **desktop** (`Header.tsx`). Khi bấm vào, sẽ chuyển đến trang `/@username` của người dùng hiện tại.

### Chi tiết kỹ thuật

**File chỉnh sửa:**

1. **`src/components/Layout/MobileHeader.tsx`** (dòng 201-205):
   - Thêm mục "Trang cá nhân" với icon `User` từ lucide-react, đặt **trước** "Cài đặt tài khoản"
   - Điều hướng đến `/@${profile?.username}` hoặc `/profile` nếu chưa có username
   - Sử dụng hook `useProfile` đã có sẵn để lấy username

2. **`src/components/Layout/Header.tsx`** (dòng tương ứng):
   - Thêm mục tương tự vào menu dropdown trên desktop

### Kết quả mong đợi
Khi bấm vào avatar → menu hiển thị thêm mục "Trang cá nhân" → bấm vào sẽ đưa bạn đến trang cá nhân của mình.
