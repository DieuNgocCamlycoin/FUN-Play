
# Fix: Ví Tặng Thưởng 1 Showing 0 CAMLY / 0 USDT

## Root Cause

The wallet address configured for "Vi tang thuong 1" (TREASURY) in `src/config/systemWallets.ts` is **wrong**. It was changed to `0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC` (which is a user profile wallet), but the actual treasury wallet that sent all the reward transactions from Nov 25, 2025 to Jan 8, 2026 is `0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998`.

Database verification:
- `0x9848...e4cC` (current config): **0 transactions** in wallet_transactions
- `0x1DC2...5998` (correct address): **101 completed transactions** totaling ~19.7M CAMLY + 491 USDT in the Nov 25 - Jan 8 date range

## Fix

### File: `src/config/systemWallets.ts`

Change the TREASURY address back to the correct one:

```
TREASURY: {
  address: "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",  // was 0x9848...
  ...
}
```

This single change will make all transaction data reappear in the Reward Pool admin tab because the `RewardPoolTab.tsx` queries `wallet_transactions` using `SYSTEM_WALLETS.TREASURY.address`. Once the address matches the actual on-chain data, the stats and transaction detail table will populate correctly.

No other files need changes -- the RewardPoolTab query logic, date filters, and UI are all correct.
