

# Update FUN PLAY TREASURY Wallet Identity for Claim Transactions

## Problem
The TREASURY wallet identity is duplicated in two places:
1. **`systemWallets.ts`** config has outdated names: "Vi tang thuong 1" (Vietnamese for "Reward Wallet 1")
2. **`useTransactionHistory.ts`** hardcodes "FUN PLAY TREASURY" info (lines 367-374) instead of using the centralized config

This means the config is not the single source of truth, and the TREASURY wallet displays inconsistently depending on where it's referenced.

## Solution

### Step 1: Update `systemWallets.ts` - Set correct TREASURY identity
Update the TREASURY entry to use "FUN PLAY TREASURY" as the official display name, matching what the user expects to see in all transaction views.

| Field | Current | Updated |
|-------|---------|---------|
| displayName | "Vi tang thuong 1" | "FUN PLAY TREASURY" |
| username | "@vitangthuong1" | "@funplaytreasury" |
| channelName | "Vi tang thuong 1" | "FUN PLAY TREASURY" |
| avatarUrl | `/images/fun-play-wallet-icon.png` | `/images/funplay-planet-logo.png` (or keep current) |

### Step 2: Update `useTransactionHistory.ts` - Use config instead of hardcoded values
Replace the hardcoded TREASURY info in the claim_requests normalization (lines 367-374) with a reference to `SYSTEM_WALLETS.TREASURY` from the config. This ensures any future changes to the TREASURY identity are automatically reflected everywhere.

```text
// Before (hardcoded):
sender_display_name: "FUN PLAY TREASURY",
sender_username: "@funplaytreasury",
sender_avatar_url: "/images/fun-play-wallet-icon.png",
sender_channel_name: "FUN PLAY TREASURY",
wallet_from: "0x1DC2...998",
wallet_from_full: "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",

// After (from config):
sender_display_name: SYSTEM_WALLETS.TREASURY.displayName,
sender_username: SYSTEM_WALLETS.TREASURY.username,
sender_avatar_url: SYSTEM_WALLETS.TREASURY.avatarUrl,
sender_channel_name: SYSTEM_WALLETS.TREASURY.channelName,
wallet_from: formatAddress(SYSTEM_WALLETS.TREASURY.address),
wallet_from_full: SYSTEM_WALLETS.TREASURY.address,
```

## Files Changed

| File | Change |
|------|--------|
| `src/config/systemWallets.ts` | Update TREASURY displayName, username, channelName to "FUN PLAY TREASURY" |
| `src/hooks/useTransactionHistory.ts` | Import `SYSTEM_WALLETS` and replace hardcoded TREASURY values with config references |

## Impact
- All claim transactions (rut thuong) will show "FUN PLAY TREASURY" with the correct logo
- Transaction history page, personal wallet history, and all related sections will be consistent
- Future name/logo changes only need updating in one place (`systemWallets.ts`)

