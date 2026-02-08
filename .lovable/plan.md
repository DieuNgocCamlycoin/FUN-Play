

# System Check Report & Fix Plan for FUN Play

## Current Status: One Critical Bug Found

After comprehensive inspection of console logs, network requests, database schema, visual testing on mobile (390x844), and code review across 30+ files, the system is stable overall. However, one **critical functional bug** was found along with 2 medium-priority layout issues.

## Issues Found

### Issue 1: CRITICAL - Search Page Returns 400 Error (Broken Search)
**Console log confirms:** `Failed to load resource: the server responded with a status of 400` on the `/search` endpoint.

**Root Causes (2 bugs in Search.tsx):**
1. The query uses `.eq("status", "published")` but the `videos` table does **NOT have a `status` column**. The correct column is `approval_status` with value `"approved"`.
2. The query uses `profiles!videos_user_id_fkey(display_name, username, avatar_url)` to join profiles, but the `videos_user_id_fkey` foreign key references `auth.users`, NOT `profiles`. This FK hint is invalid and causes the 400 error.

**How Index.tsx solves this correctly:** It queries videos with only `channels(name, id)` join, then does a **separate query** to fetch profiles using `.in("id", userIds)`. The Search page must follow this same proven pattern.

**Fix:**
- Remove the `profiles!videos_user_id_fkey` join from the select
- Change `.eq("status", "published")` to `.eq("is_public", true).eq("approval_status", "approved")`
- Add a separate profiles query (same pattern as Index.tsx) to get display names and avatars

### Issue 2: CAMLYPrice Page Missing Mobile Navigation (Medium Priority)
`CAMLYPrice.tsx` does not use `MainLayout`. On mobile, it has:
- No MobileHeader
- No MobileBottomNav
- No way to navigate away except the back button
- Uses its own custom header with `sticky top-0`

**Fix:** Wrap in `MainLayout` and remove the custom header, letting MainLayout provide consistent navigation.

### Issue 3: DownloadedVideos Page Missing MainLayout (Medium Priority)
`DownloadedVideos.tsx` manually imports `MobileBottomNav` but doesn't use `MainLayout`. This means:
- No desktop sidebar navigation
- Inconsistent header behavior
- Manual `pb-20` bottom padding to account for nav

**Fix:** Wrap in `MainLayout` and remove the manual `MobileBottomNav` import and manual bottom padding.

### Non-Issues (Already Working Correctly)
- WalletConnect CSP framing: Known preview-only issue, does not affect published app
- Manifest CORS error: Preview environment only
- PostMessage warnings: Lovable editor environment artifacts
- All network API calls return 200 (except the search 400)
- Previous fixes (realtime stability, safe-area, mobile header alignment) all verified working

---

## Implementation Plan

### Phase 1: Fix Search Page 400 Error (Critical)

**File:** `src/pages/Search.tsx`
- Remove `profiles!videos_user_id_fkey` from the select query
- Change `.eq("status", "published")` to `.eq("is_public", true).eq("approval_status", "approved")`
- Add separate profiles query after getting video results (following the Index.tsx pattern):
  1. Extract unique `user_id` values from results
  2. Query `profiles` table with `.in("id", userIds)` to get `display_name, username, avatar_url`
  3. Create a profilesMap and merge into results
- This follows the exact same proven pattern used by `Index.tsx`

### Phase 2: Fix CAMLYPrice Layout (Medium)

**File:** `src/pages/CAMLYPrice.tsx`
- Import and wrap content with `MainLayout`
- Remove the custom sticky header (the back button, token name, share/refresh buttons)
- Keep the inner content structure (price card, chart, alerts, token info)

### Phase 3: Fix DownloadedVideos Layout (Medium)

**File:** `src/pages/DownloadedVideos.tsx`
- Import and wrap content with `MainLayout`
- Remove the manual `MobileBottomNav` import and usage at line 197
- Remove the manual `pb-20` padding (MainLayout handles this)
- Keep the custom header bar but remove the `sticky top-0` since MainLayout provides the header

---

## Files Modified (Total: 3)

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/pages/Search.tsx` | Fix 400 error: wrong column name, invalid FK join | Critical |
| 2 | `src/pages/CAMLYPrice.tsx` | Wrap with MainLayout for mobile navigation | Medium |
| 3 | `src/pages/DownloadedVideos.tsx` | Use MainLayout instead of manual nav | Medium |

---

## Summary

The most critical issue is the **broken search functionality** -- every search query returns a 400 database error because the Search page references a non-existent `status` column and uses an invalid foreign key hint for the profiles join. Users see "0 results" for every search. The fix aligns the query with the proven pattern used by Index.tsx.

The remaining 2 issues are pages (CAMLYPrice, DownloadedVideos) that don't use `MainLayout`, causing them to lack proper mobile navigation (no bottom nav, no consistent header).

No database changes needed. All fixes are frontend-only.

