
# Plan: Fix Display Issues & Add Sponsors to Mobile

## Issues Found

### 1. Right Sidebar Stat Pills Overflow
The stat pill labels ("TOTAL COMMENTS", "TOTAL USERS") combined with large formatted values (e.g., "5.991,00" for CAMLY Pool) overflow beyond the `w-80` sidebar width. The `CounterAnimation` component does not use compact mode, so numbers like 5991 are displayed as "5.991,00" (Vietnamese locale) instead of "5.99K".

### 2. Mobile Top Ranking Card Missing Sponsors
The `MobileTopRankingCard` only shows the Top 3 ranking users but does not display any sponsor information or a "Donate to Project" button -- even though the desktop sidebar has both merged into one card via `showSponsors` prop.

### 3. CoinGecko API Error (Not Critical)
A "Failed to fetch" error from `useCryptoPrices.tsx` when calling the CoinGecko API. This is a CORS/network issue in the preview environment and is not related to the layout changes.

---

## Fix Plan

### Fix 1: Right Sidebar Stat Pills -- Prevent Overflow

**File: `src/components/Layout/HonoboardRightSidebar.tsx`**

- Shorten stat labels to fit better:
  - "TOTAL USERS" --> "USERS"
  - "TOTAL COMMENTS" --> "COMMENTS"
  - "TOTAL VIEWS" --> "VIEWS"
  - "TOTAL VIDEOS" --> "VIDEOS"
  - "CAMLY POOL" --> "CAMLY POOL" (keep)
- Reduce label font from `text-sm` to `text-xs`
- Enable `compact` mode on CounterAnimation for large numbers
- Add `overflow-hidden` and `min-w-0` to prevent visual overflow
- Reduce pill padding from `px-4` to `px-3`

### Fix 2: Merge Sponsors into Mobile Top Ranking Card

**File: `src/components/Layout/MobileTopRankingCard.tsx`**

- Import `useTopSponsors` hook
- Add a "Top Sponsors" section below the ranking pills, separated by a divider
- Show top 3 sponsors as compact pills (similar to ranking pills)
- Add a small "Donate to Project" button at the bottom with Aurora gradient
- Keep the card clickable for leaderboard navigation, but make the Donate button a separate action

### Fix 3: Minor Font/Display Consistency

**File: `src/components/Layout/HonoboardRightSidebar.tsx`**
- Ensure StatPill uses `text-base` for values instead of `text-lg` to prevent overflow
- Add `whitespace-nowrap` to value display

**File: `src/components/Layout/TopRankingSection.tsx`**
- Increase sponsor value font from `text-xs` to `text-sm` for consistency with ranking values

---

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/components/Layout/HonoboardRightSidebar.tsx` | Edit | Fix stat pill overflow: shorter labels, compact counter, smaller text |
| `src/components/Layout/MobileTopRankingCard.tsx` | Edit | Add Top Sponsors section + Donate button |
| `src/components/Layout/TopRankingSection.tsx` | Edit | Fix sponsor value font size consistency |

---

## Expected Results

| Before | After |
|--------|-------|
| Stat pill values overflow sidebar edge | Values use compact format (K/M) and fit within sidebar |
| Mobile shows only Top 3 ranking | Mobile shows Top 3 ranking + Top 3 sponsors + Donate button |
| Sponsor values use `text-xs` (too small) | Sponsor values use `text-sm` (consistent with ranking) |
| Long labels push values off-screen | Shorter labels keep everything visible |
