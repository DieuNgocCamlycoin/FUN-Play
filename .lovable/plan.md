

# Optimize User Verification & Eliminate Fake Accounts (Zero Cloud Cost)

## Overview
This plan implements 5 cost-effective measures to clean up the platform without using expensive AI image scanning. All changes use lightweight client-side logic and SQL filtering.

---

## 1. Profile Completion Gate for SIGNUP Reward (500,000 CAMLY)

**Current behavior:** The SIGNUP reward (50,000 CAMLY) is awarded immediately upon registration. The FIRST_UPLOAD reward (500,000 CAMLY) requires a video upload.

**New behavior:** Add a "Profile Completion" gate to the `award-camly` Edge Function. The SIGNUP reward will only be granted when the user has:
- Changed their `display_name` from the default format (not matching their email or `user_*` pattern)
- Uploaded an avatar (`avatar_url` is not null)

**Files changed:**
- `supabase/functions/award-camly/index.ts` -- Add profile completion check before granting SIGNUP rewards

---

## 2. Spam Name Filtering (Enhanced `nameFilter.ts`)

Add new validation functions to `src/lib/nameFilter.ts`:

- **All-numeric names:** Block names like `123456`, `000000`
- **Repeated characters:** Block names like `aaaaaa`, `xxxxxx` (3+ consecutive same chars)
- **Meaningless patterns:** Block names that are just keyboard spam like `qwerty`, `asdfgh`
- **Default-like names:** Block names matching `user` followed by only numbers

Apply this validation to both `display_name` (in Profile Settings) and `username` (already validated).

**Files changed:**
- `src/lib/nameFilter.ts` -- Add `validateDisplayName()` function
- `src/pages/ProfileSettings.tsx` -- Apply display name validation on save

---

## 3. Shadow Ban: Hide Incomplete Profiles from Public Views

Update the `get_public_users_directory()` and `mv_top_ranking` materialized view to exclude users who haven't completed their profile.

**Filter criteria (added to WHERE clause):**
```text
AND p.avatar_url IS NOT NULL
AND p.username NOT LIKE 'user_%'
AND p.display_name IS NOT NULL
```

This ensures the User Directory and Top Ranking only show real, active users.

**Database migration:**
- Recreate `get_public_users_directory()` with the new filters
- Recreate `mv_top_ranking` materialized view with the same filters

---

## 4. Admin "Profile Status" Column + Stale Account Filter

Add a computed "Profile Status" column to the Admin Users table showing:
- **Complete** (green): Has custom username + avatar + display name changed
- **Incomplete** (yellow): Missing one or more items
- **Stale** (red): Incomplete AND registered more than 24 hours ago

Add a filter toggle: "Show Stale Only" to quickly find accounts for bulk action.

**Files changed:**
- `src/components/Admin/tabs/AllUsersTab.tsx` -- Add Profile Status column and Stale filter toggle
- `src/hooks/useAdminManage.ts` -- Add `getProfileStatus()` helper (computed client-side from existing data: `username`, `avatar_url`, `created_at`)

No new database columns needed -- this is computed from existing `username` (starts with `user_`), `avatar_url` (null), and `created_at` (> 24h ago).

---

## 5. Optimize Avatar Upload: Client-Side Image Resize to 200x200

Instead of using AI scanning (which costs Cloud credits), resize images client-side before uploading to R2. This:
- Saves storage space (a 200x200 JPEG is ~10-30KB vs 2-5MB originals)
- Eliminates the need for the `verify-avatar` Edge Function call
- Works entirely in the browser using HTML Canvas

**Implementation:**
- Add a `resizeImage()` utility function that uses Canvas API to resize to 200x200 and compress as JPEG (quality 0.8)
- Apply this in `DragDropImageUpload.tsx` when `folderPath === "profiles"` (avatar uploads only)
- Reduce `maxSizeMB` default for avatars from 5MB to 1MB (after resize, images will be ~20KB)

**Files changed:**
- `src/lib/imageUtils.ts` -- New file with `resizeImage(file, maxWidth, maxHeight, quality)` function
- `src/components/Profile/DragDropImageUpload.tsx` -- Apply resize before upload for avatar images
- `src/components/Onboarding/ProfileOnboardingModal.tsx` -- Pass smaller maxSizeMB for avatar upload

---

## Technical Summary

| Change | Type | Cloud Cost | Files |
|--------|------|-----------|-------|
| SIGNUP reward gate | Edge Function | None | 1 |
| Spam name filter | Client-side JS | None | 2 |
| Shadow ban (SQL) | DB Migration | None | 1 migration |
| Admin Profile Status | Frontend only | None | 2 |
| Image resize 200x200 | Client-side JS | None | 3 |

**Total Cloud cost impact: Zero.** All changes are either client-side logic or SQL query filter updates.

