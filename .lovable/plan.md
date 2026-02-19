
# Fix: Video Reports Not Showing in "Reported" Tab

## Problem

The `handle_video_report()` database function exists but the **trigger** that connects it to the `video_reports` table is missing. When a user reports a video, the record is inserted into `video_reports` but the `report_count` on the video is never incremented. Since the "Reported" tab filters by `report_count > 0`, reported videos don't appear there.

## Root Cause

The trigger was likely lost during a previous migration or was never created. The function `handle_video_report()` is defined and correct (it increments `report_count` and auto-hides videos at 5+ reports), but without a trigger, it never gets called.

## Fix

### 1. Database Migration: Create the Missing Trigger

A single SQL migration to create the trigger on the `video_reports` table:

```text
CREATE TRIGGER on_video_report_inserted
  AFTER INSERT ON public.video_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_video_report();
```

This ensures that every time a user submits a report, the trigger fires and:
- Increments `report_count` on the video
- Auto-hides the video if it reaches 5+ reports
- Revokes escrow rewards if applicable

### 2. Sync Existing Data

Run a one-time data update to sync `report_count` for any videos that were reported before the trigger was active:

```text
UPDATE videos v
SET report_count = sub.cnt
FROM (
  SELECT video_id, COUNT(*) as cnt
  FROM video_reports
  GROUP BY video_id
) sub
WHERE v.id = sub.video_id;
```

### No Code Changes Needed

- The **ReportSpamButton** component already works correctly on both web and mobile
- The **Spam Filter "Reported" tab** already queries `report_count > 0` correctly
- Once the trigger is in place, everything connects end-to-end automatically

## Files Changed

| File | Change |
|------|--------|
| New migration SQL | Create trigger `on_video_report_inserted` + sync existing report counts |

## Verification

After the fix, the flow will be:
1. User clicks "Bao cao" (Report) on any video (web or mobile)
2. Report is inserted into `video_reports`
3. Trigger fires `handle_video_report()` automatically
4. `report_count` increments on the video
5. Video appears in Admin > Videos > Spam Filter > "Reported" tab
6. At 5+ reports, video is auto-hidden
