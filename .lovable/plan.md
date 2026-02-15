

# Fix AI Selfie Verification for Wallet Claims

## Status After Testing

The `verify-avatar` edge function is **deployed and working correctly**. I tested it with a logo image and it correctly returned `verified: false`. The AI analysis (Gemini 2.5 Flash) is functioning properly.

However, I found **two issues** that need fixing:

---

## Issue 1: ClaimRewardsSection Does Not Check `avatar_verified`

The `ClaimRewardsSection` component (the main claim page) only checks if `avatarUrl` exists -- it does NOT check `avatar_verified`. This means:
- Users with any image (cartoon, logo, etc.) can still open the claim modal from this page
- The verification gate only works inside the `ClaimRewardsModal`, but users see a confusing flow

**Fix:** Update `ClaimRewardsSection` to:
1. Fetch `avatar_verified` alongside `avatar_url` (already fetched but not used for gating)
2. Add verification check to `handleClaimClick` -- block with a toast if not verified
3. Update the avatar warning banner to also show when avatar exists but is not verified
4. Add `avatar_verified` to the `canClaim` condition

## Issue 2: All 183 Existing Users Are Unverified

Currently all 183 users with avatars have `avatar_verified = false` because the verification was just added. This means **no existing users can claim** until they re-upload their avatar.

**Fix:** This is expected behavior -- users need to go to Profile Settings and re-upload a real photo. No code change needed, but we should make the messaging clearer so users understand what to do.

---

## Technical Changes

### File 1: `src/components/Wallet/ClaimRewardsSection.tsx`

- Add `avatarVerified` state variable (already partially there via `avatarUrl`)
- Fetch `avatar_verified` from profiles (already fetched but stored only as `avatar_url`)
- Update `handleClaimClick` to check `avatarVerified`:
  - If avatar exists but not verified: show toast directing to profile settings
- Update the avatar warning section to show different messages:
  - No avatar: "Upload a profile picture"
  - Avatar but not verified: "Upload a real portrait photo to verify and claim"
- Update `canClaim` logic to include `avatarVerified` check

### File 2: `supabase/functions/verify-avatar/index.ts`

No changes needed -- the function is working correctly.

### File 3: `src/components/Rewards/ClaimRewardsModal.tsx`

No changes needed -- the gating logic is already correct with both `hasAvatar` and `isVerified` checks.

### File 4: `src/pages/ProfileSettings.tsx`

No changes needed -- verification triggers automatically on avatar upload.

---

## Summary of Changes

| File | Change |
|------|--------|
| `ClaimRewardsSection.tsx` | Add `avatar_verified` gating to claim button and warning banners |

Only 1 file needs to be updated. The edge function and modal are already working correctly.
