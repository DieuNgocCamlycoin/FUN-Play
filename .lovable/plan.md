

# Fix: Channel Click Not Working in Search Suggestions

## Root Cause

When clicking/tapping a channel (or video) suggestion in the search dropdown, the following happens:
1. User taps the suggestion button
2. The input loses focus, triggering `onBlur`
3. `onBlur` sets a 200ms timeout to close the dropdown
4. On mobile, the touch-to-click delay can exceed 200ms, so the dropdown disappears before `onClick` fires
5. The click lands on nothing -- navigation never happens

This affects both desktop (intermittently) and mobile (frequently).

## Solution

Replace `onClick` with `onMouseDown` + `e.preventDefault()` on all suggestion buttons. `onMouseDown` fires **before** `onBlur`, and `preventDefault()` prevents the input from losing focus entirely. This guarantees the navigation fires reliably.

## Changes

### File 1: `src/components/Layout/Header.tsx`
- Change video suggestion buttons from `onClick` to `onMouseDown` with `e.preventDefault()`
- Change channel suggestion buttons from `onClick` to `onMouseDown` with `e.preventDefault()`

### File 2: `src/components/Layout/MobileHeader.tsx`
- Same change: replace `onClick` with `onMouseDown` + `e.preventDefault()` on all suggestion buttons (both videos and channels)

## Summary

| File | Change |
|------|--------|
| `src/components/Layout/Header.tsx` | Use `onMouseDown` + `preventDefault` on suggestion buttons |
| `src/components/Layout/MobileHeader.tsx` | Use `onMouseDown` + `preventDefault` on suggestion buttons |

