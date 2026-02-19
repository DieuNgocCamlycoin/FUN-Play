

# Fix: Social Media Orbit Avatars Not Displaying

## Root Cause

The `social_avatars` field is missing from the TypeScript interfaces in both `UserProfile.tsx` and `Channel.tsx`. Although the database query uses `select("*")` and fetches all columns (including `social_avatars`), the TypeScript interface strips the field, so it never reaches the `ProfileHeader` and `SocialMediaOrbit` components.

## What's Working

- The Edge Function `fetch-social-avatar` is functioning correctly (tested and confirmed).
- The database column `social_avatars` exists and contains valid cached data for your profile:
  - angelai: profile image from angel.fun.rich
  - facebook: favicon (Facebook blocks og:image scraping)
  - telegram: Telegram logo
  - youtube: actual YouTube channel avatar
- The `SocialMediaOrbit` component rendering logic is correct.
- The `ProfileSettings` integration correctly triggers the edge function on save.

## Fixes Required

### 1. `src/pages/UserProfile.tsx` - Add `social_avatars` to interface
Add the missing field to the `UserProfileData` interface (line 43, after `suspicious_score`):
```
social_avatars: Record<string, string | null> | null;
```

### 2. `src/pages/Channel.tsx` - Add `social_avatars` to interface
Add the missing field to the `ProfileData` interface (line 39, after `zalo_url`):
```
social_avatars: Record<string, string | null> | null;
```

## Summary

Two one-line additions to TypeScript interfaces. No other changes needed - the backend, edge function, database, and UI components are all working correctly. The avatars will appear immediately after this fix because the data is already cached in the database.

