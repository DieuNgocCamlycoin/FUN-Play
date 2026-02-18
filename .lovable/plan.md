
# Toi Uu Hoa He Thong: Realtime -> Polling, Materialized View, Rate Limiting

## Tong Quan

Cau truc lai toan bo co che cap nhat du lieu de tiet kiem Cloud balance va chuan bi cho quy mo 1 trieu nguoi dung. 4 mang chinh: (1) Chuyen Realtime sang Polling, (2) Transaction History chi cap nhat khi can, (3) Materialized View cho Top Ranking, (4) Rate Limiting chong lam dung.

---

## 1. Chuyen Realtime sang Polling (2 phut)

### Cac hook can thay doi:

| Hook | Hien tai | Sau thay doi |
|------|----------|--------------|
| `useHonobarStats` | Realtime 5 bang, debounce 500ms | Polling 2 phut |
| `useTopRanking` | Realtime profiles UPDATE, debounce 500ms | Polling 2 phut (+ Materialized View) |
| `usePublicUsersDirectory` | Realtime 3 bang, debounce 2s | Polling 2 phut |
| `useUsersDirectoryStats` | Realtime 3 bang, debounce 2s | Polling 2 phut |
| `useAdminRealtime` | Realtime 3 bang, debounce 1s | Polling 2 phut |
| `useAdminManage` | Realtime profiles, debounce 1s | Polling 2 phut |

### Cac hook GIU NGUYEN Realtime (co ly do):

| Hook | Ly do giu |
|------|-----------|
| `Header.tsx` (notifications) | Loc theo user_id, nhe, UX quan trong |
| `useInternalWallet` | Loc theo user_id, UX quan trong |
| `ClaimRewardsSection` | Loc theo user_id, thong bao duyet thuong |
| `useVideoComments` | Loc theo video_id, tuong tac truc tiep |
| `useMusicListeners` | Presence channel, khong phai postgres_changes |
| `Index.tsx` (homepage) | Cap nhat view_count va avatar, UX |

### Chi tiet ky thuat:

**File: `src/hooks/useHonobarStats.tsx`**
- Xoa import `useDebouncedCallback`
- Xoa toan bo `supabase.channel("honobar-stats-unified")` subscription
- Them `setInterval(fetchStats, 120_000)` (2 phut)
- Giu `fetchStats()` khi mount

**File: `src/hooks/useTopRanking.ts`**
- Xoa import `useDebouncedCallback`
- Xoa `supabase.channel("top-ranking-updates")` subscription
- Them `setInterval(fetchRanking, 120_000)`
- Doi query tu `profiles` sang Materialized View `mv_top_ranking` (xem muc 3)

**File: `src/hooks/usePublicUsersDirectory.ts`**
- Xoa `supabase.channel('users-directory-realtime')` subscription
- Them `setInterval(fetchData, 120_000)`

**File: `src/hooks/useUsersDirectoryStats.ts`**
- Xoa `supabase.channel('admin-users-stats-realtime')` subscription
- Them `setInterval(fetchStats, 120_000)`

**File: `src/hooks/useAdminRealtime.ts`**
- Xoa `supabase.channel("admin-realtime-dashboard")` subscription
- Them `setInterval(fetchInitialStats, 120_000)`

**File: `src/hooks/useAdminManage.ts`**
- Xoa realtime subscription
- Them polling 2 phut

---

## 2. Transaction History: Chi Cap Nhat Khi Can

### Hien tai:
- `useTransactionHistory` co Realtime subscription lang nghe 5+ bang (donation_transactions, claim_requests, wallet_transactions)
- Public mode lang nghe TAT CA thay doi tu tat ca users

### Sau thay doi:

**File: `src/hooks/useTransactionHistory.ts`**
- Xoa TOAN BO Realtime subscription block (dong 619-695)
- Giu ham `refresh` de user bam nut "Lam moi"
- Them callback `onTransactionComplete` de tu dong refresh sau khi giao dich thanh cong

**File: `src/components/Wallet/TransactionHistorySection.tsx`**
- Khong thay doi — da co nut "Lam moi" (RefreshCcw)

**File: `src/pages/Transactions.tsx`**
- Khong thay doi — da co nut "Lam moi" (RefreshCw)

**Ket qua**: Transaction history chi load khi:
1. User mo trang (initial fetch)
2. User bam "Lam moi"
3. Code goi `refresh()` sau khi giao dich hoan tat

---

## 3. Materialized View cho Top Ranking

### Migration SQL:

