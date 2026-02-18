
# Toi Uu Hien Thi va Quan Tri Admin

## Tong Quan

4 mang can toi uu: (1) Phan trang 20 users/trang cho tat ca bang admin, (2) Canh bao tu dong users tang diem bat thuong, (3) Cache du lieu tinh, (4) Nut "Cap nhat thu cong" cho leaderboard.

---

## 1. Phan Trang 20 Users/Trang - Admin Tables

### Cac file can thay doi:

**File: `src/components/Admin/tabs/AllUsersTab.tsx`**
- Them state `currentPage` (default 1), `PAGE_SIZE = 20`
- Thay `filteredUsers.slice(0, 100)` bang logic phan trang: `filteredUsers.slice((currentPage-1)*20, currentPage*20)`
- Reset `currentPage = 1` khi `searchTerm` thay doi
- Them component Pagination o cuoi bang (Previous, page numbers, Next)
- Hien thi "Trang X/Y (Z users)" thay vi message cu

**File: `src/components/Admin/tabs/BannedUsersTab.tsx`**
- Them phan trang tuong tu cho danh sach banned users
- 20 users/trang voi Pagination component

**File: `src/components/Admin/tabs/QuickDeleteTab.tsx`**
- Phan trang cho `suspiciousUsers` list (20/trang)
- Phan trang cho `searchResults` (da co `.slice(0, 20)` nhung them pagination neu nhieu hon)

**File: `src/components/Admin/tabs/UserStatsTab.tsx`**
- Them phan trang cho bang desktop va mobile
- Thay vi render toan bo `filtered`, chi render `filtered.slice((page-1)*20, page*20)`
- Them Pagination component

**File: `src/components/Admin/tabs/RewardsManagementTab.tsx`** (va cac sub-tab)
- Cac sub-tab nhu RewardApprovalTab, ApprovedListTab cung can kiem tra va them phan trang neu chua co

### Component su dung:
- Su dung `Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis` tu `src/components/ui/pagination.tsx` (da co san)

---

## 2. Canh Bao Users Tang Diem Bat Thuong

### Logic phat hien:
- So sanh `pending_rewards` voi nguong canh bao (vd: > 500,000 CAMLY pending hoac tang > 100,000 trong 24h)
- Users co `suspicious_score` cao (>= 50) ket hop pending cao

### Thay doi:

**File: `src/components/Admin/tabs/AllUsersTab.tsx`**
- Them logic `isAnomalous(user)`: kiem tra pending_rewards > 500,000 hoac total_camly_rewards > 2,000,000 voi 0 videos
- Highlight row bang mau vang/do: them class `bg-amber-500/10 border-l-4 border-amber-500` cho users bat thuong
- Them icon `AlertTriangle` ben canh ten user khi bat thuong
- Them bo loc nhanh "Chi hien thi bat thuong" (toggle)

**File: `src/hooks/useAdminManage.ts`**
- Export them ham `getAnomalyFlags(user)` tra ve object `{ isHighPending, isNoActivity, isSuspicious }`

**File: `src/components/Admin/tabs/UserStatsTab.tsx`**
- Tuong tu, highlight users bat thuong trong bang stats

---

## 3. Cache Du Lieu Tinh

### Chien luoc:
- Su dung `useRef` luu cache voi timestamp
- Khi polling 2 phut, chi fetch neu cache da het han (> 2 phut)
- Wallet balance (quan trong) luon fetch truc tiep, khong cache

### Thay doi:

**File: `src/hooks/useHonobarStats.tsx`**
- Them `cacheRef = useRef({ data: null, timestamp: 0 })`
- Trong `fetchStats`: neu cache chua het 2 phut, return cache. Neu het, fetch moi va cap nhat cache

**File: `src/hooks/useTopRanking.ts`**
- Tuong tu, them cache voi `useRef`
- Chi fetch lai khi cache > 2 phut hoac khi user bam "Cap nhat thu cong"

**File: `src/hooks/useAdminManage.ts`**
- Cache users data voi timestamp
- Khi action (ban, approve) xong, invalidate cache va fetch moi

---

## 4. Nut "Cap Nhat Thu Cong" cho Leaderboard

### Thay doi:

**File: `src/pages/Leaderboard.tsx`**
- Doi polling tu 10 giay sang 2 phut (120,000ms) de dong bo voi cac hook khac
- Doi query tu `profiles` sang `mv_top_ranking` (Materialized View da tao)
- Them nut `RefreshCw` nho o goc tren phai cua header
- Khi bam: goi `fetchLeaderboard()`, hien animation loading tren nut

**File: `src/components/Layout/TopRankingSection.tsx`**
- Them nut refresh nho (icon `RefreshCw` 14px) ben canh header "Top 5 Ranking"
- Goi `refetch()` tu `useTopRanking` (da export san)

**File: `src/components/Layout/TopRankingCard.tsx`**
- Them nut refresh tuong tu ben canh "TOP RANKING" header
- Goi `refetch()` tu `useTopRanking`

**File: `src/components/Layout/HonobarDetailModal.tsx`**
- Them nut refresh cho ranking section trong modal

---

## Tom Tat Files Thay Doi

| # | File | Thay doi |
|---|------|---------|
| 1 | `src/components/Admin/tabs/AllUsersTab.tsx` | Pagination 20/trang + highlight bat thuong |
| 2 | `src/components/Admin/tabs/BannedUsersTab.tsx` | Pagination 20/trang |
| 3 | `src/components/Admin/tabs/QuickDeleteTab.tsx` | Pagination 20/trang |
| 4 | `src/components/Admin/tabs/UserStatsTab.tsx` | Pagination 20/trang + highlight |
| 5 | `src/hooks/useAdminManage.ts` | Them `getAnomalyFlags` + cache |
| 6 | `src/hooks/useHonobarStats.tsx` | Them cache ref |
| 7 | `src/hooks/useTopRanking.ts` | Them cache ref |
| 8 | `src/pages/Leaderboard.tsx` | Doi sang MV query, 2 phut polling, nut refresh |
| 9 | `src/components/Layout/TopRankingSection.tsx` | Nut refresh nho |
| 10 | `src/components/Layout/TopRankingCard.tsx` | Nut refresh nho |
| 11 | `src/components/Layout/HonobarDetailModal.tsx` | Nut refresh |

Khong can migration database. Toan bo thay doi chi o frontend.
