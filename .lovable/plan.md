
# Toi Uu Toan Dien Admin Dashboard - Loai Bo Realtime, Ap Dung Smart Loading

## Tong Quan

Cau truc lai toan bo Admin Dashboard theo nguyen tac: **chi load du lieu khi can**, **khong tu dong polling**, **chi IP Abuse duy tri Realtime**. Them debounce cho search, them rate limiting Edge Function cho admin.

---

## 1. Loai Bo Polling/Realtime - Chuyen Sang On-Demand Loading

### useAdminManage.ts
- **Xoa** interval polling 2 phut (dong 91: `setInterval(fetchUsers, 120_000)`)
- Giu cache 5 phut (doi tu 120_000 sang 300_000 trong dieu kien cache)
- Chi fetch khi: (a) mount lan dau, (b) goi `refetch(true)` thu cong, (c) sau action (ban/approve/reject)
- Export `refetch` da co san, chi can xoa interval

### useAdminRealtime.ts
- **Xoa** interval polling 2 phut (dong 54: `setInterval(fetchInitialStats, 120_000)`)
- Chi fetch 1 lan khi mount
- Giu `refetch` de admin bam Refresh thu cong

### useAdminStatistics.tsx (OverviewTab)
- Hien tai da chi fetch 1 lan khi mount - **Giu nguyen**, khong can thay doi
- Them nut Refresh vao OverviewTab de admin co the cap nhat thu cong

### useRewardConfig.tsx (ConfigManagementTab)
- Hien tai da chi fetch 1 lan khi mount - **Giu nguyen**

### FunMoneyApprovalTab.tsx
- Hien tai fetch khi doi tab va co nut Refresh - **Giu nguyen**

### VideosManagementTab.tsx
- Hien tai fetch 1 lan khi mount - **Giu nguyen**
- Da co pagination 20/trang cho VideoStats

---

## 2. IP Abuse Detection - Giu Realtime, Them Filter High-Risk

### IPAbuseDetectionTab.tsx
- **Giu Realtime** (la noi duy nhat duoc phep dung Realtime)
- Them filter: chi hien thi nhom co `account_count >= 3` HOAC `total_pending > 100000` (high-risk)
- Them toggle "Chi hien thi rui ro cao" (default ON)
- Da co debounce 1.5s - giu nguyen

---

## 3. Debounce 500ms cho Search Boxes

### AllUsersTab.tsx
- Them `debouncedSearch` state voi `setTimeout` 500ms
- Filter dua tren `debouncedSearch` thay vi `searchTerm` truc tiep

### BannedUsersTab.tsx
- Tuong tu, them debounce 500ms cho search

### QuickDeleteTab.tsx
- Them debounce 500ms cho search

### UserStatsTab.tsx
- Them debounce 500ms cho search

### VideosManagementTab.tsx
- Da co debounce 300ms - doi len 500ms

### FunMoneyApprovalTab.tsx
- Them debounce 500ms cho searchQuery

---

## 4. Nut "Refresh Thu Cong" cho cac Section chua co

### OverviewTab.tsx
- Them nut RefreshCw vao header area
- Goi lai `useAdminStatistics` refetch (can them refetch vao hook)

### useAdminStatistics.tsx
- Them `refetch` function va export no
- Doi tu chi fetch 1 lan sang co kha nang refetch thu cong

### UsersManagementTab.tsx
- Them nut Refresh goi `refetch` tu useAdminManage

### UnifiedAdminDashboard.tsx
- Them nut Refresh ben canh connection status badge
- Goi refetch cua useAdminRealtime

---

## 5. Rate Limiting Edge Function cho Admin Refresh

### Tao Edge Function: `supabase/functions/admin-rate-check/index.ts`
- Nhan `admin_id` va `action` (vi du: "refresh_users", "refresh_stats")
- Kiem tra trong bang `admin_rate_limits` (can tao) hoac su dung in-memory (KV)
- Gioi han: 10 lan refresh / phut / admin
- Tra ve `{ allowed: true }` hoac `{ allowed: false, retry_after: X }`

### Database Migration
- Tao bang `admin_rate_limits`:
  - `id` uuid PK
  - `admin_id` uuid NOT NULL
  - `action` text NOT NULL
  - `window_start` timestamptz NOT NULL
  - `request_count` integer DEFAULT 1
  - UNIQUE (admin_id, action, window_start)
- RLS: chi admin duoc INSERT/SELECT/UPDATE

### Frontend Integration
- Trong useAdminManage `refetch`:
  - Goi `supabase.functions.invoke('admin-rate-check')` truoc khi fetch
  - Neu `allowed: false`, hien toast "Vui long cho X giay" va khong fetch
- Tuong tu cho useAdminRealtime va useAdminStatistics refetch

---

## 6. Don Dep Code Khong Dung

### UnifiedAdminDashboard.tsx
- `isConnected` va badge Wifi/WifiOff hien thi "Realtime" nhung he thong khong con dung Realtime (tru IP Abuse)
- Doi label thanh "Online" thay vi "Realtime"
- Xoa import WifiOff (doi sang icon phu hop hon)

---

## Tom Tat Files Thay Doi

| # | File | Thay doi |
|---|------|---------|
| 1 | `src/hooks/useAdminManage.ts` | Xoa polling interval, giu cache 5 phut |
| 2 | `src/hooks/useAdminRealtime.ts` | Xoa polling interval, chi fetch 1 lan |
| 3 | `src/hooks/useAdminStatistics.tsx` | Them refetch function |
| 4 | `src/components/Admin/tabs/OverviewTab.tsx` | Them nut Refresh |
| 5 | `src/components/Admin/tabs/AllUsersTab.tsx` | Them debounce 500ms search |
| 6 | `src/components/Admin/tabs/BannedUsersTab.tsx` | Them debounce 500ms search |
| 7 | `src/components/Admin/tabs/QuickDeleteTab.tsx` | Them debounce 500ms search |
| 8 | `src/components/Admin/tabs/UserStatsTab.tsx` | Them debounce 500ms search |
| 9 | `src/components/Admin/tabs/VideosManagementTab.tsx` | Doi debounce 300ms -> 500ms |
| 10 | `src/components/Admin/tabs/FunMoneyApprovalTab.tsx` | Them debounce 500ms search |
| 11 | `src/components/Admin/tabs/IPAbuseDetectionTab.tsx` | Them filter high-risk toggle |
| 12 | `src/components/Admin/tabs/UsersManagementTab.tsx` | Them nut Refresh |
| 13 | `src/pages/UnifiedAdminDashboard.tsx` | Doi label Realtime -> Online, them nut Refresh |
| 14 | `supabase/functions/admin-rate-check/index.ts` | Tao moi - rate limiting |
| 15 | Database migration | Tao bang admin_rate_limits |

### Database Migration Can Thuc Hien
- Tao bang `admin_rate_limits` voi RLS policy cho admin
