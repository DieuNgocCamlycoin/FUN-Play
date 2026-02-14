

# Fix: Daily Claim Limit Enforcement + Friendly Messages + Claim Receipt

## Problems Found

### Problem 1: Daily Claim Limit Never Enforced
The `claim-camly` edge function checks `daily_claim_records` for the daily 500,000 CAMLY cap (line 155-163), but **never writes to it** after a successful claim. This means the daily limit always reads as 0 and users can claim unlimited times per day.

**Fix**: After a successful claim, upsert a record into `daily_claim_records` with the claimed amount.

### Problem 2: Friendly Vietnamese Message When Hitting Daily Limit
When a user tries to claim again after reaching the 500,000/day cap, the current error message is functional but not as friendly as requested. Update it to:
"Chuc mung ban da claim thanh cong! Ban da dat gioi han rut trong ngay. Vui long quay lai ngay mai de rut tiep."

### Problem 3: Gradual Deduction After 24 Hours
The daily limit resets naturally because `daily_claim_records` uses a `date` column. When a new day starts (UTC), the query for today's date returns no record, so the full 500,000 limit is available again. The remaining approved balance stays intact and can be claimed the next day. This already works correctly once we fix Problem 1.

### Problem 4: Claim Receipt Not Showing
The `ClaimReceipt` component in `Receipt.tsx` uses the frontend Supabase client to query `claim_requests` directly. This relies on RLS policies. For public viewing (e.g., sharing on social media), the RLS policy requires `tx_hash IS NOT NULL AND status = 'success'` -- which should work for successful claims.

However, the real issue is that `ClaimReceipt` uses the **regular supabase client** which requires the viewer to either be the claim owner OR the claim must be public (successful + has tx_hash). For shared links where the viewer is not logged in, the anon key should match the public policy. But there may be a query issue with the join syntax `profiles:user_id(...)` not working with anon access.

**Fix**: Create a dedicated edge function `get-claim-receipt` (like the existing `get-donation-receipt`) that uses the service role key to fetch claim data, bypassing RLS issues entirely. This ensures the receipt is always accessible via public link.

---

## Technical Changes

### 1. Edge Function: `supabase/functions/claim-camly/index.ts`

After the successful claim block (after line 348), add a daily_claim_records upsert:

```
// Record daily claim
await supabaseAdmin
  .from('daily_claim_records')
  .upsert({
    user_id: user.id,
    date: today,
    total_claimed: todayClaimed + claimAmount,
    claim_count: (dailyClaim?.claim_count || 0) + 1
  }, { onConflict: 'user_id,date' });
```

Also update the daily limit error message (line 168) to the friendly Vietnamese message:
"Chuc mung, ban da claim thanh cong! Ban da dat gioi han rut 500.000 CAMLY trong ngay. Vui long quay lai ngay mai de rut tiep nhe!"

### 2. New Edge Function: `supabase/functions/get-claim-receipt/index.ts`

Create a simple GET endpoint that:
- Accepts `claim_id` as query parameter
- Uses service role key to fetch `claim_requests` joined with `profiles`
- Returns the claim data with user profile info
- No auth required (public receipt viewing)

### 3. Frontend: `src/pages/Receipt.tsx`

Update `ClaimReceipt` to call the `get-claim-receipt` edge function instead of querying Supabase directly (matching how `DonationReceipt` uses `get-donation-receipt`).

### 4. Frontend: `src/components/Rewards/ClaimRewardsModal.tsx`

Update the claim error handling to show the friendly daily limit message with proper Vietnamese text.

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/claim-camly/index.ts` | Add daily_claim_records upsert after success, update daily limit message |
| `supabase/functions/get-claim-receipt/index.ts` | New edge function for public claim receipt access |
| `src/pages/Receipt.tsx` | Use edge function instead of direct Supabase query for claim receipts |
| `src/components/Rewards/ClaimRewardsModal.tsx` | Better Vietnamese error messages for daily limit |

