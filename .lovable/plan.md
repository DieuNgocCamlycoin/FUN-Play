

## Fix: userId fallback in getProfileUrl and Channel.tsx

### Problem
When a user has no username, `getProfileUrl` falls back to `/c/${userId}`. But `Channel.tsx` on the `/c/:username` route only queries by `username` column -- a UUID will never match, causing "Khong tim thay nguoi dung" error.

### Solution
Update `Channel.tsx` to detect when the `:username` param looks like a UUID and query by `id` instead.

### Technical Details

**File: `src/pages/Channel.tsx`** (lines 165-215)

Add UUID detection logic in `fetchChannelAndProfile`:

```text
// Current flow:
if (targetUsername) -> query profiles.username = targetUsername

// New flow:
if (targetUsername) {
  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(targetUsername);
  
  if (isUUID) {
    // Query by id instead
    query profiles.id = targetUsername
  } else {
    // Query by username (existing logic)
    query profiles.username = targetUsername
  }
}
```

This ensures:
- `/c/angelthuha` -> queries by username (normal case)
- `/c/550e8400-e29b-41d4-a716-446655440000` -> queries by id (fallback case)
- No other files need changes
- `getProfileUrl` remains unchanged since it already produces correct URLs
- All admin tabs continue working as-is

### No other issues found
The system audit confirmed all other areas are clean:
- Zero remaining `/user/` link patterns
- Report system inserting into `video_reports` correctly
- All 9 admin tabs using `getProfileUrl` with `target="_blank"`
- Video slug routing (`/c/:username/video/:slug`) working correctly
- Legacy redirects (`/user/`, `/u/`) properly configured

