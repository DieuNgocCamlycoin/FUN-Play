

# Fix Errors and Clean Up: User Verification & Fake Account Features

## Issues Found

### 1. CRITICAL: SQL-to-TypeScript Field Name Mismatch (Data Not Displaying)
The `get_public_users_directory()` SQL function returns column names like `id`, `total_camly`, `available_camly`, `total_views`, `sent_count`, etc. But the TypeScript `PublicUserStat` interface expects `user_id`, `total_camly_rewards`, `unclaimed_camly`, `views_count`, `donations_sent_count`, etc.

Since the data is cast via `as unknown as PublicUserStat[]`, there are no compile errors, but most fields silently return `undefined` at runtime. This means the User Directory is showing broken/zero data for many columns.

**Fix:** Update `usePublicUsersDirectory.ts` to map the SQL column names to the expected TypeScript field names when processing results.

### 2. React Key Warning in UsersDirectory (Console Error)
The `Collapsible` component with `asChild` wraps a React Fragment (`<>...</>`). The Fragment's children (two `TableRow` elements) lack unique keys, causing the "Each child in a list should have a unique key prop" warning.

**Fix:** Add explicit `key` props to the two `TableRow` children inside the Fragment.

### 3. Avatar Resize Not Triggering in ProfileSettings
The `DragDropImageUpload` in ProfileSettings uses `folderPath="avatars"`, but the resize logic in `DragDropImageUpload.tsx` checks `folderPath === "profiles"`. So avatars uploaded via Settings are NOT being resized to 200x200.

Also, `maxSizeMB` is still `5` instead of `1`.

**Fix:** Either change the `folderPath` check in `DragDropImageUpload.tsx` to also match `"avatars"`, or change ProfileSettings to use `folderPath="profiles"`. Also set `maxSizeMB={1}`.

### 4. Unnecessary `verify-avatar` Edge Function Still Being Called
ProfileSettings still calls the `verify-avatar` edge function after every avatar upload, which incurs Cloud costs. The plan was to eliminate this and rely on the client-side resize + the existing `avatar_verified` field update.

**Fix:** Remove the `verify-avatar` call from ProfileSettings. Keep the edge function file for now (it can be deleted separately), but stop invoking it. Instead, just set `avatar_verified = true` after a successful upload since the image has been resized client-side.

### 5. Unused Code Cleanup
- Remove `isVerifyingAvatar` state and related UI logic in ProfileSettings (the spinner/status for AI verification)
- The `verify-avatar` edge function is no longer needed and can be deleted

---

## Technical Changes

### File: `src/hooks/usePublicUsersDirectory.ts`
- Add a mapping function to transform SQL result rows (with column names like `id`, `total_camly`, `available_camly`) into the `PublicUserStat` interface shape (with field names like `user_id`, `total_camly_rewards`, `unclaimed_camly`)

### File: `src/pages/UsersDirectory.tsx`
- Add `key` props to the two `TableRow` elements inside the Collapsible Fragment (lines 201-239)

### File: `src/components/Profile/DragDropImageUpload.tsx`
- Change the resize condition from `folderPath === "profiles"` to `folderPath === "profiles" || folderPath === "avatars"` so it covers both paths

### File: `src/pages/ProfileSettings.tsx`
- Remove the `verify-avatar` edge function call
- Remove `isVerifyingAvatar` state and verification status UI
- Set `maxSizeMB={1}` for the avatar upload
- After successful upload, directly update `avatar_verified` in the profiles table

### File: `supabase/functions/verify-avatar/index.ts`
- Delete this edge function (no longer needed, saves Cloud costs)

