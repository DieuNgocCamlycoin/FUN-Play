
# Rút gọn placeholder ô tìm kiếm thành "Tìm kiếm"

## Tình trạng hiện tại

- **Desktop** (`src/components/Layout/Header.tsx`, dòng 166): placeholder là `"Tìm kiếm hoặc dán link YouTube..."` — quá dài, cần đổi.
- **Mobile** (`src/components/Layout/MobileHeader.tsx`, dòng 416): placeholder là `"Tìm kiếm video..."` — cũng cần đổi cho đồng nhất.

## Danh sách thay đổi

### 1. `src/components/Layout/Header.tsx` (dòng 166)
- **Hiện tại:** `placeholder="Tìm kiếm hoặc dán link YouTube..."`
- **Sau:** `placeholder="Tìm kiếm"`

### 2. `src/components/Layout/MobileHeader.tsx` (dòng 416)
- **Hiện tại:** `placeholder="Tìm kiếm video..."`
- **Sau:** `placeholder="Tìm kiếm"`

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 2 file |
| Tổng thay đổi | 2 chỗ |
| Cơ sở dữ liệu | Không |
| Đồng bộ Mobile | Có |

## Kết quả

- Ô tìm kiếm trên cả Desktop và Mobile sẽ hiển thị placeholder ngắn gọn: **"Tìm kiếm"**
- Chức năng tìm kiếm và dán link YouTube vẫn hoạt động bình thường (chỉ thay đổi placeholder, không ảnh hưởng logic)
