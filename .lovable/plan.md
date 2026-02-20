

## Trien khai 3 sua loi: Dong bo User Count, Single Source of Truth cho Rewards, va Server-side Video Validation

### Loi 1: Dong bo logic dem User giua Honor Board va User Directory

**Nguyen nhan:** `get_honobar_stats` dem tat ca user chua bi ban (373), trong khi `get_public_users_directory` chi dem user co ho so hoan thien (133).

**Giai phap:** Tao ham SQL noi bo `is_completed_profile(p profiles)` va cap nhat `get_honobar_stats` su dung ham nay.

**Database migration 1:**
```sql
-- Ham noi bo kiem tra ho so hoan thien (1 noi duy nhat de sua)
CREATE OR REPLACE FUNCTION public.is_completed_profile(p profiles)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(p.banned, false) = false
    AND p.avatar_url IS NOT NULL
    AND p.username NOT LIKE 'user_%'
    AND p.display_name IS NOT NULL
    AND LENGTH(TRIM(p.display_name)) >= 2;
$$;

-- Cap nhat get_honobar_stats dung tieu chi ho so hoan thien
CREATE OR REPLACE FUNCTION public.get_honobar_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'totalUsers', (
      SELECT COUNT(*) FROM profiles p
      WHERE is_completed_profile(p)
    ),
    'totalVideos', (SELECT COUNT(*) FROM videos WHERE approval_status='approved'),
    'totalViews', (SELECT COALESCE(SUM(view_count),0) FROM videos WHERE approval_status='approved'),
    'totalComments', (SELECT COUNT(*) FROM comments),
    'totalRewards', (
      SELECT COALESCE(SUM(total_camly_rewards),0) FROM profiles p
      WHERE is_completed_profile(p)
    ),
    'totalSubscriptions', (SELECT COUNT(*) FROM subscriptions),
    'camlyPool', (
      SELECT COALESCE(SUM(approved_reward),0) FROM profiles p
      WHERE is_completed_profile(p)
    ),
    'totalPosts', (SELECT COUNT(*) FROM posts),
    'totalPhotos', (SELECT COUNT(*) FROM videos WHERE category='photo')
  );
$$;
```

---

### Loi 2: Thong nhat "Single Source of Truth" cho Rewards

**Buoc 1 - Dong bo du lieu (chay 1 lan):**
Goi `sync_reward_totals()` de cap nhat lai profiles tu reward_transactions.

**Buoc 2 - Cap nhat `ClaimRewardsSection.tsx`:**
Thay doi `fetchStats` de doc tu RPC `get_user_activity_summary` thay vi doc truc tiep tu profiles. Chi giu 1 query den profiles de lay `avatar_url` va `avatar_verified`.

```text
Truoc: 3 queries (profiles + claim_requests + daily_claim_records)
Sau:   3 queries (RPC get_user_activity_summary + profiles chi lay avatar + daily_claim_records)
```

Mapping du lieu tu RPC:
- `totalRewards` = `summary.total_camly`
- `pendingRewards` = `summary.pending_camly`
- `approvedRewards` = `summary.claimable_balance`
- `claimedTotal` = `summary.total_claimed`

Bo luon query `claim_requests` vi RPC da tinh `total_claimed`.

**Buoc 3 - Cap nhat `usePendingRewards` trong `useClaimHistory.ts`:**
Cung chuyen sang dung RPC thay vi doc truc tiep tu profiles.

**Buoc 4 - Cap nhat `RewardStats.tsx`:**
Thay `profiles.total_camly_rewards` bang RPC `get_user_activity_summary` de dong nhat nguon du lieu.

Tat ca component hien Skeleton loading khi dang fetch, dam bao khong "nhay so".

---

### Loi 3: Server-side Video Title Validation

**Database migration 2:**
```sql
-- Trigger validate tieu de video o cap database
CREATE OR REPLACE FUNCTION public.validate_video_title()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF LENGTH(TRIM(NEW.title)) < 5 THEN
    RAISE EXCEPTION 'Title must be at least 5 characters';
  END IF;
  IF NEW.title ~ '^\d+$' THEN
    RAISE EXCEPTION 'Title cannot be only numbers';
  END IF;
  IF NEW.title !~ '[a-zA-Z\u00C0-\u1EF9]' THEN
    RAISE EXCEPTION 'Title must contain at least one letter';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_video_title
  BEFORE INSERT OR UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION validate_video_title();

-- Fix 115 video hien tai co tieu de chi chua so
UPDATE videos SET title = 'Video #' || title WHERE title ~ '^\d+$';
```

---

### Danh sach file thay doi

| STT | File / Action | Loai thay doi |
|-----|--------------|---------------|
| 1 | Database migration: `is_completed_profile` + cap nhat `get_honobar_stats` | SQL |
| 2 | Database: Chay `sync_reward_totals()` | SQL (1 lan) |
| 3 | `src/components/Wallet/ClaimRewardsSection.tsx` | Code - dung RPC thay profiles |
| 4 | `src/hooks/useClaimHistory.ts` (`usePendingRewards`) | Code - dung RPC thay profiles |
| 5 | `src/components/Profile/RewardStats.tsx` | Code - dung RPC thay profiles |
| 6 | Database migration: trigger `validate_video_title` + fix 115 video | SQL |

### Ket qua mong doi

- Honor Board va User Directory hien cung 1 con so (~133 user ho so hoan thien)
- Wallet, Reward History, va Profile deu hien cung thong so tu 1 nguon RPC
- Khong the dang video voi tieu de chi chua so (ca client lan server)
- 115 video cu duoc sua thanh "Video #[so]" thay vi xoa

