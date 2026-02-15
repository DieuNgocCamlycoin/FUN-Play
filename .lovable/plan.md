

# Feature: Avatar Verification Gate + Enhanced PPLP Content Moderation Before Upload

## Overview

Two smart checks will run **before** a video upload proceeds:

1. **Avatar Verification Gate**: If the user has no verified real-person profile picture (`avatar_verified !== true`), block the upload and guide them to Profile Settings to upload a real photo.

2. **Enhanced PPLP Content Moderation**: The existing `moderate-content` edge function already runs during upload (in `UploadContext.tsx`), but currently it only checks title+description **after** the video has been uploaded to R2. We will move the moderation check **before** the upload starts, saving bandwidth and time. Videos that fail moderation will be flagged as `pending_review` for admin approval.

## Smart UX Optimizations

- **One-time avatar check**: Once verified, the user never sees the gate again (stored in DB as `avatar_verified = true`).
- **Inline guidance**: Instead of a generic error, show a friendly modal with a direct link to Profile Settings.
- **Pre-upload moderation**: Check title and description BEFORE uploading the video file, so users get instant feedback without waiting for the upload to finish.
- **Soft moderation**: Content with borderline scores (3-5) still gets uploaded but marked for admin review. Only clearly violating content (score < 3) is blocked outright with a friendly explanation.
- **Loading state**: Show "Angel AI is reviewing..." with a subtle animation while moderation runs.

## Technical Changes

### 1. Create a shared hook: `src/hooks/useUploadGate.ts` (NEW FILE)

A reusable hook that both web and mobile upload flows will use:

```typescript
export function useUploadGate() {
  // Checks:
  // 1. Fetch profile.avatar_verified
  // 2. If not verified, return { allowed: false, reason: 'avatar' }
  // 3. Run moderate-content on title+description
  // 4. If score < 3, return { allowed: false, reason: 'content_blocked', message: ... }
  // 5. If score 3-5, return { allowed: true, approvalStatus: 'pending_review' }
  // 6. If score > 5, return { allowed: true, approvalStatus: 'approved' }
}
```

### 2. Update `src/components/Upload/Mobile/MobileUploadFlow.tsx`

- In `handleUpload()`, before adding to background queue:
  - Call `useUploadGate().checkBeforeUpload(metadata)`
  - If avatar not verified: show a bottom sheet/modal explaining the requirement with a "Go to Settings" button
  - If content blocked: show the reason from Angel AI
  - If pending_review: proceed with upload but pass `approvalStatus: 'pending_review'` to the upload context
- Add a new UI state for the gate check ("Angel AI is reviewing..." screen)

### 3. Update `src/components/Upload/UploadWizard.tsx`

- Same logic as mobile, applied in `handleUpload()` before the upload starts
- Show an inline alert/dialog for avatar verification or content issues
- The "preview" step already exists -- add the gate check when user clicks "Upload" from preview

### 4. Update `src/contexts/UploadContext.tsx`

- Accept `approvalStatus` parameter in `addUpload()` metadata so the pre-determined moderation result flows through
- Remove the duplicate moderation call currently at line ~193 (since moderation now happens before upload)
- Use the pre-determined `approvalStatus` when inserting the video record

### 5. Create Avatar Verification Gate Component: `src/components/Upload/AvatarVerificationGate.tsx` (NEW FILE)

A reusable UI component (dialog/bottom sheet) that:
- Shows a friendly message: "Please verify your profile picture before uploading"
- Displays current avatar (if any) with verification status
- Has a "Go to Profile Settings" button
- Works on both web (Dialog) and mobile (bottom sheet style)

### 6. Create Content Moderation Feedback Component: `src/components/Upload/ContentModerationFeedback.tsx` (NEW FILE)

A UI component that shows:
- "Angel AI is checking your content..." loading state
- Approved result with green checkmark
- Pending review result with yellow warning
- Blocked result with red alert and the reason

## Flow Diagram

```text
User clicks "Upload" button
        |
        v
  Check avatar_verified?
        |
   No --+--> Show "Please verify avatar" dialog
        |      --> Link to Profile Settings
        |
   Yes -+--> Show "Angel AI is reviewing..." 
        |
        v
  Call moderate-content(title, description)
        |
  score < 3 --> Block upload, show reason
  score 3-5 --> Upload with approval_status = "pending_review"
  score > 5 --> Upload with approval_status = "approved"
        |
        v
  Proceed with R2 upload + DB insert
```

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/useUploadGate.ts` | NEW - shared gate logic |
| `src/components/Upload/AvatarVerificationGate.tsx` | NEW - avatar gate UI |
| `src/components/Upload/ContentModerationFeedback.tsx` | NEW - moderation feedback UI |
| `src/components/Upload/Mobile/MobileUploadFlow.tsx` | EDIT - integrate gate before upload |
| `src/components/Upload/UploadWizard.tsx` | EDIT - integrate gate before upload |
| `src/contexts/UploadContext.tsx` | EDIT - accept pre-determined approvalStatus, remove duplicate moderation |

