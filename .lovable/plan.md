
# Kế Hoạch Tích Hợp Hệ Thống Admin với CAMLY Coin Automated Claim

## Phân Tích Hiện Trạng

### Hệ Thống Admin Hiện Có (Rời Rạc)

| Route | Trang | Chức năng |
|-------|-------|-----------|
| `/admin` | AdminDashboard | Thống kê tổng quan, Top Creators, Top Earners, Charts |
| `/admin/manage` | AdminManage | 11 tabs: Reward Pool, Xóa nhanh, Duyệt, Lạm dụng, Rà soát, Đã Duyệt, Đã Claim, BSC, Tất cả, Ban, Admin Management |
| `/admin/reward-config` | AdminRewardConfig | Cấu hình mức thưởng, giới hạn, nhạc chuông |
| `/admin/video-stats` | AdminVideoStats | Thống kê video upload |
| `/admin/claim-history` | AdminClaimHistory | Lịch sử claim chi tiết với biểu đồ |
| `/admin/video-approval` | AdminVideoApproval | Duyệt video mới |

### Hệ Thống CAMLY Claim Tự Động (Hoạt Động Tốt)

**Edge Functions:**
- `award-camly` - Trao thưởng tự động với anti-fraud
- `claim-camly` - Xử lý claim on-chain (BSC)
- `check-upload-reward` - Thưởng creator sau 3 views
- `detect-abuse` - Tính suspicious_score
- `admin-wallet-balance` - Kiểm tra số dư ví admin

**Database Functions:**
- `approve_user_reward` - Admin duyệt reward
- `reject_user_reward` - Admin từ chối reward
- `unapprove_user_reward` - Admin hủy duyệt
- `ban_user_permanently` - Ban user vĩnh viễn
- `unban_user` - Unban user
- `add_admin_role` / `remove_admin_role` - Quản lý admin

---

## Đánh Giá Tương Thích

### Điểm Mạnh (Tương Thích Tốt)

1. **Role-based Access Control đã triển khai đầy đủ:**
   - `has_role(user_id, 'admin')` và `is_owner(user_id)` hoạt động tốt
   - Tất cả admin pages đều check cả 2 roles
   - RPC functions sử dụng SECURITY DEFINER

2. **Reward Flow hoàn chỉnh:**
   ```
   User Action → award-camly → pending_rewards (suspicious) 
                             → approved_reward (clean)
                             → Admin Review → claim-camly → BSC Transfer
   ```

3. **Anti-fraud system hoạt động:**
   - suspicious_score < 3: Auto-approve
   - suspicious_score >= 3: Cần Admin duyệt
   - IP tracking, wallet blacklist, daily limits

### Điểm Yếu (Cần Cải Thiện)

1. **UI phân tán:** 6 trang admin riêng biệt, khó quản lý
2. **Trùng lặp data:** ClaimHistory hiển thị ở cả `/admin/manage` và `/admin/claim-history`
3. **Thiếu tích hợp:** Video Approval không liên kết với Reward System
4. **Navigation phức tạp:** Phải navigate qua nhiều routes

---

## Kế Hoạch Hợp Nhất

### Mục Tiêu
Tạo **một trang Admin Dashboard duy nhất** với sidebar navigation và tất cả chức năng trong tabs/panels.

### Cấu Trúc Mới

```
/admin (Unified Admin Dashboard)
├── Overview (Dashboard chính)
│   ├── Platform Stats Cards (6 cards hiện có)
│   ├── Daily Activity Chart
│   ├── Rewards Distribution Chart
│   └── Top Creators/Earners Lists
│
├── CAMLY Rewards
│   ├── Reward Pool Status (ví admin balance)
│   ├── Pending Approval Queue
│   ├── Approved List
│   ├── Claimed List (với BSC links)
│   └── Blockchain Transactions
│
├── User Management
│   ├── All Users (search/filter)
│   ├── Abuse Detection (suspicious users)
│   ├── Banned Users
│   └── Quick Delete/Ban
│
├── Video Management
│   ├── Video Approval Queue
│   ├── Video Statistics
│   ├── Thumbnail Regeneration
│   └── Migration Panel
│
├── Configuration
│   ├── Reward Amounts Config
│   ├── Daily Limits Config
│   ├── Validation Rules
│   ├── Notification Sound
│   └── Config History
│
└── Admin Team (Owner only)
    ├── Current Admins List
    └── Add/Remove Admin
```

### Chi Tiết Triển Khai

#### 1. Tạo Layout Component Mới

**File:** `src/components/Admin/UnifiedAdminLayout.tsx`

Sidebar navigation với các sections:
- Overview (mặc định)
- CAMLY Rewards
- User Management
- Video Management
- Configuration
- Admin Team

