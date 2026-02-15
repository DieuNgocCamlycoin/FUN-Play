

# Fix: Deploy the Updated get-donation-receipt Edge Function

## Root Cause

The code in `supabase/functions/get-donation-receipt/index.ts` already has the correct TREASURY_OVERRIDE logic, but the **deployed version** is still the old one. The network response confirms this:

- Current response: `"sender": {"username": "funpay_treasurer", "display_name": "Fun Pay Treasurer", "avatar_url": "/images/logo.png"}` (no channel_name, no wallet_address)
- Expected response: `"sender": {"username": "user_cc9cd3a1", "display_name": "FUN PLAY TREASURY", "avatar_url": "https://pub-...play_fun.jpg", "wallet_address": "0x9848...", "channel_name": "FUN PLAY TREASURY"}`

## Fix

### Step 1: Redeploy the `get-donation-receipt` edge function

The existing code already has:
- System treasury sender detection (`sender_id === f0f0f0f0...` or `context_type === "claim"`)
- TREASURY_OVERRIDE with correct name, avatar, wallet address, and channel name
- Channel name fetching for both sender and receiver

No code changes are needed -- just a redeployment.

### Step 2: Verify the fix

After deployment, test the receipt at `/receipt/547f415c4c4c91ff` to confirm:
- Sender shows "FUN PLAY TREASURY" with correct avatar
- Receiver shows channel name (not raw username)
- Wallet addresses are displayed correctly

## Files Changed

None -- the code is already correct. Only redeployment is needed.

