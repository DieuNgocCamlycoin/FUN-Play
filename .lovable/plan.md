

# Update FUN PLAY TREASURY Identity and Channel Linking

## Problem
The TREASURY wallet config has the wrong address (`0x1DC2...5998`) and no link to the actual FUN PLAY TREASURY channel. The real TREASURY profile exists in the database with:
- User ID: `cc9cd3a1-8541-4f6f-b10e-f5619e0de832`
- Username: `user_cc9cd3a1`
- Wallet: `0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC`
- Avatar: stored in cloud storage

Clicking on the TREASURY sender in transaction cards does nothing because `sender_user_id` is set to `null`.

## Solution

### 1. Add `userId` to SystemWalletInfo interface
Add an optional `userId` field so system wallets can link to their channel/profile pages.

### 2. Update TREASURY config in `systemWallets.ts`

| Field | Current | Updated |
|-------|---------|---------|
| address | `0x1DC24BFd...5998` | `0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC` |
| username | `@funplaytreasury` | `@user_cc9cd3a1` |
| avatarUrl | `/images/funplay-planet-logo.png` | Cloud avatar URL from the profile |
| userId | (not present) | `cc9cd3a1-8541-4f6f-b10e-f5619e0de832` |

Display name and channel name remain "FUN PLAY TREASURY".

### 3. Update `useTransactionHistory.ts` - Pass userId for claim transactions
Change `sender_user_id: null` to `sender_user_id: SYSTEM_WALLETS.TREASURY.userId` so that clicking on the TREASURY avatar/name in the TransactionCard navigates to `/user/cc9cd3a1-...` (which resolves to the channel page).

## Files Changed

| File | Change |
|------|--------|
| `src/config/systemWallets.ts` | Add `userId` field to interface; update TREASURY address, username, avatar, userId |
| `src/hooks/useTransactionHistory.ts` | Use `SYSTEM_WALLETS.TREASURY.userId` for `sender_user_id` in claim transactions |

## Technical Details

```text
// systemWallets.ts - Interface update
export interface SystemWalletInfo {
  address: string;
  displayName: string;
  username: string;
  channelName: string;
  avatarUrl: string;
  userId?: string | null;  // Optional: links to user profile/channel
}

// systemWallets.ts - TREASURY config
TREASURY: {
  address: "0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC",
  displayName: "FUN PLAY TREASURY",
  username: "@user_cc9cd3a1",
  channelName: "FUN PLAY TREASURY",
  avatarUrl: "https://pub-348064b6f39043d6be2bfb92d648edb8.r2.dev/cc9cd3a1-.../play_fun.jpg",
  userId: "cc9cd3a1-8541-4f6f-b10e-f5619e0de832",
}

// useTransactionHistory.ts - Line 368
sender_user_id: SYSTEM_WALLETS.TREASURY.userId || null,
```

This ensures:
- Correct wallet address displayed for all claim transactions
- Correct avatar from the TREASURY profile
- Clicking on TREASURY name/avatar navigates to the channel page
- Works consistently on both web and mobile
