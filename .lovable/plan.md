

## Ke hoach dong du an: Trigger tu dong, Cron Job bao tri, va Don dep code

### 1. Database Trigger tu dong cap nhat profiles khi reward_transactions thay doi

Tao trigger `trg_sync_profile_reward_totals` tren bang `reward_transactions` de moi khi co INSERT hoac UPDATE, tu dong tinh toan lai va cap nhat 3 cot `total_camly_rewards`, `pending_rewards`, `approved_reward` trong `profiles`.

**SQL Migration:**

```sql
CREATE OR REPLACE FUNCTION public.trigger_sync_profile_rewards()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Xac dinh user_id tu NEW hoac OLD
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Tinh toan lai tu reward_transactions (nguon su that duy nhat)
  UPDATE profiles SET
    total_camly_rewards = COALESCE(sub.calc_total, 0),
    pending_rewards = COALESCE(sub.calc_pending, 0),
    approved_reward = COALESCE(sub.calc_approved, 0)
  FROM (
    SELECT
      COALESCE(SUM(amount), 0) AS calc_total,
      COALESCE(SUM(amount) FILTER (
        WHERE (approved = false OR approved IS NULL) AND claimed = false
      ), 0) AS calc_pending,
      COALESCE(SUM(amount) FILTER (
        WHERE approved = true AND claimed = false
      ), 0) AS calc_approved
    FROM reward_transactions
    WHERE user_id = v_user_id AND status = 'success'
  ) sub
  WHERE profiles.id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_profile_reward_totals
  AFTER INSERT OR UPDATE OR DELETE ON reward_transactions
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_profile_rewards();
```

Trigger nay dam bao 27 file Admin/Ranking doc tu `profiles` luon chinh xac 100% ma khong can goi RPC rieng.

---

### 2. Cron Job tu dong chay sync_reward_totals() luc 02:00 AM hang ngay

Su dung `pg_cron` (da duoc enable) de goi Edge Function `sync-reward-cron` moi dem. Edge Function nay se goi `sync_reward_totals()` va ghi log ket qua.

**Cach 1 (Don gian - Dung truc tiep pg_cron goi RPC):**

```sql
SELECT cron.schedule(
  'nightly-reward-sync',
  '0 2 * * *',
  $$SELECT sync_reward_totals();$$
);
```

Day la cach don gian nhat vi `sync_reward_totals()` da la ham SQL co san. Khong can tao Edge Function moi.

---

### 3. Don dep code React (3 file)

**`src/hooks/useClaimHistory.ts`:**
- `useEstimatedEarnings` van dung `.reduce()` de tinh tong 7 ngay. Day la tinh toan DU BAO (estimated earnings), khong phai reward balance, nen `.reduce()` o day la hop le va khong can xoa.
- Khong co bien/ham du thua nao can xoa trong 3 file. Code da sach sau dot refactor truoc.

**`src/components/Wallet/ClaimRewardsSection.tsx`:**
- Da dung RPC hoan toan. Skeleton loading da co san (`<Skeleton className="h-8 w-24" />`). Code sach.

**`src/components/Profile/RewardStats.tsx`:**
- Da dung RPC. Skeleton loading da co san (animate-pulse). Code sach.

**Ket luan:** Khong can thay doi gi them o 3 file React. Chung da dat chuan toi uu.

---

### 4. Xac nhan cuoi cung

| Hang muc | Trang thai |
|----------|-----------|
| Video rac bi chan vinh vien (Database Trigger) | Da hoan thanh - `trg_validate_video_title` dang hoat dong |
| 115 video cu da sua thanh "Video #[so]" | Da hoan thanh - 0 video con tieu de chi so |
| Vi tien khop tuyet doi moi noi (Single Source of Truth) | Da hoan thanh - Tat ca dung RPC `get_user_activity_summary` |
| Profiles tu dong dong bo khi co giao dich moi | Se hoan thanh - Trigger `trg_sync_profile_reward_totals` |
| He thong tu bao tri hang dem | Se hoan thanh - pg_cron `nightly-reward-sync` |
| Code React sach, khong tinh toan thu cong | Da hoan thanh - Chi con `.reduce()` hop le cho du bao |

---

### Danh sach thay doi

| STT | Thay doi | Loai |
|-----|---------|------|
| 1 | Tao trigger `trg_sync_profile_reward_totals` tren `reward_transactions` | SQL Migration |
| 2 | Thiet lap pg_cron job `nightly-reward-sync` chay luc 02:00 AM | SQL (insert tool) |

Khong can thay doi file React nao them. He thong se tu van hanh hoan toan sau 2 buoc SQL nay.

