

# Thêm mục "Thống Kê Users" vào Admin Dashboard

## Mô tả

Thêm một section mới trong Admin Dashboard (`/admin?section=user-stats`) hiển thị danh sách tất cả users kèm thống kê chi tiết: hoạt động, điểm Anh sang, FUN Money, CAMLY rewards, donation USDT/BNB, va lich su tang thuong cho nhau.

## Cac buoc thuc hien

### 1. Tao RPC `get_users_directory_stats` (Migration SQL)

Tao database function tong hop thong ke cho tat ca users trong 1 query duy nhat, tranh N+1:
- Activity: dem posts, videos, comments, likes, shares tu `reward_transactions`
- CAMLY: tong, pending, approved tu `reward_transactions`  
- Donations: tong gui/nhan tu `donation_transactions` (group by token symbol)
- Mint requests: so FUN da mint tu `mint_requests`

### 2. Them section "user-stats" vao Admin Layout

**Tep:** `src/components/Admin/UnifiedAdminLayout.tsx`

- Them `"user-stats"` vao type `AdminSection`
- Them nav item moi voi icon `BarChart3` va label "Thong Ke Users"

### 3. Tao tab moi: `src/components/Admin/tabs/UserStatsTab.tsx`

Tab chinh hien thi danh sach users voi cac cot:
- **User**: Avatar, ten, username
- **Hoat dong**: Posts, Videos, Comments, Likes, Shares (so lieu)
- **Light Score**: Diem tong (progress bar mau gradient)
- **FUN Money**: So FUN da mint
- **CAMLY**: Tong / Cho duyet / Da duyet
- **Donations**: Tong gui/nhan (USDT, BNB, CAMLY qua donation)

Tinh nang:
- Tim kiem theo ten/username
- Sap xep theo cac cot
- Click mo rong de xem chi tiet (pillar scores S/T/H/C/U, lich su donation)
- Export CSV
- Responsive: bang tren desktop, card tren mobile

### 4. Tao hook: `src/hooks/useUsersDirectoryStats.ts`

- Goi RPC `get_users_directory_stats` de lay du lieu tong hop
- Tra ve danh sach users voi day du thong ke
- Ho tro pagination va search

### 5. Cap nhat `src/pages/UnifiedAdminDashboard.tsx`

- Import `UserStatsTab`
- Them case `"user-stats"` trong `renderContent()`
- Them tieu de va mo ta cho section moi

## Chi tiet ky thuat

### RPC Function (SQL)

```text
CREATE OR REPLACE FUNCTION get_users_directory_stats()
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  wallet_address text,
  created_at timestamptz,
  banned boolean,
  avatar_verified boolean,
  pending_rewards numeric,
  approved_reward numeric,
  total_camly_rewards numeric,
  posts_count bigint,
  videos_count bigint,
  comments_count bigint,
  views_count bigint,
  likes_count bigint,
  shares_count bigint,
  donations_sent_count bigint,
  donations_sent_total numeric,
  donations_received_count bigint,
  donations_received_total numeric,
  mint_requests_count bigint,
  minted_fun_total numeric
)
-- Uses LEFT JOINs with subqueries for each metric
-- Security: SECURITY DEFINER, only callable by admins
```

### Giao dien expand row

Khi click vao 1 user, hien thi them:
- 5 pillar scores (S, T, H, C, U) dang progress bars
- Unity Score, Integrity Score
- Danh sach 5 donation gan nhat (gui va nhan)
- Link den trang profile cua user

## Tep thay doi

| # | Tep | Thay doi |
|---|------|----------|
| 1 | Migration SQL | Tao RPC `get_users_directory_stats` |
| 2 | `src/components/Admin/UnifiedAdminLayout.tsx` | Them section "user-stats" vao nav |
| 3 | `src/components/Admin/tabs/UserStatsTab.tsx` | Tao tab moi hien thi thong ke users |
| 4 | `src/hooks/useUsersDirectoryStats.ts` | Hook moi fetch du lieu tu RPC |
| 5 | `src/pages/UnifiedAdminDashboard.tsx` | Them case render cho section "user-stats" |