```text
-- Tao Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_ranking AS
SELECT id, username, display_name, avatar_url, total_camly_rewards
FROM profiles
WHERE COALESCE(banned, false) = false
  AND COALESCE(total_camly_rewards, 0) > 0
ORDER BY total_camly_rewards DESC NULLS LAST
LIMIT 100;

-- Index de truy van nhanh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_ranking_id ON mv_top_ranking (id);
CREATE INDEX IF NOT EXISTS idx_mv_top_ranking_rewards ON mv_top_ranking (total_camly_rewards DESC);

-- Ham refresh Materialized View
CREATE OR REPLACE FUNCTION refresh_mv_top_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_ranking;
END;
$$;
```

### Tu dong refresh moi 10 phut (pg_cron):

Su dung `pg_cron` + `pg_net` de goi refresh dinh ky. Chay SQL insert (khong phai migration):

```text
SELECT cron.schedule(
  'refresh-top-ranking-mv',
  '*/10 * * * *',
  $$SELECT refresh_mv_top_ranking();$$
);
```

### Thay doi hook:

**File: `src/hooks/useTopRanking.ts`**
- Doi query tu `supabase.from("profiles")` sang `supabase.from("mv_top_ranking" as any)`
- Bo cac dieu kien `.eq("banned", false)` vi MV da loc san

---

## 4. Rate Limiting: Toi Da 10 Giao Dich/Phut

### Hien tai:
- `award-camly` da co daily count limits (VIEW_COUNT: 10, LIKE_COUNT: 20, v.v.)
- Chua co gioi han tong so giao dich/phut cho moi user hoac wallet

### Them Rate Limiting:

**File: `supabase/functions/award-camly/index.ts`**
Them kiem tra ngay sau buoc xac thuc user (dong ~200):

```text
Logic:
1. Dem so reward_transactions cua user trong 60 giay gan nhat
2. Neu >= 10, tra ve loi "Rate limit exceeded"
3. Neu < 10, tiep tuc xu ly binh thuong
```

Code them vao award-camly:
```text
-- Query kiem tra rate limit
SELECT COUNT(*) FROM reward_transactions
WHERE user_id = p_user_id
  AND created_at >= NOW() - INTERVAL '1 minute'
```

Neu count >= 10:
- Tra ve `{ success: false, error: "Rate limit: max 10 transactions/minute" }`
- HTTP status 429

### Rate Limiting cho claim-camly:

**File: `supabase/functions/claim-camly/index.ts`**
Them tuong tu: kiem tra so claim_requests trong 1 phut. Gioi han 2 claims/phut cho moi wallet.

### Rate Limiting cho track-ip:

**File: `supabase/functions/track-ip/index.ts`**
- Sua constraint: Them 'login' vao CHECK constraint `ip_tracking_action_type_check`
- Migration SQL:
```text
ALTER TABLE ip_tracking DROP CONSTRAINT IF EXISTS ip_tracking_action_type_check;
ALTER TABLE ip_tracking ADD CONSTRAINT ip_tracking_action_type_check
  CHECK (action_type IN ('signup', 'wallet_connect', 'claim', 'login'));
```

---

## Tom Tat Tac Dong

| Hang muc | Truoc | Sau |
|----------|-------|-----|
| Realtime channels | ~10 channels, lang nghe 15+ bang | 4 channels (chi user-specific) |
| Stats queries | Moi thay doi -> goi RPC | Polling 2 phut, ~720 lan/ngay thay vi hang nghin |
| Top Ranking | Query profiles ORDER BY moi lan | Materialized View, refresh 10 phut |
| Transaction History | Realtime 5+ bang | Chi khi user bam Refresh |
| Rate Limiting | Chi daily limits | Them 10 tx/phut per user |
| track-ip | Loi constraint moi lan login | Sua constraint, hoat dong binh thuong |

### Files thay doi:
1. `src/hooks/useHonobarStats.tsx` — Polling 2 phut
2. `src/hooks/useTopRanking.ts` — Polling 2 phut + MV query
3. `src/hooks/usePublicUsersDirectory.ts` — Polling 2 phut
4. `src/hooks/useUsersDirectoryStats.ts` — Polling 2 phut
5. `src/hooks/useAdminRealtime.ts` — Polling 2 phut
6. `src/hooks/useAdminManage.ts` — Polling 2 phut
7. `src/hooks/useTransactionHistory.ts` — Xoa realtime
8. `supabase/functions/award-camly/index.ts` — Rate limit 10/phut
9. `supabase/functions/claim-camly/index.ts` — Rate limit 2/phut
10. `supabase/functions/track-ip/index.ts` — Sua constraint

### Migrations:
1. Tao Materialized View `mv_top_ranking`
2. Sua CHECK constraint `ip_tracking_action_type_check`
3. Setup pg_cron refresh moi 10 phut
