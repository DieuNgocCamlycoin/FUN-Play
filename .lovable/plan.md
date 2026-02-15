
# Fix FUN PLAY TREASURY Identity for Claim Donation Transactions

## Root Cause

The system has **two different Treasury user accounts**:

1. **`f0f0f0f0-0000-0000-0000-000000000001`** - Old system account ("Fun Pay Treasurer", email: `treasurer@funplay.system`). This is used as `sender_id` in `donation_transactions` with `context_type = 'claim'`. It has **no wallet_address** and its auto-created channel is named "treasurer@funplay.system's Channel".

2. **`cc9cd3a1-8541-4f6f-b10e-f5619e0de832`** - The real FUN PLAY TREASURY profile with the correct wallet address, avatar, and display name. This is what `systemWallets.ts` references.

The current system wallet detection only checks by `wallet_address`, but the old treasury account (`f0f0f0f0-...`) has no wallet address. So for claim donation_transactions, the system wallet override fails and the raw channel name ("treasurer@funplay.system's Channel") is displayed instead of "FUN PLAY TREASURY".

## Solution

### Step 1: Add the old Treasury user ID to `systemWallets.ts`

Add a constant for the old system sender ID so it can be recognized:

```text
// In systemWallets.ts - new constant
export const SYSTEM_TREASURY_SENDER_ID = "f0f0f0f0-0000-0000-0000-000000000001";
```

### Step 2: Update donation_transactions normalization in `useTransactionHistory.ts`

In the donation_transactions normalization section (around line 294), add a special check: when `context_type === 'claim'` and `sender_id` matches the old system sender ID, override with `SYSTEM_WALLETS.TREASURY` config instead of using the profile data.

```text
// In the donation_transactions forEach:
// Special handling for claim transactions from old system account
if (d.context_type === 'claim' && d.sender_id === SYSTEM_TREASURY_SENDER_ID) {
  // Use TREASURY config instead of profile data
  finalSenderInfo = {
    displayName: SYSTEM_WALLETS.TREASURY.displayName,
    username: SYSTEM_WALLETS.TREASURY.username,
    avatarUrl: SYSTEM_WALLETS.TREASURY.avatarUrl,
    channelName: SYSTEM_WALLETS.TREASURY.channelName,
  };
  // Override sender_user_id to link to real TREASURY channel
  senderUserId = SYSTEM_WALLETS.TREASURY.userId || null;
  senderWalletFrom = formatAddress(SYSTEM_WALLETS.TREASURY.address);
  senderWalletFromFull = SYSTEM_WALLETS.TREASURY.address;
}
```

This ensures:
- Display name shows "FUN PLAY TREASURY" (not "treasurer@funplay.system")
- Avatar shows the correct Fun Play logo
- Wallet address shows `0x9848...0E8`
- Clicking navigates to the real TREASURY channel page
- The fix applies to both the public /transactions page and personal wallet history
- Works on both web and mobile

## Files Changed

| File | Change |
|------|--------|
| `src/config/systemWallets.ts` | Add `SYSTEM_TREASURY_SENDER_ID` constant |
| `src/hooks/useTransactionHistory.ts` | Import new constant; add claim-specific override in donation_transactions normalization |
