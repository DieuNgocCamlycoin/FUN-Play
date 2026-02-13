

# Fix Reward History Page - Incorrect Total Calculations

## Problem Analysis

After tracing through the entire reward system data flow, I found **3 critical calculation bugs** on the Reward History page:

### Bug 1: "Co the claim" (Claimable) shows wrong value
- **Current**: Uses `approved_camly` from RPC `get_user_activity_summary`, which sums `amount WHERE approved=true` from `reward_transactions`
- **Problem**: Since ALL rewards are auto-approved, this equals `total_camly` (total earned) -- making it identical to "Tong da kiem"
- **Correct**: Should use `profiles.approved_reward` which is the ACTUAL current claimable balance (decremented when claims are processed)

### Bug 2: "Da claim" (Claimed) shows 0
- **Current**: Calculated as `total_camly - approved_camly` = 0 (since both values are the same)
- **Correct**: Should use the actual sum from `claim_requests WHERE status='success'`

### Bug 3: "Summary by Type" inaccurate for active users
- **Current**: Calculates per-type totals from `transactions` array limited to 500 rows
- **Problem**: Users with more than 500 transactions will see incorrect per-type breakdowns

**Example from real data (user 02ed6b21):**
- `total_camly_rewards` = 6,775,000
- `approved_reward` (actual claimable) = 3,963,000
- Successfully claimed = 1,310,000
- But the page shows: Claimable = 6,775,000 and Claimed = 0

## Solution

### Step 1: Update the `get_user_activity_summary` RPC function

Enhance the RPC to:
- Return per-type AMOUNT totals (not just counts) for accurate summary
- Fetch `approved_reward` from `profiles` table for current claimable balance
- Fetch total claimed from `claim_requests` table

New RPC will return:
```text
{
  views, likes, comments, shares, uploads,          -- counts (existing)
  total_camly,                                       -- total earned (existing)
  claimable_balance,                                 -- from profiles.approved_reward (NEW)
  total_claimed,                                     -- from claim_requests (NEW)
  type_amounts: {VIEW: X, LIKE: Y, COMMENT: Z, ...} -- per-type amounts (NEW)
}
```

### Step 2: Update RewardHistory.tsx

- Use `claimable_balance` from RPC for the "Co the claim" card
- Use `total_claimed` from RPC for the "Da claim" card
- Use `type_amounts` from RPC for "Summary by Type" section instead of client-side calculation from limited data
- These fixes apply to both desktop and mobile views (same component)

### Step 3: Deploy and verify

- Test with real user data to confirm all 3 stat cards show correct values
- Verify the summary by type matches actual database totals

## Technical Details

### Migration: Update RPC function
```sql
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'views', COUNT(*) FILTER (WHERE rt.reward_type = 'VIEW'),
    'likes', COUNT(*) FILTER (WHERE rt.reward_type = 'LIKE'),
    'comments', COUNT(*) FILTER (WHERE rt.reward_type = 'COMMENT'),
    'shares', COUNT(*) FILTER (WHERE rt.reward_type = 'SHARE'),
    'uploads', COUNT(*) FILTER (WHERE rt.reward_type IN ('UPLOAD','SHORT_VIDEO_UPLOAD','LONG_VIDEO_UPLOAD','FIRST_UPLOAD')),
    'total_camly', COALESCE(SUM(rt.amount), 0),
    'approved_camly', COALESCE(SUM(rt.amount) FILTER (WHERE rt.approved = true), 0),
    'pending_camly', COALESCE(SUM(rt.amount) FILTER (WHERE rt.approved = false OR rt.approved IS NULL), 0),
    'claimable_balance', COALESCE((SELECT approved_reward FROM profiles WHERE id = p_user_id), 0),
    'total_claimed', COALESCE((SELECT SUM(amount) FROM claim_requests WHERE user_id = p_user_id AND status = 'success'), 0),
    'type_amounts', jsonb_build_object(
      'VIEW', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'VIEW'), 0),
      'LIKE', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'LIKE'), 0),
      'COMMENT', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'COMMENT'), 0),
      'SHARE', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'SHARE'), 0),
      'UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'UPLOAD'), 0),
      'SHORT_VIDEO_UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'SHORT_VIDEO_UPLOAD'), 0),
      'LONG_VIDEO_UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'LONG_VIDEO_UPLOAD'), 0),
      'FIRST_UPLOAD', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'FIRST_UPLOAD'), 0),
      'SIGNUP', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'SIGNUP'), 0),
      'WALLET_CONNECT', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'WALLET_CONNECT'), 0),
      'BOUNTY', COALESCE(SUM(rt.amount) FILTER (WHERE rt.reward_type = 'BOUNTY'), 0)
    )
  )
  FROM public.reward_transactions rt
  WHERE rt.user_id = p_user_id AND rt.status = 'success';
$$;
```

### RewardHistory.tsx changes
- Line 187-192: Replace stat calculations with new RPC fields
- Lines 334-351: Replace client-side type summary with `type_amounts` from RPC

