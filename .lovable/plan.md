

# Wallet Connection - Context Provider (Eliminate Duplicate Instances)

## Problem

After two rounds of optimization, the individual hook logic is stable and performant. However, **7 separate components** each independently call `useWalletConnection()` or `useWalletConnectionWithRetry()`:

| Component | Hook Used |
|---|---|
| WalletButton | useWalletConnectionWithRetry |
| Wallet page | useWalletConnectionWithRetry |
| ClaimRewardsSection | useWalletConnectionWithRetry |
| ClaimRewardsModal | useWalletConnectionWithRetry |
| MultiTokenWallet | useWalletConnection |
| TokenSwap | useWalletConnection |
| NFTMintModal | useWalletConnection |
| SendToFunWalletModal | useWalletConnection |

Each instance creates its own `watchAccount` subscription, its own DB fetch for the user's saved wallet, and its own chain-switch logic. On a page like Wallet that renders WalletButton + ClaimRewardsSection + ClaimRewardsModal, there are **4 parallel subscriptions** doing the same thing.

## Solution

Create a single `WalletProvider` context that runs the wallet logic once at the app level. All components consume the shared state via `useWalletContext()` instead of creating their own instances.

## Implementation Plan

### Step 1: Create WalletContext Provider

Create `src/contexts/WalletContext.tsx`:
- Move all `useWalletConnectionWithRetry()` logic into a React Context Provider
- The Provider calls `useWalletConnectionWithRetry()` once
- Export a `useWalletContext()` hook that reads from Context
- Throw a helpful error if used outside the Provider

### Step 2: Add WalletProvider to App

Wrap the app's component tree with `<WalletProvider>` inside the existing providers (after WagmiProvider/QueryClientProvider so wagmi hooks work).

### Step 3: Update all 8 consumer components

Replace all `useWalletConnection()` and `useWalletConnectionWithRetry()` calls with `useWalletContext()`:

- `WalletButton.tsx` - change import and hook call
- `Wallet.tsx` (page) - change import and hook call
- `ClaimRewardsSection.tsx` - change import and hook call
- `ClaimRewardsModal.tsx` - change import and hook call
- `MultiTokenWallet.tsx` - change import and hook call
- `TokenSwap.tsx` - change import and hook call
- `NFTMintModal.tsx` - change import and hook call
- `SendToFunWalletModal.tsx` - change import and hook call

### Step 4: Keep original hooks as internal modules

The original `useWalletConnection.ts` and `useWalletConnectionWithRetry.ts` stay as-is but are only imported by the WalletContext Provider. This preserves all the existing stability fixes.

## Technical Details

### New File: `src/contexts/WalletContext.tsx`

```text
WalletProvider
  --> calls useWalletConnectionWithRetry() once
  --> provides all wallet state + actions via React Context
  --> single watchAccount subscription for entire app

useWalletContext()
  --> reads from Context
  --> returns same interface as useWalletConnectionWithRetry
  --> throws error if used outside Provider
```

### Performance Impact
- Reduces watchAccount subscriptions from 4-7 per page to exactly 1
- Eliminates 4-7 duplicate DB queries for saved wallet on each navigation
- Removes 4-7 duplicate chain-switch attempts when on wrong chain
- No change to user-facing behavior -- everything works identically

### Files to Create
- `src/contexts/WalletContext.tsx`

### Files to Modify
- `src/App.tsx` (add WalletProvider)
- `src/components/Web3/WalletButton.tsx`
- `src/pages/Wallet.tsx`
- `src/components/Wallet/ClaimRewardsSection.tsx`
- `src/components/Rewards/ClaimRewardsModal.tsx`
- `src/components/Web3/MultiTokenWallet.tsx`
- `src/components/Web3/TokenSwap.tsx`
- `src/components/NFT/NFTMintModal.tsx`
- `src/components/Web3/SendToFunWalletModal.tsx`

### No Database Changes Required

