
# Fix Upload Gate and PPLP Moderation Bugs

## Issues Found

### Bug 1: Mobile gate-blocked retry uses stale closure
In `MobileUploadFlow.tsx` (line 509-515), the retry handler for content-blocked state uses `navigationStack` from a stale closure. The fix is to simplify the retry logic to just reset the stack back to `video-details`.

### Bug 2: Web upload skips reward logic
`UploadWizard.tsx` performs its own direct upload to R2 and DB insert (lines 166-375) instead of using the background `addUpload()` from `UploadContext`. This means:
- Upload rewards (FIRST_UPLOAD, SHORT/LONG_VIDEO_UPLOAD) are never awarded for web uploads
- The `upload_rewarded` flag is never set
- No reward toast notifications appear

The fix is to refactor the web wizard to also use the background upload queue (like mobile does), or duplicate the reward logic. Using the background queue is cleaner and consistent.

### Bug 3: Mobile retry navigation inconsistency
The retry handler filters the navigation stack but may leave it in an unexpected state. Simplify to directly set the stack to `["type-selector", "video-gallery", "video-confirm", "video-details"]`.

## Changes

### File 1: `src/components/Upload/Mobile/MobileUploadFlow.tsx`
- Fix the gate-blocked retry handler (lines 509-515) to use a clean navigation reset instead of fragile stack filtering:
  ```
  onRetry={() => {
    resetGate();
    setNavigationStack(["type-selector", "video-confirm", "video-details"]);
  }}
  ```

### File 2: `src/components/Upload/UploadWizard.tsx`
- Refactor `handleUpload()` to use the background `addUpload()` from `UploadContext` (like mobile does), instead of performing a direct upload. This ensures:
  - Rewards are properly awarded
  - Consistent behavior between web and mobile
  - The wizard closes immediately after queuing (better UX)
- Import and use `useUpload` from `UploadContext`
- The gate-blocked retry already works correctly (resets to metadata step)

## Technical Details

### UploadWizard.tsx handleUpload refactor
After the gate check passes:
1. Get/create channel (same as now)
2. Call `addUpload(videoFile, metadata, thumbnailBlob, thumbnailPreview)` with `approvalStatus`
3. Show toast and close wizard immediately
4. Remove the direct R2 upload, thumbnail upload, and DB insert code (lines 170-375)
5. Remove the "uploading" and "success" steps from the wizard (handled by background upload indicator)

This aligns the web flow with the mobile flow which already uses background uploads correctly.
