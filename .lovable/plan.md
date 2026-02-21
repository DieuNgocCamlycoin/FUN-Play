

## Hotfix: Chong Exploit Doi Vi - Wallet Security Hardening

### Tong quan van de

User dang loi dung viec doi vi tu do de "doi danh tinh", bypass cac kiem tra bao mat. Hien tai `saveWalletToDb` trong `useWalletConnection.ts` cho phep doi vi khong gioi han, khong co cooldown, khong co audit log.

---

### Phan 1: HOTFIX KHAN CAP (Uu tien cao nhat)

#### 1.1 Tao bang `wallet_change_log` va cot bao mat moi tren `profiles`

**Database migration:**

```text
-- Bang audit log doi vi
CREATE TABLE wallet_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  old_wallet text,
  new_wallet text,
  reason text DEFAULT 'user',  -- user | admin | system
  ip_hash text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Cot bao mat moi tren profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_change_count_30d integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_wallet_change_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS claim_freeze_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_risk_status text DEFAULT 'NORMAL'
  CHECK (wallet_risk_status IN ('NORMAL','WATCH','REVIEW','BLOCKED'));

-- RLS: chi user doc log cua minh, admin doc tat ca
ALTER TABLE wallet_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON wallet_change_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin read all" ON wallet_change_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert" ON wallet_change_log
  FOR INSERT WITH CHECK (true);
```

#### 1.2 Tao bang `wallet_history` (luu lich su vi)

```text
CREATE TABLE wallet_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  wallet_address text NOT NULL,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_by text DEFAULT 'system'
);

ALTER TABLE wallet_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON wallet_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin read all" ON wallet_history
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert" ON wallet_history
  FOR INSERT WITH CHECK (true);

-- Migrate du lieu hien tai
INSERT INTO wallet_history (user_id, wallet_address, is_active, started_at)
SELECT id, wallet_address, true, COALESCE(created_at, now())
FROM profiles
WHERE wallet_address IS NOT NULL;
```

#### 1.3 Feature flag `WALLET_CHANGE_DISABLED` trong `reward_config`

```text
INSERT INTO reward_config (config_key, config_value, description)
VALUES
  ('WALLET_CHANGE_DISABLED', 'true', 'Tam khoa doi vi de nang cap bao mat'),
  ('WALLET_CHANGE_COOLDOWN_DAYS', '30', 'So ngay toi thieu giua 2 lan doi vi'),
  ('WALLET_CHANGE_FREEZE_HOURS', '72', 'So gio freeze claim sau khi doi vi'),
  ('WALLET_CHANGE_MAX_30D', '1', 'So lan doi vi toi da trong 30 ngay')
ON CONFLICT (config_key) DO NOTHING;
```

#### 1.4 Tao RPC `request_wallet_change`

Ham nay thay the viec client tu update `profiles.wallet_address`. Moi logic doi vi phai di qua day:

```text
CREATE OR REPLACE FUNCTION request_wallet_change(
  p_user_id uuid,
  p_new_wallet text,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_reason text DEFAULT 'user'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_disabled boolean;
  v_cooldown_days integer;
  v_freeze_hours integer;
  v_max_changes integer;
  v_changes_30d integer;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN '{"error":"User not found"}'::jsonb; END IF;

  -- Feature flag check (admin bypass via p_reason='admin')
  SELECT config_value::boolean INTO v_disabled
    FROM reward_config WHERE config_key='WALLET_CHANGE_DISABLED';
  IF COALESCE(v_disabled, false) AND p_reason != 'admin' THEN
    RETURN '{"error":"WALLET_CHANGE_DISABLED","message":"Tam khoa doi vi de nang cap bao mat."}'::jsonb;
  END IF;

  -- Load config
  SELECT COALESCE((SELECT config_value::int FROM reward_config WHERE config_key='WALLET_CHANGE_COOLDOWN_DAYS'), 30) INTO v_cooldown_days;
  SELECT COALESCE((SELECT config_value::int FROM reward_config WHERE config_key='WALLET_CHANGE_FREEZE_HOURS'), 72) INTO v_freeze_hours;
  SELECT COALESCE((SELECT config_value::int FROM reward_config WHERE config_key='WALLET_CHANGE_MAX_30D'), 1) INTO v_max_changes;

  -- Cooldown check
  IF v_profile.last_wallet_change_at IS NOT NULL
     AND v_profile.last_wallet_change_at > now() - (v_cooldown_days || ' days')::interval
     AND p_reason != 'admin' THEN
    RETURN jsonb_build_object(
      'error', 'COOLDOWN',
      'message', 'Ban chi duoc doi vi moi ' || v_cooldown_days || ' ngay.',
      'next_change_at', v_profile.last_wallet_change_at + (v_cooldown_days || ' days')::interval
    );
  END IF;

  -- 30-day change count
  SELECT COUNT(*) INTO v_changes_30d
    FROM wallet_change_log
    WHERE user_id = p_user_id AND created_at > now() - interval '30 days';

  IF v_changes_30d >= v_max_changes AND p_reason != 'admin' THEN
    RETURN jsonb_build_object('error', 'MAX_CHANGES', 'message', 'Da dat gioi han doi vi trong 30 ngay.');
  END IF;

  -- Audit log
  INSERT INTO wallet_change_log (user_id, old_wallet, new_wallet, reason, ip_hash, user_agent)
  VALUES (p_user_id, v_profile.wallet_address, p_new_wallet, p_reason, p_ip_hash, p_user_agent);

  -- Deactivate old wallet in history
  UPDATE wallet_history SET is_active = false, ended_at = now()
    WHERE user_id = p_user_id AND is_active = true;

  -- Insert new wallet history
  INSERT INTO wallet_history (user_id, wallet_address, is_active, created_by)
  VALUES (p_user_id, p_new_wallet, true, p_reason);

  -- Risk scoring
  v_changes_30d := v_changes_30d + 1;
  DECLARE v_risk text := 'NORMAL'; v_freeze interval := (v_freeze_hours || ' hours')::interval;
  BEGIN
    IF v_changes_30d >= 3 THEN v_risk := 'BLOCKED'; v_freeze := interval '999 days';
    ELSIF v_changes_30d >= 2 THEN v_risk := 'REVIEW'; v_freeze := interval '7 days';
    ELSIF v_changes_30d >= 1 THEN v_risk := 'WATCH';
    END IF;

    UPDATE profiles SET
      wallet_address = p_new_wallet,
      last_wallet_change_at = now(),
      wallet_change_count_30d = v_changes_30d,
      claim_freeze_until = now() + v_freeze,
      wallet_risk_status = v_risk
    WHERE id = p_user_id;

    -- Freeze pending claims
    UPDATE claim_requests SET status = 'pending_review'
      WHERE user_id = p_user_id AND status = 'pending';

    RETURN jsonb_build_object(
      'success', true,
      'risk_status', v_risk,
      'freeze_until', now() + v_freeze,
      'changes_30d', v_changes_30d
    );
  END;
END;
$$;
```

