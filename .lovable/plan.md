

# Video Quality Control System to Combat Spam & Reward Abuse

## Overview
Implement 6 measures to prevent spam video uploads and abuse of the 500,000 CAMLY first-upload reward. All changes apply to both web and mobile upload flows.

---

## 1. Upload Constraints: Duration & Description Validation

**What changes:**
- Minimum video duration: 60 seconds. Videos shorter than 60s will be blocked with a friendly error message.
- Minimum description length: 50 characters. The "Post"/"Upload" button will be disabled until both conditions are met.
- Block filenames containing "mixkit" or known sample video site names (e.g., "pexels", "pixabay", "coverr", "videezy", "videvo").

**Files changed:**
- `src/components/Upload/UploadWizard.tsx` -- Add duration check before enabling the "Publish" button; pass `videoDuration` to UploadPreview; block sample filenames on video select
- `src/components/Upload/UploadPreview.tsx` -- Disable "Publish" button if duration < 60s or description < 50 chars; show warning messages
- `src/components/Upload/UploadMetadataForm.tsx` -- Show character count requirement on description field; update validation logic
- `src/components/Upload/Mobile/MobileUploadFlow.tsx` -- Same duration and filename checks on video select
- `src/components/Upload/Mobile/VideoDetailsForm.tsx` -- Disable "Upload" button if duration < 60s or description < 50 chars; show requirements
- `src/components/Upload/Mobile/SubPages/DescriptionEditor.tsx` -- Show minimum character requirement
- `src/components/Upload/UploadDropzone.tsx` -- Block sample filenames with error message

**Validation helper (new file):**
- `src/lib/videoUploadValidation.ts` -- Shared functions: `isBlockedFilename(name)`, `MIN_VIDEO_DURATION`, `MIN_DESCRIPTION_LENGTH`

---

## 2. Escrow Mechanism for First Upload Reward

**What changes:**
- When a user uploads their first video, the 500,000 CAMLY goes to `pending_rewards` (escrow) instead of being auto-approved.
- After 48 hours, if the video has not been reported/hidden, a database function releases the funds to `approved_reward`.
- If the video is reported and hidden within 48 hours, the pending reward is revoked.

**Implementation:**
- Add `escrow_release_at` column to `reward_transactions` table (timestamp, nullable)
- Modify `award-camly` Edge Function: For FIRST_UPLOAD rewards, always set `approved = false` (pending) and set `escrow_release_at = now() + 48h`
- Create a new database function `release_escrow_rewards()` that finds FIRST_UPLOAD transactions where `escrow_release_at <= now()` AND the associated video is NOT hidden, then marks them as approved and moves amount from `pending_rewards` to `approved_reward`
- This function can be called periodically via admin action or a simple cron-like approach

**Database migration:**
- Add `escrow_release_at` column to `reward_transactions`
- Create `release_escrow_rewards()` SQL function
- Create `revoke_escrow_reward(video_id)` SQL function (called when video gets hidden)

**Files changed:**
- `supabase/functions/award-camly/index.ts` -- FIRST_UPLOAD always pending with escrow timestamp
- Database migration (new SQL)

---

## 3. Community Report Feature ("Report Spam")

**What changes:**
- New `video_reports` table to track reports per video per user
- "Report Spam" button on every video's watch page
- When a video accumulates 5 reports from 5 different users, automatically set `is_hidden = true` on the video and notify admin

**Database migration:**
- Create `video_reports` table: `id`, `video_id`, `reporter_id`, `reason`, `created_at`
- Add `is_hidden` column (boolean, default false) to `videos` table
- Add `report_count` column (integer, default 0) to `videos` table
- Create trigger: on INSERT to `video_reports`, increment `report_count`; if count >= 5, set `is_hidden = true`
- RLS: Users can insert reports (one per video per user), admins can read all

**Frontend:**
- `src/components/Video/ReportSpamButton.tsx` -- New component with flag icon, confirmation dialog, and reason selector
- Integrate into watch page (video action bar area)
- Update all video feed queries to add `.eq("is_hidden", false)` or `.is("is_hidden", null)` filter

**Files changed:**
- Database migration (new)
- `src/components/Video/ReportSpamButton.tsx` (new)
- Video watch page component -- Add report button
- Feed queries (Home, Search, Shorts, ProfileVideosTab, etc.) -- Add `is_hidden` filter

---

## 4. Admin Filtering System for Short/Repetitive Videos

**What changes:**
- New tab "Spam Filter" in VideosManagementTab
- Filter options: "Short videos (< 90s)", "Repetitive titles" (titles appearing 3+ times), "Reported videos"
- Bulk delete/reject capability
- Show report count column

**Files changed:**
- `src/components/Admin/tabs/VideosManagementTab.tsx` -- Add new "Spam Filter" tab with filters and bulk actions

---

## 5. AI Thumbnail Scan for High-View Videos (100+ views)

**What changes:**
- New Edge Function `scan-thumbnail` that uses AI to analyze thumbnails of videos with 100+ views
- Checks for black screens, solid colors, junk/placeholder images
- Only scans videos that haven't been scanned yet (tracked via `thumbnail_scanned` column)
- Admin can trigger scan from the Videos Management panel

**Database migration:**
- Add `thumbnail_scanned` boolean column to `videos` (default false)
- Add `thumbnail_scan_result` text column to `videos` (nullable)

**Files changed:**
- `supabase/functions/scan-thumbnail/index.ts` (new) -- Uses Lovable AI (gemini-2.5-flash) to analyze thumbnail images
- `supabase/config.toml` -- Add function config
- `src/components/Admin/tabs/VideosManagementTab.tsx` -- Add "Scan Thumbnails" button in admin panel

---

## 6. Sample Video Filename Blocking

**What changes:**
- Block uploads where the filename contains "mixkit", "pexels", "pixabay", "coverr", "videezy", "videvo", "sample-video", "test-video"
- Applied at the earliest point (file selection) in both web and mobile flows
- Show clear error message: "Video mẫu từ các trang tải video miễn phí không được chấp nhận"

**Files changed:**
- `src/lib/videoUploadValidation.ts` (new, shared with item 1)
- `src/components/Upload/UploadWizard.tsx` -- Check filename on handleVideoSelect
- `src/components/Upload/Mobile/MobileUploadFlow.tsx` -- Same check
- `src/components/Upload/UploadDropzone.tsx` -- Same check on drop

---

## Technical Summary

| Change | Type | Cloud Cost | New Files |
|--------|------|-----------|-----------|
| Duration & description validation | Frontend | None | 1 (validation util) |
| Filename blocking | Frontend | None | Shared with above |
| Escrow mechanism | DB + Edge Function | None | 1 migration |
| Community reports | DB + Frontend | None | 1 component, 1 migration |
| Admin spam filters | Frontend | None | 0 (modify existing) |
| AI thumbnail scan | Edge Function | Minimal (only 100+ view videos) | 1 Edge Function |

**Database columns added to `videos`:** `is_hidden`, `report_count`, `thumbnail_scanned`, `thumbnail_scan_result`
**New table:** `video_reports`
**New DB functions:** `release_escrow_rewards()`, `revoke_escrow_reward(video_id)`