#### 2. Refactor Các Tabs Hiện Có

Giữ nguyên các tab components trong `src/components/Admin/tabs/` và thêm:

**Tabs mới cần tạo:**
- `VideoApprovalTab.tsx` - Từ AdminVideoApproval
- `VideoStatsTab.tsx` - Từ AdminVideoStats
- `RewardConfigTab.tsx` - Từ AdminRewardConfig

#### 3. Tạo Unified Page

**File:** `src/pages/UnifiedAdminDashboard.tsx`

Thay thế `/admin` route với page mới sử dụng:
- Sidebar navigation (collapsible on mobile)
- Tab panels cho từng section
- Real-time stats updates
- Mobile-responsive design

#### 4. Giữ Lại Routes Cũ (Redirect)

Để backwards compatibility:
```typescript
// /admin/manage → /admin?section=users
// /admin/reward-config → /admin?section=config
// /admin/claim-history → /admin?section=rewards&tab=claimed
// /admin/video-stats → /admin?section=videos&tab=stats
// /admin/video-approval → /admin?section=videos&tab=approval
```

---

## Tính Năng Mới Cần Thêm

### 1. Real-time Dashboard Updates
```typescript
// Subscribe to reward_transactions changes
const channel = supabase
  .channel('admin-dashboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'reward_transactions'
  }, payload => {
    // Update stats in real-time
  })
  .subscribe();
```

### 2. Bulk Actions cho Reward Approval
```typescript
// Approve/Reject multiple users at once
const handleBulkApprove = async (userIds: string[]) => {
  for (const userId of userIds) {
    await supabase.rpc('approve_user_reward', {
      p_user_id: userId,
      p_admin_id: currentUser.id
    });
  }
};
```

### 3. Dashboard Widgets
- **Live Claim Counter** - Số claim trong 24h qua
- **Pending Alert Badge** - Số users chờ duyệt
- **Pool Health** - CAMLY/BNB balance warning
- **Fraud Alert** - Users với suspicious_score cao

### 4. Export Improvements
- Export tất cả dữ liệu ra CSV/Excel
- Filter by date range
- Include all relevant columns

---

## Danh Sách File Cần Tạo/Sửa

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Admin/UnifiedAdminLayout.tsx` | TẠO MỚI | Layout với sidebar navigation |
| `src/pages/UnifiedAdminDashboard.tsx` | TẠO MỚI | Page chính với tất cả sections |
| `src/components/Admin/tabs/VideoApprovalTab.tsx` | TẠO MỚI | Tab duyệt video |
| `src/components/Admin/tabs/VideoStatsTab.tsx` | TẠO MỚI | Tab thống kê video |
| `src/components/Admin/tabs/RewardConfigTab.tsx` | TẠO MỚI | Tab cấu hình reward |
| `src/components/Admin/tabs/OverviewTab.tsx` | TẠO MỚI | Tab tổng quan với charts |
| `src/App.tsx` | SỬA | Cập nhật routes, redirect cũ |
| `src/hooks/useAdminRealtime.ts` | TẠO MỚI | Hook cho real-time updates |

---

## Ưu Điểm Của Giải Pháp

| Trước | Sau |
|-------|-----|
| 6 trang admin riêng biệt | 1 trang duy nhất |
| Navigate qua nhiều routes | Sidebar + Tabs ngay trong trang |
| Mất context khi chuyển trang | Giữ state trong cùng page |
| Khó quản lý trên mobile | Responsive sidebar |
| Data load riêng từng page | Centralized data fetching |
| Không có real-time | Real-time updates |

---

## Test Cases Sau Triển Khai

1. **Admin Login** → Vào `/admin` → Thấy Overview với stats
2. **Duyệt Reward** → Click "CAMLY Rewards" → Tab "Pending" → Approve user
3. **Ban User** → Click "User Management" → Tab "All Users" → Ban user → Reward reset về 0
4. **Duyệt Video** → Click "Video Management" → Tab "Approval" → Approve video
5. **Thay đổi Config** → Click "Configuration" → Sửa VIEW_REWARD → Save → Edge function dùng giá trị mới
6. **Real-time** → User khác claim → Dashboard cập nhật ngay

---

## Ghi Chú Kỹ Thuật

1. **Tách Hooks:** Mỗi section nên có hook riêng để quản lý state (đã có `useAdminManage`, `useAdminStatistics`, `useRewardConfig`)

2. **Lazy Loading:** Chỉ load data cho section đang active để tối ưu performance

3. **Mobile First:** Sidebar collapse thành drawer trên mobile

4. **URL Sync:** Sync section/tab với URL query params để có thể bookmark/share links

5. **Permission Check:** Mỗi tab check riêng nếu cần (Admin Management chỉ Owner mới thấy)
