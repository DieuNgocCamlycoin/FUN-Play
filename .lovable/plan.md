

# Tao Trang Admin Thong Ke FUN Money Toan He Thong

## Tong Quan

Tao tab admin moi "FUN Money Stats" trong Admin Dashboard, hien thi thong ke toan he thong ve FUN Money voi bieu do breakdown theo action type, top users, va tong FUN da mint vs tiem nang.

## Thay Doi

### 1. Tao RPC function moi: `get_fun_money_system_stats`

Tao database function (security definer, chi admin) de tinh toan phia server:

- **Tong FUN da mint** (tu `mint_requests` WHERE status != 'rejected')
- **Tong FUN tiem nang** (tu `reward_transactions`: views×10 + likes×5 + comments×15 + shares×20 + uploads×100)
- **Breakdown theo action type**: So luong va tong FUN cho moi action (UPLOAD_VIDEO, WATCH_VIDEO, LIKE_VIDEO, COMMENT, SHARE)
- **So user da mint FUN** (distinct user_id tu mint_requests)
- **Top 10 FUN holders** (user co nhieu FUN mint nhat, kem display_name, avatar)
- **Breakdown theo status** (pending, approved, minted, rejected, failed)
- **Mint requests theo ngay** (30 ngay gan nhat)

### 2. Tao hook: `src/hooks/useAdminFunMoneyStats.ts`

Hook goi RPC `get_fun_money_system_stats` va tra ve du lieu da typed.

### 3. Tao component: `src/components/Admin/tabs/FunMoneyStatsTab.tsx`

Giao dien gom:

**Stat Cards (4 cards):**
- Tong FUN Da Mint (tu mint_requests)
- Tong FUN Tiem Nang (tu reward_transactions × BASE_REWARDS)
- So User Co FUN
- So Mint Requests

**Bieu do 1: Pie/Donut Chart - Breakdown theo Action Type**
- Hien thi % FUN tiem nang theo UPLOAD (100), COMMENT (15), VIEW (10), LIKE (5), SHARE (20)

**Bieu do 2: Bar Chart - FUN Da Mint vs Tiem Nang**
- So sanh FUN da mint va FUN chua mint cho moi action type

**Bieu do 3: Line/Area Chart - Mint Requests theo ngay (30 ngay)**
- Trend mint FUN Money qua thoi gian

**Bang: Top 10 FUN Holders**
- Avatar, Display Name, Tong FUN, So requests, Action types

**Bieu do 4: Donut - Breakdown theo Status**
- pending/approved/minted/rejected/failed

### 4. Cap nhat Admin Layout

- Them `"fun-money-stats"` vao `AdminSection` type
- Them nav item moi voi icon `BarChart3` hoac `PieChart`
- Cap nhat `UnifiedAdminDashboard.tsx` de render `FunMoneyStatsTab`

## Files thay doi

| File | Thay doi |
|------|---------|
| Database migration | Tao RPC `get_fun_money_system_stats` |
| `src/hooks/useAdminFunMoneyStats.ts` | Hook moi goi RPC |
| `src/components/Admin/tabs/FunMoneyStatsTab.tsx` | Component moi voi 4 stat cards + 4 bieu do + bang top users |
| `src/components/Admin/UnifiedAdminLayout.tsx` | Them section `fun-money-stats` vao type va nav |
| `src/pages/UnifiedAdminDashboard.tsx` | Them case render `FunMoneyStatsTab` |

## Ky thuat

- Su dung `recharts` (da cai dat) cho tat ca bieu do: PieChart, BarChart, AreaChart
- Su dung Supabase RPC de tranh gioi han 1000 dong
- BASE_REWARDS: VIEW=10, LIKE=5, COMMENT=15, SHARE=20, UPLOAD=100
- Chi admin moi truy cap duoc (has_role check trong RPC)

