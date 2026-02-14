

# Fix and Optimize All Share Buttons Across FUN Play

## Issues Found

### 1. PostReactions.tsx -- Share uses `window.location.origin` (preview URL, not production)
The share button in post reactions generates a URL like `https://53abc96f-...lovableproject.com/post/{id}` instead of the production URL. The `ShareModal` already correctly uses `https://official-funplay.lovable.app` as the base URL, but `PostReactions` does not.

### 2. PostDetail.tsx -- Same problem: shares `window.location.href` directly
The share button on the post detail page shares the current browser URL, which on preview/development would be a non-public URL.

### 3. ProfileInfo.tsx -- Share uses `window.location.origin` and has no clipboard fallback
- Generates profile URL from `window.location.origin` (wrong in preview)
- The "copy" action calls `navigator.clipboard.writeText()` without a try/catch fallback (fails on some mobile browsers without HTTPS or focus)

### 4. MobileUploadSuccess.tsx -- Share uses `window.location.origin`
Same issue: generates video share URL from current origin instead of production URL.

### 5. PostReactions.tsx -- No clipboard fallback
Uses `navigator.clipboard.writeText()` directly without the robust fallback that `ShareModal` already has (textarea fallback for older mobile browsers).

### 6. Inconsistent share experience
- `ShareModal` has a full-featured share dialog with social platforms, QR code, copy fallback, and CAMLY rewards
- Post share buttons and Profile share only use basic `navigator.share` or simple clipboard copy -- no social platform options, no rewards

## Plan

### Step 1: Create a shared utility for production URLs (`src/lib/shareUtils.ts`)

Create a helper that always returns the production base URL, and a `copyToClipboard` function with fallback (extracted from `ShareModal`):

```typescript
export const PRODUCTION_URL = 'https://official-funplay.lovable.app';

export function getShareUrl(path: string): string {
  return `${PRODUCTION_URL}${path}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  // Same robust fallback logic currently in ShareModal
}
```

### Step 2: Fix PostReactions.tsx

- Use `getShareUrl(`/post/${postId}`)` instead of `window.location.origin`
- Use the shared `copyToClipboard` with fallback instead of raw `navigator.clipboard`

### Step 3: Fix PostDetail.tsx

- Use `getShareUrl(`/post/${id}`)` instead of `window.location.href`
- Use shared `copyToClipboard` with fallback

### Step 4: Fix ProfileInfo.tsx

- Use `getShareUrl(`/u/${profile.username}`)` instead of `window.location.origin`
- Use shared `copyToClipboard` with try/catch fallback for the "copy" action

### Step 5: Fix MobileUploadSuccess.tsx

- Use `getShareUrl(`/watch/${videoId}`)` instead of `window.location.origin`

### Step 6: Update ShareModal.tsx to use the shared utility

- Replace the hardcoded `'https://official-funplay.lovable.app'` string and the inline `copyToClipboard` function with imports from `shareUtils.ts` -- single source of truth

## Files Changed

| File | Change |
|------|--------|
| `src/lib/shareUtils.ts` | **New** -- production URL helper + clipboard fallback utility |
| `src/components/Post/PostReactions.tsx` | Use production URL + clipboard fallback |
| `src/pages/PostDetail.tsx` | Use production URL + clipboard fallback |
| `src/components/Profile/ProfileInfo.tsx` | Use production URL + clipboard fallback |
| `src/components/Upload/Mobile/MobileUploadSuccess.tsx` | Use production URL |
| `src/components/Video/ShareModal.tsx` | Import shared utilities instead of inline duplicates |

