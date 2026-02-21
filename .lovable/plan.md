
## Nâng cấp trang Danh sách Đình chỉ (/suspended)

### 1. Thêm nút sao chép mã ví
- Thêm icon `Copy` (từ lucide-react) phía trước mỗi mã ví (cả blacklisted wallets lẫn historical wallets)
- Khi bấm vào icon, sao chép toàn bộ địa chỉ ví vào clipboard và hiển thị thông báo toast "Đã sao chép"
- Icon nhỏ gọn, màu nhạt, hover sáng lên

### 2. Ghim phần header (sticky header)
- Ghim phần tiêu đề "Danh sách đình chỉ", mô tả, thanh tìm kiếm, và dòng header của bảng (#, Người dùng, Ví liên kết...) lại khi cuộn xuống
- Sử dụng CSS `sticky top-0` với `z-index` phù hợp và background color để không bị nội dung chồng lên

### 3. Nút "Scroll to top"
- Thêm nút mũi tên (icon `ArrowUp`) ở góc phải dưới màn hình
- Chỉ hiển thị khi đã cuộn xuống (ví dụ > 300px)
- Khi bấm, cuộn mượt về đầu trang
- Nút có style tròn, nổi (fixed position), có hiệu ứng fade in/out

### Chi tiết kỹ thuật

**File thay đổi:** `src/pages/SuspendedUsers.tsx`

- Import thêm: `Copy`, `ArrowUp` từ `lucide-react`; `useEffect` từ React; `toast` từ `sonner`
- Tạo hàm `copyToClipboard(address)` dùng `navigator.clipboard.writeText()` + toast thông báo
- Thêm nút Copy trước mỗi `<code>` hiển thị mã ví (2 chỗ: blacklisted wallets và historical wallets)
- Bọc phần header + search trong `div` có class `sticky top-[64px] z-10 bg-background pb-4` (top-[64px] để tránh đè lên header chính của MainLayout)
- Cho `TableHeader` thêm class `sticky` tương ứng
- Thêm state `showScrollTop` + `useEffect` lắng nghe sự kiện scroll
- Render nút `ArrowUp` fixed ở `bottom-6 right-6` khi `showScrollTop = true`, onClick cuộn về đầu trang
