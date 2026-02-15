

# Fix: Homepage Shows Skeleton Loaders Forever / Can't Log In

## Root Cause

Your backend database is overwhelmed with **statement timeouts** -- dozens of "canceling statement due to statement timeout" errors in the logs. This means:

1. **Auth token refresh fails** (504 timeout) -- you can't log in because the auth service can't reach the database
2. **Video query fails** -- the homepage query times out, so skeleton loaders stay forever
3. **No error recovery** -- when the video fetch fails, the code keeps `loadingVideos = true`, showing skeletons indefinitely

Two code-level problems make this worse:
- The homepage fetches **1,000 videos at once** (`.limit(1000)`) even though only 24 are shown initially -- this is wasteful and slow
- There is **no missing composite index** for the common filter `(is_public, approval_status, created_at DESC)`, forcing full table scans on 1,000+ videos

## Solution

### 1. Add composite database index (migration)
Create a composite index on `videos(is_public, approval_status, created_at DESC)` so the homepage query is fast and avoids timeouts.

### 2. Reduce video fetch from 1000 to 100 (`Index.tsx`)
Since infinite scroll loads 24 at a time, fetching 1,000 upfront is unnecessary. Reduce to 100 for the initial load -- still plenty, but much lighter on the database.

### 3. Add error recovery for video loading (`Index.tsx`)
When `fetchVideos` fails (catches an error), set `loadingVideos = false` so the page shows "no videos" instead of infinite skeleton loaders. Also add a retry button.

### 4. Upgrade database instance (recommendation)
The volume of timeout errors suggests the database instance may be too small for the current traffic. Consider upgrading in Settings -> Cloud -> Advanced settings.

## Changes

| Item | Detail |
|------|--------|
| **Database migration** | Add composite index `idx_videos_public_approved` on `(is_public, approval_status, created_at DESC)` |
| **`src/pages/Index.tsx`** | Reduce `.limit(1000)` to `.limit(100)`; set `loadingVideos = false` in catch block; add retry UI when fetch fails |

## Technical Details

### Migration SQL
```sql
CREATE INDEX IF NOT EXISTS idx_videos_public_approved 
ON public.videos (is_public, approval_status, created_at DESC);
```

### Index.tsx changes
- Line with `.limit(1000)` changed to `.limit(100)`
- In the `catch` block of `fetchVideos`, add `setLoadingVideos(false)` so skeletons don't persist on failure
- Add a `fetchError` state to show a retry button when fetch fails
