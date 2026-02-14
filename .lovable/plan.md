

# Optimize Search Logic Across Header and Search Page

## Current Issues

1. **Desktop Header** (`Header.tsx`): Contains a YouTube URL detection regex that opens YouTube links in a new tab -- unnecessary complexity for a video platform search bar
2. **Mobile Header** (`MobileHeader.tsx`): Search suggestions only search video titles, missing channels and users
3. **Search Page** (`Search.tsx`): Loading skeleton shows a fixed `w-[360px]` thumbnail that overflows on mobile; search input duplicates header functionality
4. **All three locations**: Search suggestion queries don't filter by `view_count` ordering consistently, and none search channels/users in suggestions

## Plan

### 1. Create a shared search hook (`src/hooks/useSearchSuggestions.ts`)

Extract the duplicated suggestion logic from both headers into one reusable hook:
- Debounced search (300ms)
- Search both **videos** (by title) and **channels** (by name) in parallel
- Return grouped results: `{ videos: [...], channels: [...] }`
- Limit: 5 videos + 3 channels
- Order videos by `view_count` descending for better relevance

### 2. Simplify Desktop Header search (`Header.tsx`)

- Remove the YouTube URL regex detection (lines 113-120) -- just navigate to `/search?q=...`
- Replace inline suggestion state/effects with the new `useSearchSuggestions` hook
- Show channel suggestions with avatar in the dropdown (below video suggestions)
- Clicking a channel navigates to `/channel/{id}`

### 3. Optimize Mobile Header search (`MobileHeader.tsx`)

- Replace inline suggestion state/effects with the new `useSearchSuggestions` hook
- Show both video and channel suggestions in the dropdown
- Channel suggestions show a small avatar + name with "Kenh" label
- Add `min-h-[48px]` touch targets on suggestion items for mobile-first design
- Clear search state properly when navigating

### 4. Improve Search Page mobile layout (`Search.tsx`)

- Fix loading skeleton: replace `w-[360px]` with responsive `w-full max-w-[360px]` or just use `aspect-video` alone
- On mobile, hide the duplicate search input at the top (the header already has search) and show only filter tabs + results
- Add `scrollbar-hide` to filter tabs horizontal scroll

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useSearchSuggestions.ts` | **New** -- shared debounced search hook returning videos + channels |
| `src/components/Layout/Header.tsx` | Use shared hook, remove YouTube regex, show channel suggestions |
| `src/components/Layout/MobileHeader.tsx` | Use shared hook, show channel suggestions, 48px touch targets |
| `src/pages/Search.tsx` | Fix skeleton overflow, hide redundant search input on mobile |

