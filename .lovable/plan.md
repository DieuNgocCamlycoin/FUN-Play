

# Plan: Upgrade Build & Bounty to Full Spec

## Overview

The current Build & Bounty feature is a basic version. The uploaded spec defines a significantly enhanced system with **community upvoting**, **public visibility**, **anonymous submissions**, **image uploads**, and a **split-layout cosmic-themed UI**. This plan upgrades everything to match the spec exactly.

---

## Current State vs. Spec Comparison

| Feature | Current | Spec Required |
|---------|---------|---------------|
| Route | `/bounty` | `/build-bounty` |
| Submissions visible to | Only own (logged-in) | Everyone (public) |
| Who can submit | Only logged-in users | Anyone (anonymous OK) |
| Upvoting | None | Community upvotes with toggle |
| `name` field | Missing | Display name (nullable) |
| `contribution_type` | Uses `category` | `idea, feedback, bug, feature` |
| `image_url` field | Missing | Screenshot upload |
| `upvote_count` | Missing | Auto-tracked via trigger |
| `bounty_upvotes` table | Missing | New table with unique constraint |
| Component structure | Single page file | Form, Card, List components |
| Custom hook | None | `useBountySubmissions.ts` |
| Layout | Single column | 2/3 form + 1/3 list (desktop) |
| Admin tab | Has `category` field | Needs `contribution_type` |

---

## What Will Change

### 1. Database Migration

**Add columns to `bounty_submissions`:**
- `name` (text, nullable) -- display name for anonymous
- `contribution_type` (text, with validation) -- `idea`, `feedback`, `bug`, `feature`
- `image_url` (text, nullable) -- screenshot URL
- `upvote_count` (integer, default 0)

**Create `bounty_upvotes` table:**
- `id`, `submission_id` (FK), `user_id`, `created_at`
- Unique constraint on `(submission_id, user_id)`

**Create trigger** to auto-update `upvote_count` on insert/delete.

**Update RLS policies:**
- SELECT: public (anyone can view all submissions)
- INSERT: public (anyone can create, no auth required)
- UPDATE/DELETE: admins only (unchanged)
- Upvotes: authenticated users can insert/delete their own

### 2. New Files

| File | Purpose |
|------|---------|
| `src/hooks/useBountySubmissions.ts` | Custom hook for submissions, upvotes, and submit logic |
| `src/components/Bounty/BountySubmissionForm.tsx` | The submission form with name, contact, type, title, description, image |
| `src/components/Bounty/BountySubmissionCard.tsx` | Individual submission card with upvote button |
| `src/components/Bounty/BountySubmissionList.tsx` | List of approved/rewarded submissions |

### 3. Modified Files

| File | Change |
|------|--------|
| `src/pages/Bounty.tsx` | Complete rewrite: split layout, cosmic theme, public list + form |
| `src/components/Admin/tabs/BountyApprovalTab.tsx` | Support `contribution_type`, `name`, `image_url`, `upvote_count` |
| `src/App.tsx` | Add `/build-bounty` route, keep `/bounty` as redirect |
| `src/components/Layout/CollapsibleSidebar.tsx` | Update link from `/bounty` to `/build-bounty` |
| `src/components/Layout/MobileDrawer.tsx` | Update link from `/bounty` to `/build-bounty` |

### 4. Navigation Update

- Sidebar and Mobile Drawer links change from `/bounty` to `/build-bounty`
- Old `/bounty` route redirects to `/build-bounty` for backward compatibility

---

## Page Layout (Desktop)

```text
+--------------------------------------------------+
|    Build & Bounty Header (Cosmic gradient title)  |
+--------------------------------------------------+
|                    |                              |
|  Submission Form   |    Community Submissions     |
|  (left, 2/3)       |    (right, 1/3)              |
|                    |                              |
|  - Name            |    - Upvotable cards         |
|  - Contact info    |    - Category badges         |
|  - Type selector   |    - Reward amounts          |
|  - Title           |    - Sorted by upvotes       |
|  - Description     |                              |
|  - Image upload    |                              |
|                    |                              |
+--------------------+------------------------------+
```

On mobile, these stack vertically (form first, then list).

---

## Technical Details

### Database Migration SQL

```sql
-- 1. Add missing columns to bounty_submissions
ALTER TABLE public.bounty_submissions 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS contribution_type text NOT NULL DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;

-- 2. Create bounty_upvotes table
CREATE TABLE public.bounty_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.bounty_submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

ALTER TABLE public.bounty_upvotes ENABLE ROW LEVEL SECURITY;

-- 3. Update RLS policies on bounty_submissions (make public)
DROP POLICY IF EXISTS "Users can view own bounty submissions" ON public.bounty_submissions;
DROP POLICY IF EXISTS "Admins can view all bounty submissions" ON public.bounty_submissions;
DROP POLICY IF EXISTS "Users can create bounty submissions" ON public.bounty_submissions;

CREATE POLICY "Bounty submissions are viewable by everyone"
  ON public.bounty_submissions FOR SELECT USING (true);

CREATE POLICY "Anyone can create bounty submissions"
  ON public.bounty_submissions FOR INSERT WITH CHECK (true);

-- 4. RLS for bounty_upvotes
CREATE POLICY "Bounty upvotes are viewable by everyone"
  ON public.bounty_upvotes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote"
  ON public.bounty_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes"
  ON public.bounty_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Trigger for auto-updating upvote_count
CREATE OR REPLACE FUNCTION update_bounty_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE bounty_submissions 
    SET upvote_count = upvote_count + 1 
    WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bounty_submissions 
    SET upvote_count = upvote_count - 1 
    WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_bounty_upvote_count
AFTER INSERT OR DELETE ON bounty_upvotes
FOR EACH ROW EXECUTE FUNCTION update_bounty_upvote_count();
```

### Contribution Types

| Type | Label (Vietnamese) | Icon |
|------|-------------------|------|
| idea | Y tuong | Lightbulb |
| bug | Bao loi | Bug |
| feedback | Phan hoi | MessageSquare |
| feature | Tinh nang | Sparkles |

### Custom Hook (`useBountySubmissions.ts`)

Provides:
- `submissions` -- public list (approved/rewarded, sorted by upvotes)
- `userUpvotes` -- which submissions the current user has upvoted
- `submitContribution()` -- mutation to create a new submission
- `toggleUpvote()` -- mutation to upvote/remove upvote
- Loading and error states

### Admin Tab Updates

The `BountyApprovalTab` will be updated to:
- Show `contribution_type` badges instead of `category`
- Display `name` field when available
- Show `image_url` as a clickable thumbnail
- Display `upvote_count` on each submission card

---

## Summary of All Changes

| Step | Action |
|------|--------|
| 1 | Run database migration (add columns, create upvotes table, update RLS, add trigger) |
| 2 | Create `useBountySubmissions.ts` hook |
| 3 | Create `BountySubmissionForm.tsx`, `BountySubmissionCard.tsx`, `BountySubmissionList.tsx` |
| 4 | Rewrite `Bounty.tsx` page with split layout and cosmic theme |
| 5 | Update `BountyApprovalTab.tsx` for new fields |
| 6 | Update `App.tsx` routes (add `/build-bounty`, redirect old `/bounty`) |
| 7 | Update sidebar and mobile drawer navigation links |

