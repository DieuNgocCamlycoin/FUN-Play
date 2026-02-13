

# Fix Video Classification: Long Videos Incorrectly Showing as Short

## Problem Found

Database analysis confirms **8 reward transactions** where videos longer than 3 minutes (180s) were incorrectly classified as `SHORT_VIDEO_UPLOAD` (20,000 CAMLY) instead of `LONG_VIDEO_UPLOAD` (70,000 CAMLY). Total underpaid: **400,000 CAMLY**.

### Root Cause
When a video is uploaded, the duration may still be NULL in the database. The `award-camly` edge function (line 250-252) falls back to trusting the client-provided type when duration is NULL:
```text
if (!videoData?.duration) {
  console.warn("Video has NULL duration, keeping client type");
}
```
The client sometimes sends `SHORT_VIDEO_UPLOAD` before metadata is fully extracted.

## Solution (2 Parts)

### Part 1: Fix existing misclassified transactions
Run the existing `recalculate-upload-rewards` edge function to:
- Find all `SHORT_VIDEO_UPLOAD` transactions where the video duration is actually > 180s
- Update their `reward_type` to `LONG_VIDEO_UPLOAD`
- Update their `amount` from 20,000 to 70,000
- Credit the 50,000 CAMLY difference to each affected user's balance

### Part 2: Fix the root cause in `award-camly`
Update the edge function so that when duration is NULL at reward time, it **defers the upload reward** instead of trusting the client type. Alternatively, improve the fallback logic to:
- If duration is NULL and client says SHORT, try to extract duration from the video file metadata
- If still NULL, default to SHORT but **flag the transaction for later reconciliation**

A simpler approach: Update `award-camly` to **always re-check duration** from the `videos` table for ANY upload reward type (including `UPLOAD` legacy type), and if duration is still NULL, temporarily store the reward as `SHORT_VIDEO_UPLOAD` but add a background check that runs the `recalculate-upload-rewards` reconciliation periodically.

### Part 3: Update RewardHistory display
No UI changes needed -- the page already correctly maps `SHORT_VIDEO_UPLOAD` and `LONG_VIDEO_UPLOAD` to their labels. Once the database records are fixed, the display will automatically show correctly.

## Technical Details

### Step 1: Run reconciliation (one-time fix)
Call the `recalculate-upload-rewards` edge function with `dryRun: false` to fix the 8 misclassified transactions and credit 400,000 CAMLY total to affected users.

### Step 2: Improve `award-camly` edge function
Update lines 237-253 to also handle the legacy `UPLOAD` type by checking video duration and reclassifying:
- If type is `UPLOAD` and video has duration > 180s, use `LONG_VIDEO_UPLOAD`
- If type is `UPLOAD` and video has duration <= 180s, use `SHORT_VIDEO_UPLOAD`
- If duration is NULL, keep the client type but log a warning for reconciliation

### Step 3: Deploy and verify
- Deploy the updated `award-camly` edge function
- Verify the 8 transactions are now correctly classified
- Check the Reward History page on mobile to confirm correct labels and amounts

