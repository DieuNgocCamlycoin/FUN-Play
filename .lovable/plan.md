
# Sửa Lỗi Tên User Có Chữ "là" - Giải Pháp Toàn Diện

## Vấn Đề

Tên user đang hiển thị sai với hậu tố "là" (ví dụ: "Angel Diệu Ngọc là ") do:
1. **Database**: Có record lưu sai `display_name = "Angel Diệu Ngọc là "`
2. **Code**: 38 files đang dùng `display_name || username` mà không sanitize

## Giải Pháp

### Bước 1: Tạo Utility Function (Reusable)

**File mới:** `src/lib/userUtils.ts`

```typescript
/**
 * Sanitize display name - loại bỏ các hậu tố tự động
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
  if (!name) return "User";
  return name
    .replace(/ là$/i, "")
    .replace(/ là /gi, "")
    .replace(/ is$/i, "")
    .replace(/ is /gi, "")
    .replace(/'s Channel$/i, "")
    .trim();
}

/**
 * Lấy display name đã sanitize từ profile
 */
export function getDisplayName(
  displayName: string | null | undefined, 
  username: string | null | undefined,
  fallback: string = "User"
): string {
  const name = displayName || username || fallback;
  return sanitizeDisplayName(name);
}
```

### Bước 2: Sửa Database (Chỉ 1 Record)

```sql
UPDATE profiles 
SET display_name = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(display_name, ' là$', ''),
    ' là ', ''
  )
)
WHERE display_name LIKE '% là%' OR display_name LIKE '%là ';
```

### Bước 3: Cập Nhật Các Components Chính

| File | Thay đổi |
|------|----------|
| `src/components/Donate/EnhancedDonateModal.tsx` | Import và dùng `getDisplayName()` |
| `src/components/Chat/ChatHeader.tsx` | Import và dùng `getDisplayName()` |
| `src/pages/Profile.tsx` | Import và dùng `getDisplayName()` |
| `src/pages/UserProfile.tsx` | Import và dùng `getDisplayName()` |
| `src/pages/Channel.tsx` | Import và dùng `getDisplayName()` |
| `src/components/Layout/HonobarDetailModal.tsx` | Import và dùng `getDisplayName()` |
| `src/components/Video/ShortsCommentSheet.tsx` | Import và dùng `getDisplayName()` |
| `src/components/Admin/tabs/RewardApprovalTab.tsx` | Import và dùng `getDisplayName()` |
| `src/components/Admin/tabs/BannedUsersTab.tsx` | Import và dùng `getDisplayName()` |
| *... và các files khác* | Tương tự |

### Ví Dụ Cập Nhật Code

**Trước:**
```typescript
<p>{senderProfile.display_name || senderProfile.username}</p>
```

**Sau:**
```typescript
import { getDisplayName } from "@/lib/userUtils";

<p>{getDisplayName(senderProfile.display_name, senderProfile.username)}</p>
```

## Kết Quả Mong Đợi

- Tất cả tên user hiển thị sạch, không còn hậu tố "là", "is", hoặc "'s Channel"
- Code dễ maintain với utility function tập trung
- Database đã được clean up

## Files Sẽ Thay Đổi

| File | Hành động |
|------|-----------|
| `src/lib/userUtils.ts` | **Tạo mới** - Utility functions |
| `src/components/Donate/EnhancedDonateModal.tsx` | Cập nhật |
| `src/components/Chat/ChatHeader.tsx` | Cập nhật |
| `src/pages/Profile.tsx` | Cập nhật |
| `src/pages/UserProfile.tsx` | Cập nhật |
| `src/pages/Channel.tsx` | Cập nhật |
| `src/components/Layout/HonobarDetailModal.tsx` | Cập nhật |
| `src/components/Video/ShortsCommentSheet.tsx` | Cập nhật |
| `src/components/Admin/tabs/RewardApprovalTab.tsx` | Cập nhật |
| `src/components/Admin/tabs/BannedUsersTab.tsx` | Cập nhật |
| `src/components/Profile/ProfileInfo.tsx` | Cập nhật để dùng utility |
| **Database Migration** | Sửa display_name có "là" |
