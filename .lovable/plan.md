

# Fix Claim Receipt: Correct Profile, Wallet & Treasury Display

## Problems Identified

1. **Missing channel name**: The edge function only fetches `profiles` but not the user's `channels` table data, so the receipt shows raw username (e.g., `user_35cca77d`) instead of the channel name.
2. **No FUN PLAY TREASURY sender info**: Claim receipts are withdrawals from the Treasury to the user, but the receipt only shows the user -- it should also show FUN PLAY TREASURY as the sender (similar to how donation receipts show sender and receiver).
3. **Profile wallet_address not fetched**: The edge function selects `id, username, display_name, avatar_url` but omits `wallet_address`, so the receipt can't cross-reference the user's registered wallet.

## Plan

### Step 1: Update the Edge Function (`get-claim-receipt`)

Modify `supabase/functions/get-claim-receipt/index.ts` to:
- Also fetch the user's **channel data** from the `channels` table (name field)
- Include `wallet_address` in the profile select
- Return channel info alongside profile

```
profiles select: "id, username, display_name, avatar_url, wallet_address"
channels select: "name" where user_id = claim.user_id
```

### Step 2: Update the ClaimReceipt Component (`src/pages/Receipt.tsx`)

Modify the `ClaimReceipt` function to:
- Import `getSystemWalletInfo` from `src/config/systemWallets.ts` and use TREASURY config
- Add a **sender section** showing FUN PLAY TREASURY with its avatar, name, and wallet address (similar to the donation receipt's sender/receiver layout)
- Use the **channel name** (from the edge function response) as the primary display name instead of raw username
- Show the user's correct avatar, channel name, and @username

### Step 3: Layout Changes

The claim receipt will show:
- **FUN PLAY TREASURY** (sender) with its configured avatar and name
- Arrow indicator
- **User** (receiver) with their channel name, avatar, and @username
- Amount, wallet address, TX hash, and status (unchanged)

## Technical Details

### Edge Function Changes
- Add a second query to `channels` table joining on `user_id`
- Return `{ ...claim, profiles: profile, channel: channel }`

### Frontend Changes
- Import `SYSTEM_WALLETS` from `systemWallets.ts`
- Use `SYSTEM_WALLETS.TREASURY` for sender display (avatar, name, wallet address)
- Use channel name as primary display name via the `getUserDisplayInfo` pattern
- Add sender-receiver visual layout matching the donation receipt style

