
# Smart Username and Display Name System

## Current Problems
- 682 out of 684 users have system-generated usernames like `user_43a82db3` -- unusable for profile URLs
- No way for users to choose a custom `@username` in settings
- No validation or filtering of inappropriate display names
- Profile completion indicator doesn't track username customization
- Channel URLs use ugly system IDs instead of friendly usernames

## Solution Overview

A 3-part approach: (1) Let users choose custom usernames, (2) Filter inappropriate names, (3) Gently nudge users to complete their profile.

---

## Part 1: Custom Username Field in Settings

**File: `src/pages/ProfileSettings.tsx`**
- Add a new "Username" (`@username`) input field below display name
- Real-time availability check (debounced query to profiles table)
- Validation rules:
  - 3-30 characters, lowercase letters, numbers, underscores only
  - No offensive words (checked against blocklist)
  - Must be unique (DB already has UNIQUE constraint)
  - Cannot start with `user_` (reserved for system-generated)
- Show green checkmark when available, red X when taken

**File: `src/components/Profile/ProfileCompletionIndicator.tsx`**
- Add "Username" as a 5th completion item
- A custom username (not starting with `user_`) counts as completed

---

## Part 2: Display Name Content Filter

**New file: `src/lib/nameFilter.ts`**
- A lightweight Vietnamese + English blocklist of offensive/inappropriate words
- Function `isNameAppropriate(name: string): { ok: boolean; reason?: string }`
- Check on save in ProfileSettings -- block saving if inappropriate
- Also used in the signup trigger (server-side)

**File: `src/pages/ProfileSettings.tsx`**
- Validate display name on save using the filter
- Show warning toast if name is flagged

**Database: Update `handle_new_user()` function**
- Strip inappropriate words from auto-generated display names at signup time

---

## Part 3: Profile Nudge Banner

**New file: `src/components/Profile/ProfileNudgeBanner.tsx`**
- A dismissable banner shown on the home page / profile for users who:
  - Still have a system-generated username (`user_*`)
  - Have no avatar
  - Have an unverified avatar
- Friendly message: "Hoan thien ho so de nhan thuong CAMLY!" with a link to settings
- Dismissable for 24 hours (stored in localStorage)

**File: `src/pages/Index.tsx` or main layout**
- Render the nudge banner for logged-in users with incomplete profiles

---

## Technical Details

### Username Validation (client-side)
```text
Rules:
- Regex: /^[a-z0-9_]{3,30}$/
- Cannot start with "user_" (reserved)
- Checked against blocklist
- Real-time uniqueness check via:
  SELECT id FROM profiles WHERE username = $1 AND id != current_user_id
```

### Name Filter Blocklist (`src/lib/nameFilter.ts`)
- ~50 Vietnamese and English offensive terms
- Normalized comparison (remove diacritics, lowercase)
- Returns specific reason for admin transparency
- Lightweight -- no external API calls needed

### ProfileSettings Save Flow (updated)
```text
1. Validate display_name against nameFilter
2. Validate username format + availability
3. Update profiles.username + profiles.display_name
4. Update channels.name to match display_name
5. Show success toast
```

### Database Changes
- None needed -- `profiles.username` already exists with UNIQUE constraint
- The `handle_new_user()` function stays as-is (system usernames are fine as defaults)

### Files Changed
1. `src/pages/ProfileSettings.tsx` -- Add username field with validation
2. `src/components/Profile/ProfileCompletionIndicator.tsx` -- Add username completion item
3. `src/lib/nameFilter.ts` -- New: offensive name blocklist and checker
4. `src/components/Profile/ProfileNudgeBanner.tsx` -- New: nudge banner component
5. `src/pages/Index.tsx` -- Render nudge banner

### Files NOT Changed
- No edge functions needed (all validation is client-side + DB constraints)
- No database migrations needed
- No changes to user routing -- existing `/c/:username` routes already work with custom usernames
