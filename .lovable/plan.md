

# Suggestions: Encourage Real Profile Pictures Before Claiming CAMLY

## Current System

Your app already has a basic avatar gate -- users without any avatar cannot click the Claim button. However, users can upload any image (cartoons, logos, random photos) and still pass this check. You want to encourage **real personal photos**.

## Suggested Approaches (Choose One or Combine)

### Option A: Selfie Verification Gate (Recommended)

Add a "Selfie Verification" step before claiming. When a user uploads an avatar, use **AI face detection** to check if the image contains a real human face.

**How it works:**
1. User uploads avatar on profile settings page
2. Backend edge function uses Lovable AI (Gemini) to analyze the image: "Does this image contain a clear human face as a profile photo?"
3. If YES: set `avatar_verified = true`, user can claim
4. If NO: set `avatar_verified = false`, show a friendly message: "Please upload a real photo of yourself to claim rewards"

**User experience:**
- Claim button remains disabled until `avatar_verified = true`
- Orange banner: "Upload a real photo of yourself to unlock claiming"
- Link to profile settings with camera icon

### Option B: Manual Admin Verification (Simpler)

Keep the current system but make `avatar_verified` a manual admin approval:
1. User uploads any avatar
2. Admin reviews in the admin panel and approves/rejects
3. Only verified avatars unlock claiming

**Downside:** Requires manual admin work for every user.

### Option C: Bonus Reward for Real Photos (Soft Encouragement)

Instead of blocking, offer a **bonus reward** for verified photos:
- Users with verified real photos get a 10-20% bonus on all rewards
- Show a "Verified" badge on their profile/channel
- Display a progress bar: "Upload a real photo to unlock +20% bonus rewards"

**Downside:** Does not force compliance, some users will skip it.

### Option D: Tiered Claim Limits (Hybrid)

- **Without real photo**: Can claim up to 100,000 CAMLY/day
- **With verified real photo**: Full 500,000 CAMLY/day limit
- This gives users an incentive without completely blocking them

---

## Recommended: Option A (AI Selfie Verification)

### Technical Implementation

**Step 1: Create edge function `verify-avatar`**
- Accepts the user's avatar URL
- Sends it to Lovable AI (Gemini 2.5 Flash) with prompt: "Is this a real photo of a human face suitable for a profile picture? Answer YES or NO."
- Updates `profiles.avatar_verified` based on the result

**Step 2: Update profile settings page**
- After avatar upload, automatically call `verify-avatar`
- Show verification status (pending/verified/rejected)
- If rejected: "Please upload a clear photo of your face"

**Step 3: Update ClaimRewardsModal**
- Change the existing gate from `!profileCheck.hasAvatar` to `!profileCheck.hasAvatar || !profileCheck.isVerified`
- The claim button is already disabled when `!profileCheck.hasAvatar` -- extend this to also check `isVerified`
- Update the orange warning message to be clearer about needing a **real photo**

**Step 4: Update the claim button disabled condition**
- Current: `!profileCheck.hasAvatar`
- New: `!profileCheck.hasAvatar || !profileCheck.isVerified`

### Files to Change

1. **New**: `supabase/functions/verify-avatar/index.ts` -- AI-powered face detection
2. **Edit**: Profile settings page -- trigger verification after avatar upload
3. **Edit**: `src/components/Rewards/ClaimRewardsModal.tsx` -- strengthen the gate to require `isVerified`
4. **Edit**: Admin panel -- add ability to manually override verification status

