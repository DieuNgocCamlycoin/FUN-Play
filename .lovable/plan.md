
# Three Features: Test Username Flow, Admin Bulk Notify, First-Login Onboarding

## 1. Test Username Customization Flow

The username customization is already fully implemented. I will manually test it by navigating to `/settings` in the browser, entering a custom username, verifying real-time availability, saving, and confirming the profile updates. This is a verification step, not a code change.

---

## 2. Admin Tool: Bulk Notify Users with System Usernames

### What it does
Adds a button in the Admin Dashboard (User Stats or Overview section) that sends an in-app notification to all users still using `user_*` system usernames, encouraging them to update their profile.

### Changes

**New database function: `bulk_notify_system_usernames`**
- Accepts `p_admin_id` (admin check via `has_role`)
- Selects all profiles where `username LIKE 'user_%'`
- Inserts a notification for each user into the existing `notifications` table:
  - `type`: `'system'`
  - `title`: `'Cap nhat ho so cua ban!'`
  - `message`: `'Ban dang dung username he thong. Hay chon username dep va cap nhat anh dai dien de nhan thuong CAMLY!'`
  - `link`: `'/settings'`
- Returns the count of notified users

**`src/components/Admin/tabs/OverviewTab.tsx` (or UserStatsTab)**
- Add a "Nhac tat ca user cap nhat ho so" button
- Calls the new RPC, shows a toast with the count of users notified
- Includes a confirmation dialog to prevent accidental mass notifications
- Shows the current count of users with system usernames

---

## 3. First-Login Onboarding Modal

### What it does
A modal that appears once for new users (or users with incomplete profiles) guiding them to:
1. Choose a custom `@username`
2. Upload a real avatar photo
The modal is non-blocking (can be dismissed) but strongly encourages completion.

### Changes

**New file: `src/components/Onboarding/ProfileOnboardingModal.tsx`**
- A Dialog modal with 2 steps:
  - Step 1: Choose custom username (reuses the same validation from `nameFilter.ts`)
  - Step 2: Upload avatar (reuses `DragDropImageUpload` component)
- "Skip" button available on each step (saves progress so far)
- "Done" button saves username + avatar to profiles table
- Tracks completion via `localStorage` key `onboarding_completed` so it only shows once
- Only shows when:
  - User is logged in
  - `username` starts with `user_` OR `avatar_url` is null
  - `onboarding_completed` is not set in localStorage

**`src/App.tsx`**
- Import and render `ProfileOnboardingModal` inside `AppContent`, after `BannedScreen` check
- Passes current user profile data (fetched via a lightweight query)

### Why non-blocking?
Making the modal blocking (preventing app access) would frustrate users who want to browse first. Instead, the modal is prominent but dismissible, and the nudge banner on the home page provides ongoing reminders.

---

## Technical Details

### Database Function (bulk notify)
```text
bulk_notify_system_usernames(p_admin_id uuid)
  -> Admin role check
  -> INSERT INTO notifications (user_id, type, title, message, link)
     SELECT id, 'system', '...', '...', '/settings'
     FROM profiles WHERE username LIKE 'user_%'
  -> RETURN count of inserted rows
```

### Onboarding Modal State Machine
```text
1. App loads -> check auth + profile
2. If user has system username OR no avatar:
   a. Check localStorage for 'onboarding_completed'
   b. If not completed -> show modal
3. User completes steps or dismisses -> set localStorage flag
4. Modal won't show again for that browser
```

### Files Summary
- **New**: `src/components/Onboarding/ProfileOnboardingModal.tsx`
- **Modified**: `src/App.tsx` (add onboarding modal)
- **Modified**: `src/components/Admin/tabs/OverviewTab.tsx` or `UserStatsTab.tsx` (add bulk notify button)
- **New DB function**: `bulk_notify_system_usernames`

### No Breaking Changes
- Existing username validation and nudge banner remain unchanged
- Notifications table already supports the required columns
- Modal is client-side only with localStorage persistence
