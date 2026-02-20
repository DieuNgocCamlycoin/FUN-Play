

## Analysis: Video Report System Issues

### Investigation Results

**Database Level**: Working correctly.
- The `video_reports` table has 1 record for the reported video
- The trigger `handle_video_report` correctly incremented `report_count` to 1 on the `videos` table
- The video `c58723a7...` has `report_count = 1`, `is_public = true`

### Root Causes Identified

**1. Missing Admin RLS Policies on `videos` table (Critical)**
The `videos` table only has this SELECT policy:
```
(is_public = true) OR (auth.uid() = user_id)
```
There is NO admin override. This means:
- Admins **cannot see** reported videos that have `is_public = false`
- Admins **cannot UPDATE** (hide/reject) any video they don't own -- bulk hide/reject will silently fail
- The specific video you reported works because it happens to be `is_public = true`, but the system is broken for non-public videos

**2. No Manual Refresh Button in Spam Filter**
The Spam Filter tab only fetches data on filter change (via `useEffect`). If the admin is already on the "Bị báo cáo" filter, new reports won't appear until they switch away and back.

**3. No Report Count Badge on Spam Filter Tab**
The admin has no visual indicator of how many reported videos exist, making it easy to miss new reports.

### Plan

#### Step 1: Add Admin RLS Policies to `videos` Table
Create a database migration to add:
- `SELECT` policy for admins: `has_role(auth.uid(), 'admin'::app_role)` -- allows admins to see ALL videos including non-public ones
- `UPDATE` policy for admins: same condition -- allows admins to hide/reject/modify any video

#### Step 2: Add Refresh Button to Spam Filter
Add a manual "Refresh" button next to the existing filter buttons so admins can reload reported videos on demand.

#### Step 3: Add Reported Count Badge to Spam Filter Tab
Show a live count of reported videos on the "Spam Filter" tab trigger so admins immediately see when new reports come in.

#### Step 4: Clean Up Redundant Code
Review and remove any unused imports or dead code in the reporting flow.

### Technical Details

**Migration SQL:**
```sql
CREATE POLICY "Admins can view all videos"
  ON public.videos FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all videos"
  ON public.videos FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all videos"
  ON public.videos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

**UI Changes in `VideosManagementTab.tsx`:**
- Add a refresh button (RefreshCw icon) next to the Spam Filter filter buttons
- Fetch reported video count on tab mount and display as a badge on the "Spam Filter" tab

**Files Modified:**
- `src/components/Admin/tabs/VideosManagementTab.tsx` -- refresh button, reported count badge
- Database migration -- 3 new admin RLS policies on `videos` table

