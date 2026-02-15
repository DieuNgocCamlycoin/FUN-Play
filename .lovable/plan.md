

# Fix: Homepage Search Suggestions and Search Page

## Issues Found

### Bug 1: Hook does not auto-open when results arrive
The `useSearchSuggestions` hook requires the consumer to manually call `open()` on every keystroke. But if `close()` fires (e.g., blur timeout), new results arriving from the debounced query won't be visible because `isOpen` stays `false`. The fix: automatically set `isOpen = true` inside the effect when results are found.

### Bug 2: Mobile suggestions never close on blur
`MobileHeader` does not use `isOpen` at all -- it shows the dropdown purely based on `suggestedVideos.length > 0 || suggestedChannels.length > 0`. This means if the user taps outside the search box, the dropdown stays visible until they clear the search or navigate away.

### Bug 3: Desktop blur timeout race condition
In `Header.tsx`, `onBlur` calls `setTimeout(closeSuggestions, 200)`. If the user types again quickly, the 200ms timeout still fires and closes suggestions even though the user is actively typing. The fix: cancel pending close when the user types or focuses.

### Bug 4: Search page video results missing `onPlay` handler
On mobile, `VideoCard` in the search page does not pass an `onPlay` prop. Users have to rely on the card's default click behavior which may not work consistently.

## Changes

### File 1: `src/hooks/useSearchSuggestions.ts`
- Auto-set `isOpen = true` when the debounced query returns results (videos or channels found)
- Auto-set `isOpen = false` when query is cleared or too short (< 2 chars)
- This removes the need for consumers to manually manage open/close state around typing

### File 2: `src/components/Layout/MobileHeader.tsx`
- Use `isOpen` from the hook to control dropdown visibility (instead of just checking data length)
- Call `open()` in the `onChange` handler
- Add `onBlur` with a small timeout to call `close()`, so the dropdown hides when the user taps outside
- This ensures the dropdown properly closes when the user navigates away from the input

### File 3: `src/components/Layout/Header.tsx`
- Store the blur timeout in a ref so it can be cancelled
- Cancel the pending close timeout in `onChange` and `onFocus`
- This prevents the race condition where blur fires while the user is still typing

### File 4: `src/pages/Search.tsx`
- Add `onPlay` handler to `VideoCard` in the mobile search results grid for consistent navigation

## Summary

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useSearchSuggestions.ts` | EDIT | Auto-manage `isOpen` when results arrive/clear |
| `src/components/Layout/MobileHeader.tsx` | EDIT | Use `isOpen` + add blur handling |
| `src/components/Layout/Header.tsx` | EDIT | Fix blur timeout race condition with ref |
| `src/pages/Search.tsx` | EDIT | Add `onPlay` to mobile VideoCard |

