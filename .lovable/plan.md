

# Require Profile Picture Before Claiming Rewards

## Overview
Users without a profile picture (avatar) will be blocked from claiming rewards. They'll see a clear notification explaining they need to update their profile picture and personal info first.

## Changes

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

1. **Fetch profile data on modal open**
   - Query the `profiles` table for `avatar_url` and `avatar_verified` when the modal opens
   - Store in a `profileCheck` state: `{ hasAvatar: boolean, isVerified: boolean }`

2. **Block claim if no avatar**
   - Before the claim action area, show a prominent warning alert if `avatar_url` is null/empty:
     - Icon: User/Camera icon
     - Title: "Vui long cap nhat anh dai dien!"
     - Description: "Ban can cap nhat anh dai dien va thong tin ca nhan de nhan thuong CAMLY. Sau khi cap nhat, ban co the claim thuong."
     - A button linking to `/profile-settings` to update their profile
   - Disable the Claim button when `hasAvatar` is false
   - Show additional note if avatar is not yet verified: "Anh dai dien cua ban dang cho xac minh. Vui long dam bao anh khong trung lap voi nguoi dung khac."

### File: `src/components/Wallet/ClaimRewardsSection.tsx`

3. **Pre-check avatar before opening modal**
   - Fetch `avatar_url` from the profile (already available or add a quick query)
   - In `handleClaimClick`, if user has no avatar, show a friendly toast instead of opening the modal:
     - Title: "Cap nhat ho so de nhan thuong"
     - Description: "Vui long cap nhat anh dai dien va thong tin ca nhan truoc khi claim CAMLY."
   - Keep the Claim button visible but intercept the click

## Technical Details

| Change | File | What |
|--------|------|------|
| Fetch `avatar_url` + `avatar_verified` on modal open | `ClaimRewardsModal.tsx` | Query profiles table |
| Show warning alert if no avatar | `ClaimRewardsModal.tsx` | Alert with link to profile settings |
| Disable Claim button if no avatar | `ClaimRewardsModal.tsx` | Prevent claim action |
| Pre-check in ClaimRewardsSection | `ClaimRewardsSection.tsx` | Toast + block modal open if no avatar |

