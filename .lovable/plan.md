

## Thêm Sidebar vào trang /suspended

### Thay đổi
Bọc toàn bộ nội dung trang `SuspendedUsers.tsx` bằng component `MainLayout` -- giống cách các trang khác (Bounty, Subscriptions, PostDetail...) đang làm.

### Chi tiết kỹ thuật

**File:** `src/pages/SuspendedUsers.tsx`

- Import `MainLayout` từ `@/components/Layout/MainLayout`
- Bọc toàn bộ nội dung return bằng `<MainLayout>...</MainLayout>`
- Trang sẽ tự động có Header, Sidebar (desktop), Mobile Drawer, và Bottom Nav giống trang chủ

