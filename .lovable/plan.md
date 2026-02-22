

## Cập nhật trang Danh sách đình chỉ (/suspended)

### 1. Sticky header bao gồm cả hàng tiêu đề bảng

Hiện tại chỉ phần tiêu đề + search được sticky. Cần thêm sticky cho `TableHeader` (hàng "#, Người dùng, Ví liên kết...").

**Cách làm**: 
- Giữ nguyên sticky cho phần tiêu đề + search (top-[64px])
- Thêm `sticky top-[calc(64px+<header_height>)] z-10 bg-background` cho `TableHeader`
- Dùng `overflow-visible` cho Table wrapper để sticky hoạt động trong scroll chính của trang

**File**: `src/pages/SuspendedUsers.tsx`
- Dòng 117: Thêm `wrapperClassName="overflow-visible border border-border rounded-lg"` (thay vì chỉ border)
- Dòng 118: Thêm className sticky cho `TableHeader`: `"bg-background sticky top-[200px] z-[9]"` (tính toán offset = 64px navbar + ~136px header section)

### 2. Thêm cột "Tổng Claimed"

Hiển thị tổng số tiền user đã rút thành công (claim_requests với status = 'success').

**File**: `src/hooks/usePublicSuspendedList.ts`
- Thêm query mới lấy tổng claimed từ `claim_requests` (status = 'success'), group by user_id
- Bảng `claim_requests` có RLS cho phép public xem claims có tx_hash + status = success
- Merge dữ liệu vào `SuspendedEntry` với field mới `total_claimed: number`

**File**: `src/pages/SuspendedUsers.tsx`
- Thêm `TableHead` mới "Tổng claimed" sau cột "Tổng thưởng" (hidden md:table-cell)
- Thêm `TableCell` tương ứng trong `SuspendedRow` hiển thị số CAMLY đã claimed

### Chi tiết kỹ thuật

| File | Thay đổi |
|---|---|
| `src/hooks/usePublicSuspendedList.ts` | Thêm query `claim_requests` (status=success, group by user_id), thêm field `total_claimed` vào `SuspendedEntry`, merge vào `mergedEntries` |
| `src/pages/SuspendedUsers.tsx` dòng 117-118 | Table wrapper overflow-visible, TableHeader sticky |
| `src/pages/SuspendedUsers.tsx` dòng 125-126 | Thêm TableHead "Tổng claimed" |
| `src/pages/SuspendedUsers.tsx` dòng 282-286 | Thêm TableCell hiển thị total_claimed |

