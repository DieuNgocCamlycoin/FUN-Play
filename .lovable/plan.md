
# Video Quality Control System - Issues Found and Fixes

## Status Check Summary

### WORKING CORRECTLY:
1. Upload validation (duration >= 60s, description >= 50 chars) - properly enforced in both UploadWizard (web) and MobileUploadFlow (mobile)
2. Filename blocking (mixkit, pexels, etc.) - implemented in UploadWizard, MobileUploadFlow, and UploadDropzone
3. Escrow mechanism in award-camly - FIRST_UPLOAD rewards correctly set to pending with 48h escrow_release_at
4. ReportSpamButton component - properly created with reason selector and duplicate prevention
5. scan-thumbnail Edge Function - deployed and working with AI analysis
6. Database schema (video_reports table, is_hidden, report_count, thumbnail_scanned columns) - all migrated

### ISSUES FOUND (3 Critical, 1 Minor):

---

## Issue 1 - CRITICAL: ReportSpamButton Not Integrated Into Watch Page
The `ReportSpamButton` component exists but is **never imported or rendered** anywhere. Users cannot report spam videos because the button is not on the watch page.

**Fix:** Add the ReportSpamButton to `VideoActionsBar.tsx` (mobile watch view action bar) and to the desktop Watch page.

### File: `src/components/Video/Mobile/VideoActionsBar.tsx`
- Import `ReportSpamButton`
- Add it as a button in the actions row (after the Download button)

### File: `src/pages/Watch.tsx`
- Import `ReportSpamButton`
- Add it near the video action buttons on the desktop watch page

---

## Issue 2 - CRITICAL: `is_hidden` Filter Not Applied to Any Video Feed
The `is_hidden` column exists in the database but **no video query filters it out**. Hidden/reported videos still appear in all feeds (Home, Shorts, Search, Subscriptions, Watch related, etc.).

**Fix:** Add `.or('is_hidden.is.null,is_hidden.eq.false')` to all public-facing video queries:

### Files to update:
- `src/pages/Index.tsx` - Home feed query
- `src/pages/Shorts.tsx` - Shorts feed query
- `src/pages/Search.tsx` - Search results query
- `src/pages/Watch.tsx` - Related videos query
- `src/pages/Subscriptions.tsx` - Subscription feed query
- `src/pages/LikedVideos.tsx` - Liked videos query
- `src/pages/Meditate.tsx` - Meditation videos query
- `src/pages/BrowseMusic.tsx` - Music browsing queries
- `src/pages/MusicDetail.tsx` - Related music query
- `src/hooks/useSearchSuggestions.ts` - Search autocomplete

Each query that has `.eq("is_public", true)` also needs `.or('is_hidden.is.null,is_hidden.eq.false')`.

---

## Issue 3 - CRITICAL: Admin Spam Filter Tab Not Added
The plan specified adding a "Spam Filter" tab to `VideosManagementTab` for filtering short videos (<90s), repetitive titles, and reported videos. This was **not implemented**.

**Fix:** Add a new "Spam Filter" tab to `VideosManagementTab.tsx` with:
- Filter for short videos (duration < 90s)
- Filter for reported videos (report_count > 0)
- Filter for repetitive titles (titles appearing 3+ times)
- Bulk hide/delete capability
- "Scan Thumbnails" button to trigger the `scan-thumbnail` Edge Function

### File: `src/components/Admin/tabs/VideosManagementTab.tsx`
- Add new TabsTrigger "Spam Filter" with AlertTriangle icon
- Add new TabsContent with `SpamFilterContent` component
- Implement filters, bulk actions, and AI scan button

---

## Issue 4 - Minor: Camera capture input in UploadDropzone skips filename validation
In `UploadDropzone.tsx` line 206-208, the camera capture `<input>` calls `onFileSelect(file)` directly without checking `isBlockedFilename()`. This is a minor gap since camera captures won't have blocked filenames, but for consistency it should be validated.

**Fix:** Add the same filename check before calling `onFileSelect` in the camera capture onChange handler.

---

## No Unnecessary Code Found
All existing code related to the quality control system is in active use. No dead code to remove.

---

## Technical Summary

| Fix | Files Changed | Priority |
|-----|--------------|----------|
| Add ReportSpamButton to watch pages | VideoActionsBar.tsx, Watch.tsx | Critical |
| Add is_hidden filter to all feeds | 10 files (Index, Shorts, Search, etc.) | Critical |
| Add Admin Spam Filter tab | VideosManagementTab.tsx | Critical |
| Camera capture filename check | UploadDropzone.tsx | Minor |