---

### Phan 2: CAP NHAT FRONTEND

#### 2.1 `src/hooks/useWalletConnection.ts`

Thay doi ham `saveWalletToDb`:
- Thay vi truc tiep `UPDATE profiles SET wallet_address = ...`
- Goi RPC `request_wallet_change` de kiem tra feature flag, cooldown, rate limit
- Xu ly response: neu bi DISABLED/COOLDOWN/MAX_CHANGES thi hien toast loi va reject

Thay doi ham `handleConfirmWalletChange`:
- Goi RPC `request_wallet_change` thay vi `saveWalletToDb`
- Neu response co `error` thi hien thong bao va disconnect vi moi

#### 2.2 `src/components/Wallet/ClaimRewardsSection.tsx`

Them logic kiem tra `claim_freeze_until`:
- Fetch `claim_freeze_until` va `wallet_risk_status` tu profile
- Neu `claim_freeze_until > now()`: hien banner "Tai khoan dang duoc kiem tra bao mat do thay doi vi. Vui long thu lai sau: {date}"
- Neu `wallet_risk_status = 'BLOCKED'`: hien "Vui long lien he support."
- Disable nut Claim khi dang freeze hoac blocked

#### 2.3 `src/components/Web3/WalletChangeConfirmDialog.tsx`

Them canh bao ro rang:
- "Doi vi se freeze claim trong 72h"
- "Ban chi duoc doi vi 1 lan / 30 ngay"

---

### Phan 3: CAP NHAT EDGE FUNCTION `claim-camly`

Them 2 check server-side moi truoc khi xu ly claim:

```text
-- Check 1: Claim freeze
SELECT claim_freeze_until, wallet_risk_status FROM profiles WHERE id = user.id
IF claim_freeze_until > now() → reject "Tai khoan dang freeze"
IF wallet_risk_status = 'BLOCKED' → reject "Tai khoan bi khoa claim"

-- Check 2: Verify reward gán theo user_id (da dung san)
-- Hien tai reward_transactions.user_id da la primary key identity → OK, khong can thay doi
```

---

### Phan 4: ADMIN TOOLS

#### 4.1 Tab "Wallet Audit" trong Admin Dashboard

- Hien thi `wallet_change_log` moi nhat
- Filter theo risk_status: WATCH / REVIEW / BLOCKED
- Nut "Override: Cho phep doi vi" (goi RPC voi reason='admin')
- Nut "Unfreeze claim" (reset `claim_freeze_until` va `wallet_risk_status`)

---

### Tong ket file thay doi

| File | Hanh dong | Do uu tien |
|---|---|---|
| Database migration (bang moi + cot moi + RPC) | Tao | HOTFIX |
| Database insert (feature flags vao reward_config) | Tao | HOTFIX |
| `supabase/functions/claim-camly/index.ts` | Sua: them freeze check | HOTFIX |
| `src/hooks/useWalletConnection.ts` | Sua: goi RPC thay vi truc tiep update | HOTFIX |
| `src/components/Wallet/ClaimRewardsSection.tsx` | Sua: hien freeze banner | HOTFIX |
| `src/components/Web3/WalletChangeConfirmDialog.tsx` | Sua: them canh bao | Quan trong |
| `src/components/Admin/tabs/WalletAuditTab.tsx` | Tao moi | Quan trong |

### Dieu KHONG thay doi

- `reward_transactions` da dung `user_id` lam identity → khong can migrate
- `claim_requests` da dung `user_id` → khong can migrate
- Tong dong tien khong bi anh huong vi chi thay doi wallet destination, khong thay doi reward data

### Thu tu trien khai

1. Chay migration tao bang + cot + RPC (database)
2. Insert feature flags (WALLET_CHANGE_DISABLED=true de chan ngay)
3. Cap nhat `claim-camly` edge function (them freeze check)
4. Cap nhat frontend hooks + UI
5. Tao admin audit tab
6. Test end-to-end

