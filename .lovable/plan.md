
# Plan: Cập nhật Trang Quản Lý Admin Team

## Tổng quan vấn đề

Từ screenshot và dữ liệu database, tôi phát hiện:
1. **Danh sách Admin đang có 5 người** (1 Owner + 4 Admin) nhưng có thể UI không hiển thị hết
2. **Tìm kiếm bằng email**: Bảng `profiles` không có trường email, email chỉ nằm trong `auth.users` (protected table). Cần tạo Edge Function để tìm kiếm an toàn
3. **Phân quyền**: Owner có thể thêm/xóa Admin, Admin chỉ được xem (không có nút xóa)

## Các thay đổi cần thực hiện

### 1. Tạo Edge Function tìm kiếm user bằng email

| File | Mục đích |
|------|----------|
| `supabase/functions/search-users-by-email/index.ts` | Tìm user bằng email từ `auth.users` (chỉ Owner mới có quyền gọi) |

Edge function này sẽ:
- Nhận `email` và `owner_id` từ request
- Xác minh người gọi là Owner qua RPC `is_owner`
- Query `auth.users` bằng service_role key để tìm email match
- Trả về profile info (không expose email trực tiếp)

### 2. Cập nhật AdminManagementTab.tsx

| Thay đổi | Chi tiết |
|----------|----------|
| Thêm tìm kiếm email | Input field riêng để tìm bằng email (chỉ hiển thị cho Owner) |
| Cập nhật search logic | Gọi edge function khi tìm bằng email |
| UI improvements | Hiển thị rõ ràng số lượng Admin/Owner, sort Owner lên đầu |
| Permission enforcement | Admin không thấy nút "Xóa Admin" cho bất kỳ ai |

### 3. Logic phân quyền rõ ràng

```text
+------------------+----------------------+----------------------+
|                  | Owner                | Admin                |
+------------------+----------------------+----------------------+
| Xem danh sách    | ✅ Có                | ✅ Có                |
| Tìm kiếm thường  | ✅ Có                | ❌ Không             |
| Tìm kiếm email   | ✅ Có                | ❌ Không             |
| Thêm Admin       | ✅ Có                | ❌ Không             |
| Xóa Admin        | ✅ Có (trừ Owner)    | ❌ Không             |
+------------------+----------------------+----------------------+
```

## Chi tiết kỹ thuật

### Edge Function: search-users-by-email

```typescript
// Pseudo-code logic
1. Verify caller is Owner (via is_owner RPC)
2. Use supabaseAdmin (service_role) to query auth.users
3. Match email with ILIKE pattern
4. Return profile data (id, username, display_name, avatar_url)
5. Filter out existing admins
```

### Cập nhật AdminManagementTab

**1. Thêm state cho email search:**
```typescript
const [emailSearch, setEmailSearch] = useState("");
const [emailSearchResults, setEmailSearchResults] = useState([]);
```

**2. UI cho Owner - có 2 cách tìm kiếm:**
- Tìm theo username/tên (như hiện tại)  
- Tìm theo email (gọi edge function)

**3. UI cho Admin:**
- Chỉ hiển thị danh sách Admin/Owner
- Không có phần "Thêm Admin Mới"
- Không có nút "Xóa Admin"

**4. Sort danh sách:**
- Owner hiển thị trước
- Admin hiển thị sau, sort theo tên

## Tóm tắt file thay đổi

| File | Loại | Mô tả |
|------|------|-------|
| `supabase/functions/search-users-by-email/index.ts` | Tạo mới | Edge function tìm user bằng email |
| `src/components/Admin/tabs/AdminManagementTab.tsx` | Cập nhật | Thêm email search, fix phân quyền |
| `supabase/config.toml` | Cập nhật | Thêm config cho edge function mới |
