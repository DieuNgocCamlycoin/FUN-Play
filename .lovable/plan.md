

# Bulk & Individual Reward Approval System

## Current Situation

- **122 users** have unapproved rewards totaling **25,621,000 CAMLY** (4,717 transactions)
- **191 users** already have approved rewards totaling **66,362,000 CAMLY** ready to claim
- The existing admin page has individual approve/reject buttons but **no bulk approval**
- After approval, users can claim rewards to their wallets via the existing claim system

## What Will Be Built

### 1. New Database Function: `bulk_approve_all_rewards`
A server-side function that approves ALL pending rewards for ALL users in one atomic operation:
- Moves `pending_rewards` to `approved_reward` for every user
- Marks all unapproved `reward_transactions` as `approved = true`
- Logs each approval in `reward_approvals` table
- Returns count of affected users and total amount

### 2. Updated Admin Reward Approval Tab
Add two new buttons at the top of the "Cho Duyet" (Pending) tab:

- **"Duyet Tat Ca" (Approve All)** button -- bulk approves all 122 pending users at once with a confirmation dialog
- Keep existing **individual approve/reject** buttons per user (already working)

### 3. Mobile-Optimized UI
- Buttons sized appropriately for touch targets
- Confirmation dialog before bulk approval to prevent accidents
- Toast notifications showing results (e.g., "Da duyet 122 users, tong 25,621,000 CAMLY")

## Technical Details

### New RPC Function SQL:
```sql
CREATE OR REPLACE FUNCTION bulk_approve_all_rewards(p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_affected_users integer;
  v_total_amount numeric;
BEGIN
  -- Verify admin role
  IF NOT has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can bulk approve';
  END IF;

  -- Count what will be affected
  SELECT COUNT(DISTINCT user_id), COALESCE(SUM(pending_rewards), 0)
  INTO v_affected_users, v_total_amount
  FROM profiles WHERE pending_rewards > 0;

  -- Move pending to approved for all users
  UPDATE profiles SET
    approved_reward = COALESCE(approved_reward, 0) + COALESCE(pending_rewards, 0),
    pending_rewards = 0
  WHERE pending_rewards > 0;

  -- Mark all unapproved transactions as approved
  UPDATE reward_transactions SET
    approved = true,
    approved_at = now(),
    approved_by = p_admin_id
  WHERE approved = false AND claimed = false AND status = 'success';

  -- Log bulk approval
  INSERT INTO reward_approvals (user_id, amount, status, admin_id, admin_note, reviewed_at)
  SELECT id, pending_amt, 'approved', p_admin_id, 'Bulk approval', now()
  FROM (SELECT id, COALESCE(pending_rewards,0) as pending_amt FROM profiles) sub
  WHERE pending_amt > 0;

  RETURN jsonb_build_object(
    'affected_users', v_affected_users,
    'total_amount', v_total_amount
  );
END;
$$;
```

### Frontend Changes:
- **File: `src/components/Admin/tabs/RewardApprovalTab.tsx`** -- Add "Duyet Tat Ca" button with AlertDialog confirmation, connect to new RPC
- **File: `src/hooks/useAdminManage.ts`** -- Add `bulkApproveAll()` function calling the new RPC

### User Flow After Approval:
1. Admin clicks "Duyet Tat Ca" on admin page
2. All 122 users' rewards become "approved" instantly
3. Each user opens their Wallet page and sees claimable CAMLY
4. User connects wallet and clicks "Claim" -- existing `claim-camly` edge function sends CAMLY tokens on-chain

No changes needed to the claim flow -- it already works correctly with approved rewards.

