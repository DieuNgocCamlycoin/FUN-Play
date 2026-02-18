

# Enhance Wallet Detective with On-Chain Moralis Lookup

## Overview
When the local database has no results for a traced wallet, the Wallet Detective will automatically query the Moralis API to fetch CAMLY token transfers on-chain, then cross-reference the sender addresses with registered user profiles.

## Changes

### 1. New Edge Function: `wallet-detective-onchain`
Create `supabase/functions/wallet-detective-onchain/index.ts` that:
- Accepts `{ wallet_address, admin_token }` via POST
- Validates admin role using `auth.getUser(token)` + `has_role` RPC
- Calls Moralis API to fetch all ERC-20 transfers **to** the given wallet for CAMLY token (`0x0910...e413`)
- Aggregates unique `from_address` values with total amounts and tx counts
- Queries `profiles` table to match `from_address` against `wallet_address` (case-insensitive)
- Returns the same shape as `trace_wallet_detective` RPC: `{ user_id, username, display_name, avatar_url, avatar_verified, wallet_address, total_amount, tx_count, created_at, banned }`
- For unmatched wallets (no profile), returns them separately as `unmatched_wallets` with address, amount, and tx count

### 2. Config Update
Add to `supabase/config.toml`:
```toml
[functions.wallet-detective-onchain]
verify_jwt = false
```

### 3. Frontend Update: `WalletDetectiveTab.tsx`
Modify the `handleTrace` flow:
1. First, call the existing `trace_wallet_detective` RPC (local DB)
2. If results are empty (0 users found), automatically call the new `wallet-detective-onchain` edge function
3. Show a visual indicator that data came from on-chain (e.g., a badge "On-chain data" at the top)
4. Add a new section below matched users showing "Unmatched Wallets" -- addresses that sent CAMLY but are not registered in the system
5. Add a "Sync to DB" button that triggers the `backfill-moralis` function for the target wallet to import on-chain data permanently

### 4. Data Flow

```text
User clicks "Trace"
       |
       v
  RPC: trace_wallet_detective (local DB)
       |
       +-- Has results --> Show results (current behavior)
       |
       +-- No results --> Call wallet-detective-onchain edge function
                |
                v
          Moralis API: fetch CAMLY transfers TO target wallet
                |
                v
          Match from_addresses against profiles.wallet_address
                |
                +-- Matched users --> Show as DetectiveResult (with "On-chain" badge)
                +-- Unmatched wallets --> Show in separate "Unknown Wallets" table
```

## Technical Details

- **Edge function** uses `MORALIS_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (both already configured as secrets)
- Moralis endpoint: `GET /{wallet}/erc20/transfers?chain=bsc&contract_addresses[]={CAMLY_TOKEN}&order=DESC`
- Reuses the same Moralis patterns from `backfill-moralis` function
- Admin auth: extract Bearer token from Authorization header, validate via `auth.getUser()` + `has_role(uid, 'admin')`
- CORS headers included for web compatibility
- Mobile and web share the same component, so both platforms get the enhancement automatically
