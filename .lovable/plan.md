

# System Check Report & Fix Plan for FUN Play

## Current Status: One Functional Bug Found

After comprehensive testing across 15+ pages on mobile (390x844), reviewing all console logs, and analyzing network requests, the system is running stably overall. All previous fixes are verified working:

- Search page: Working correctly, no errors
- MainLayout standardization: All pages properly wrapped
- Mobile header alignment: Consistent `pt-12 lg:pt-14` across all pages
- Safe-area CSS, FUN Money navigation, realtime subscriptions: All stable

## Issue Found

### Wallet Transaction History Returns 400 Errors (Medium-High Priority)

**Console logs confirm two 400 errors on the `/wallet` page:**

```
Failed to load resource: 400 - donation_transactions?select=*,receiver:receiver_id(...)
Failed to load resource: 400 - donation_transactions?select=*,sender:sender_id(...)
```

**Root Cause:** The `TransactionHistorySection.tsx` component tries to join `profiles` data using PostgREST relationship syntax:
- `receiver:receiver_id(id, username, display_name, avatar_url)`
- `sender:sender_id(id, username, display_name, avatar_url)`
- `token:token_id(symbol)`

However, the `donation_transactions` table has **zero foreign keys** in the database. The `sender_id` and `receiver_id` columns are plain UUID columns with no FK constraint to `profiles`, and `token_id` has no FK to `donate_tokens`. PostgREST cannot resolve joins without foreign keys, so it returns 400.

**Impact:** Users see an empty transaction history on the Wallet page. The reward transactions still load (separate table, no joins), but all donation transactions fail silently.

**Fix:** Use the same proven "separate queries" pattern from `Search.tsx` and `Index.tsx`:
1. Query `donation_transactions` with flat select (no joins)
2. Collect unique `sender_id`, `receiver_id`, and `token_id` values
3. Run separate queries to `profiles` and `donate_tokens` tables
4. Merge the data using maps

### Non-Issues (Already Working / Known Preview-Only)
- WalletConnect CSP framing: Preview environment only
- Manifest CORS error: Preview environment only
- Facebook image CORS: External resource, not fixable
- PostMessage warnings: Lovable editor environment artifacts
- All other pages (Home, Search, Profile, Settings, Leaderboard, Meditate, Subscriptions, CAMLYPrice, Downloads, Docs, NFTGallery, Bounty, BrowseMusic, Messages, FunMoney): All working with proper layouts and no errors

---

## Implementation Plan

### Phase 1: Fix Transaction History 400 Errors

**File:** `src/components/Wallet/TransactionHistorySection.tsx`

**Changes to the `fetchTransactions` function (lines 86-138):**

1. Replace the sent donations query (lines 87-96):
   - Change from: `.select("*, receiver:receiver_id(...), token:token_id(...)")`
   - Change to: `.select("*")` (flat select, no joins)

2. Replace the received donations query (lines 114-123):
   - Change from: `.select("*, sender:sender_id(...), token:token_id(...)")`
   - Change to: `.select("*")` (flat select, no joins)

3. After fetching both donation sets, collect unique user IDs and token IDs:
   - Extract all `sender_id` and `receiver_id` values
   - Extract all `token_id` values
   - Query `profiles` table with `.in("id", userIds)` to get display names and avatars
   - Query `donate_tokens` table with `.in("id", tokenIds)` to get token symbols
   - Build lookup maps: `profilesMap[id]` and `tokensMap[id]`

4. Update the transaction building logic (lines 98-137):
   - Use `profilesMap[d.receiver_id]` instead of `d.receiver as any`
   - Use `profilesMap[d.sender_id]` instead of `d.sender as any`
   - Use `tokensMap[d.token_id]?.symbol` instead of `(d.token as any)?.symbol`

---

## Files Modified (Total: 1)

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/components/Wallet/TransactionHistorySection.tsx` | Fix 400 errors by removing invalid FK joins | Medium-High |

---

## Technical Details

The fix follows the exact same pattern already used successfully in:
- `src/pages/Search.tsx` (profiles loaded separately after video query)
- `src/pages/Index.tsx` (profiles loaded separately after video query)

This approach is safer than adding foreign key constraints because:
- Adding FKs could fail if there are orphaned records (sender/receiver IDs that don't exist in profiles)
- No database migration needed
- Frontend-only change

## Summary

The system is in excellent health after all previous rounds of fixes. The only remaining functional bug is the **Wallet transaction history** showing empty results due to invalid PostgREST join syntax (no foreign keys exist on the `donation_transactions` table). The fix uses the proven "separate queries + lookup map" pattern already established in the codebase. Single file change, no database modifications needed.

