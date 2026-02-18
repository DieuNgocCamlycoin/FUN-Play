
# Fix Missing Features on Mobile and Text Inconsistency

## Issues Found

After thorough review, all major features (pagination, anomaly alerts, caching, refresh buttons) are working correctly. Two minor issues were found:

### Issue 1: MobileTopRankingCard Missing Refresh Button
The mobile homepage uses `MobileTopRankingCard` (separate component from the desktop `TopRankingCard`). This component was NOT updated with the refresh button, so mobile users cannot manually refresh the ranking.

**File:** `src/components/Layout/MobileTopRankingCard.tsx`
- Add a small RefreshCw button next to the header (same pattern as TopRankingCard)
- Import `RefreshCw` from lucide-react
- Use `refetch` from `useTopRanking` hook (already available but not destructured)
- Add `useState` for refreshing animation state
- Stop event propagation so refresh doesn't navigate to leaderboard

### Issue 2: "Realtime" Text in HonobarDetailModal
Line 278 of `HonobarDetailModal.tsx` says "Cap nhat realtime" but the system now uses 2-minute polling. This is misleading.

**File:** `src/components/Layout/HonobarDetailModal.tsx`
- Change text from "Cap nhat realtime" to "Tu dong cap nhat" (Auto-update)

---

## Technical Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/components/Layout/MobileTopRankingCard.tsx` | Add RefreshCw button + refresh logic |
| 2 | `src/components/Layout/HonobarDetailModal.tsx` | Fix misleading "realtime" text |

No database changes needed. Both changes are small frontend fixes.
