

## Sửa mapping "Không công khai" và đồng bộ visibility

### Vấn đề
- `CreatePlaylistModal` hỗ trợ 3 chế độ: Công khai (`true`), Không công khai (`null`), Riêng tư (`false`)
- `StudioPlaylists` chỉ có 2 chế độ: Công khai và Riêng tư, và coi `null` (Không công khai) = Công khai --> sai

### Giải pháp
Sửa **1 file duy nhất**: `src/components/Studio/StudioPlaylists.tsx`

Không cần thay đổi database hay `CreatePlaylistModal` -- chúng đã hoạt động đúng.

### Chi tiết thay đổi

**1. Thêm icon `Link2` vào import** (dòng 10)
- Thêm `Link2` để dùng cho trạng thái "Không công khai"

**2. Sửa state `isPublic`** (dòng 49)
- Đổi từ `boolean` sang `"public" | "unlisted" | "private"` để hỗ trợ 3 trạng thái
- Mặc định: `"public"`

**3. Sửa `handleOpenDialog`** (dòng 95-108)
- Khi mở dialog chỉnh sửa, đọc `is_public` từ playlist:
  - `true` --> `"public"`
  - `null` --> `"unlisted"`  
  - `false` --> `"private"`

**4. Sửa `handleSave`** (dòng 126-147)
- Map ngược visibility sang `is_public`:
  - `"public"` --> `true`
  - `"unlisted"` --> `null`
  - `"private"` --> `false`

**5. Sửa `handleToggleVisibility`** (dòng 197-220)
- Thay vì toggle 2 trạng thái, xoay vòng 3 trạng thái: public --> unlisted --> private --> public
- Toast message hiển thị đúng trạng thái mới

**6. Sửa phần hiển thị visibility trong danh sách** (dòng 283-294)
- Thêm trường hợp `is_public === null`: hiện icon Link2 + "Không công khai" (màu vàng/cam)
- `true`: Globe + "Công khai" (xanh)
- `false`: Lock + "Riêng tư" (xám)

**7. Sửa nút toggle visibility** (dòng 321)
- Icon thay đổi theo 3 trạng thái thay vì 2

**8. Sửa Select trong dialog tạo/sửa** (dòng 375-383)
- Thêm option "Không công khai - Ai có link đều xem được"
- Đổi value/onChange để dùng 3 giá trị

