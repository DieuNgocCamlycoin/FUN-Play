

# Update FUN PLAY TREASURY Logo

## Problem
The TREASURY wallet's `avatarUrl` in `src/config/systemWallets.ts` is set to `/images/fun-play-wallet-icon.png` instead of the correct Fun Play planet logo (`/images/funplay-planet-logo.png`). This causes the wrong logo to appear for claim transactions across the app.

## Solution
Update a single line in `src/config/systemWallets.ts` to change the TREASURY `avatarUrl` from `/images/fun-play-wallet-icon.png` to `/images/funplay-planet-logo.png`.

Since the previous update already centralized all TREASURY references to use `SYSTEM_WALLETS.TREASURY`, this one change will automatically propagate to:
- Transaction history page
- Personal transaction history in the wallet page
- All other sections that reference the TREASURY wallet

## File Changed

| File | Change |
|------|--------|
| `src/config/systemWallets.ts` | Change TREASURY `avatarUrl` to `/images/funplay-planet-logo.png` |

## Technical Detail

```text
// Line 31 - Before:
avatarUrl: "/images/fun-play-wallet-icon.png",

// After:
avatarUrl: "/images/funplay-planet-logo.png",
```

No other files need changes since the centralized config is already referenced everywhere.

