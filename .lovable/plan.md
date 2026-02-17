

# Claim System: Cleanup and Monitoring

## Current Status

The claim system fix (decimals 18 -> 3) is **deployed and working correctly**. No claims have been attempted since the fix went live at 06:28 UTC today. The edge function returns proper friendly Vietnamese messages, the frontend handles them, and data integrity is confirmed (users have matching approved reward_transactions).

## Task 1: Clean up 148 old failed claim records

Delete or mark the 148 failed `claim_requests` with error "Insufficient CAMLY balance in reward pool" from before the fix. These are noise records that clutter the admin view.

**Approach**: Use a SQL UPDATE to mark them as `status = 'cleaned'` (or DELETE them entirely). Since these are historical records, a simple cleanup is safest.

```sql
-- Mark old failed claims as cleaned (preserves audit trail)
UPDATE claim_requests 
SET status = 'cleaned', error_message = 'Auto-cleaned: caused by decimal mismatch bug (fixed 2026-02-17)'
WHERE status = 'failed' AND error_message = 'Insufficient CAMLY balance in reward pool';
```

Alternatively, DELETE them if you prefer no trace.

## Task 2: Admin notification when reward pool balance is low

Create a lightweight monitoring check that runs when any claim succeeds. After a successful claim in the `claim-camly` edge function, check the remaining admin wallet balance. If it drops below a configurable threshold (e.g., 5,000,000 CAMLY), insert a notification into the `notifications` table for admin users.

**Changes**:
- **`supabase/functions/claim-camly/index.ts`**: After a successful transfer, check remaining balance. If below threshold, insert a notification for admin users (query `user_roles` for admin role holders).
- **`reward_config` table**: Add a new config key `LOW_POOL_THRESHOLD` with default value 5,000,000 so admins can adjust via the existing config UI.

This approach is resource-efficient: it only checks on successful claims (not on a cron schedule), and uses the existing notification system.

## Technical Details

### File: `supabase/functions/claim-camly/index.ts`

After the successful transfer block (after `receipt.hash` is obtained), add:

```typescript
// Post-transfer: check remaining pool balance for low-balance alert
const remainingBalance = adminBalance - amountInWei;
const lowThreshold = config['LOW_POOL_THRESHOLD'] || 5000000;
const lowThresholdWei = ethers.parseUnits(lowThreshold.toString(), 3);

if (remainingBalance < lowThresholdWei) {
  // Notify all admins
  const { data: admins } = await supabaseAdmin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  
  if (admins?.length) {
    const notifications = admins.map(a => ({
      user_id: a.user_id,
      type: 'system',
      title: 'Canh bao: Be thuong CAMLY sap het!',
      message: `So du be thuong con lai thap. Vui long nap them CAMLY.`,
      link: '/admin'
    }));
    await supabaseAdmin.from('notifications').insert(notifications);
  }
}
```

### Database: Add config key

```sql
INSERT INTO reward_config (config_key, config_value, description)
VALUES ('LOW_POOL_THRESHOLD', 5000000, 'Nguong canh bao so du be thuong thap (CAMLY)')
ON CONFLICT (config_key) DO NOTHING;
```

### Cleanup SQL

```sql
UPDATE claim_requests 
SET status = 'cleaned', 
    error_message = 'Auto-cleaned: decimal mismatch bug (fixed 2026-02-17)'
WHERE status = 'failed' 
  AND error_message = 'Insufficient CAMLY balance in reward pool';
```

## Files to Change

1. `supabase/functions/claim-camly/index.ts` -- add low-balance alert after successful claim
2. Database INSERT for `LOW_POOL_THRESHOLD` config
3. Database UPDATE to clean 148 old failed records

## No Frontend Changes Needed

The existing notification system will display the low-balance alert to admins automatically.
