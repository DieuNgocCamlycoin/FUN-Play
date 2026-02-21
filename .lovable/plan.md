

## Cập nhật 2 trang: Trang Chủ và Trang Suspended

### 1. Trang Chủ (Index.tsx) -- Ghim thanh CategoryChips + Scroll-to-top

**Vấn đề:** Thanh danh mục (Tất cả, Xu hướng, Âm nhạc...) bị cuộn mất khi kéo xuống dưới, và nút scroll-to-top chỉ hiện trên mobile.

**Giải pháp:**
- Thêm `sticky top-0 z-10` cho `CategoryChips` để thanh công cụ luôn hiển thị khi cuộn
- Hiển thị nút scroll-to-top trên cả desktop (bỏ điều kiện `isMobile` cho scroll listener và button)

### 2. Trang Suspended (SuspendedUsers.tsx) -- Sửa đề mục bảng chen ngang

**Vấn đề:** `TableHeader` đang dùng `sticky top-[200px]` -- giá trị `200px` không chính xác, khiến dòng đề mục (#, Người dùng, Ví liên kết...) bị trôi vào giữa nội dung thay vì nằm ngay dưới phần sticky header.

**Giải pháp:**
- Xóa `sticky top-[200px]` khỏi `TableHeader` (không dùng sticky riêng cho header bảng nữa, vì nó gây xung đột)
- Giữ nguyên phần sticky cho tiêu đề + search ở trên

---

### Chi tiết kỹ thuật

**File 1: `src/components/Layout/CategoryChips.tsx`**
- Thêm `sticky top-0 z-10` vào div ngoài cùng để ghim thanh danh mục khi cuộn

**File 2: `src/pages/Index.tsx`**
- Bỏ điều kiện `if (!isMobile) return;` trong useEffect scroll listener (line 75-76) để theo dõi scroll trên mọi thiết bị
- Bỏ điều kiện `isMobile &&` trong phần render nút ArrowUp (line 456) để hiện nút trên cả desktop

**File 3: `src/pages/SuspendedUsers.tsx`**
- Sửa line 118: xóa `sticky top-[200px] z-[9]` khỏi `TableHeader`, chỉ giữ `bg-background`

