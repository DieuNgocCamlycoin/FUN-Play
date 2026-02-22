

## 3 thay đổi cần thực hiện

### 1. Sửa link Angel AI
Thay đổi pattern validation của Angel AI từ `https://angel.ai/` thành `https://angel.fun.rich/` trong mảng `socialPlatforms`.

**File: `src/pages/ProfileSettings.tsx`**
- Pattern: `["https://angel.ai/"]` -> `["https://angel.fun.rich/"]`
- Placeholder: `"https://angel.ai/profile"` -> `"https://angel.fun.rich/username"`

### 2. Tăng kích thước viên kim cương lên 1.5x
Hiện tại kim cương có kích thước `width="28" height="28"` (mobile) và class `md:w-8 md:h-8` (desktop = 32px).

Tăng 1.5x:
- Mobile: 28 -> 42 (`width="42" height="42"`)
- Desktop: 32 -> 48 (`md:w-12 md:h-12`)
- SVG viewBox giữ nguyên `0 0 32 32`
- Điều chỉnh vị trí `-top` để kim cương vẫn nằm đúng trên avatar

**File: `src/components/Profile/DiamondBadge.tsx`**

### 3. Xóa FUN Play khỏi danh sách mạng xã hội
FUN Play là nền tảng của chính mình (play.fun.rich), không cần cho người dùng thêm link. Xóa dòng FUN Play khỏi mảng `socialPlatforms`.

**File: `src/pages/ProfileSettings.tsx`**
- Xóa dòng: `{ id: "funPlayUrl", label: "FUN Play", ... }`
- Số lượng nền tảng giảm từ 10 xuống 9

### Tổng kết
- 2 file cần sửa: `ProfileSettings.tsx` và `DiamondBadge.tsx`
