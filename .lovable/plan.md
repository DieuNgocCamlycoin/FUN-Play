

# Fix: AI Selfie Verification - Image Fetching Error

## Problem Found

The `verify-avatar` edge function sends the avatar URL directly to Gemini AI, but Gemini cannot access the R2 storage URLs (gets 401 Unauthorized). This causes ALL avatar verifications to fail with "AI analysis failed".

**Error from logs:**
```
AI gateway error: 400 "Received 401 status code when fetching image from URL: https://pub-...r2.dev/play_fun.jpg"
```

## Solution

Update the edge function to:
1. Download the image from R2 server-side first
2. Convert it to a base64 data URL
3. Send the base64 data URL to Gemini instead of the raw R2 URL

This way Gemini receives the image data directly and doesn't need to fetch it from R2.

## Technical Changes

### File: `supabase/functions/verify-avatar/index.ts`

Add image download and base64 conversion before calling the AI:

```
// Before calling AI:
1. fetch(avatarUrl) to download the image bytes
2. Convert to base64 using btoa()
3. Determine MIME type from Content-Type header
4. Send as data:image/jpeg;base64,... to the AI
```

Replace the `image_url: { url: avatarUrl }` with `image_url: { url: base64DataUrl }`.

Also add error handling for cases where the image cannot be downloaded.

No other files need changes -- the ClaimRewardsSection, ClaimRewardsModal, and ProfileSettings are all correctly wired up already.
