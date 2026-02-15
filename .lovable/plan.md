

# Fix: Mobile Back Button on Gate States

## Bug

On mobile, when the upload gate blocks the user (avatar not verified or content blocked), the navigation stack looks like:
`["type-selector", "video-details", "gate-checking", "gate-avatar"]`

The header back button is visible on `gate-avatar` and `gate-blocked`. Pressing it navigates to `gate-checking`, which is a loading spinner with no escape -- the user gets permanently stuck.

## Fix

### File: `src/components/Upload/Mobile/MobileUploadFlow.tsx` (line 353)

Update the `showBackButton` condition to also exclude `gate-avatar` and `gate-blocked`:

```
// Before
const showBackButton = navigationStack.length > 1 && currentStep !== "uploading" && currentStep !== "success" && currentStep !== "gate-checking";

// After
const showBackButton = navigationStack.length > 1 
  && currentStep !== "uploading" 
  && currentStep !== "success" 
  && currentStep !== "gate-checking"
  && currentStep !== "gate-avatar"
  && currentStep !== "gate-blocked";
```

These gate states already have their own dedicated navigation buttons:
- `AvatarVerificationGate` has "Go to Settings" and "Close" buttons
- `ContentModerationFeedback` has "Retry" and "Close" buttons

No other bugs found -- the web wizard, hook logic, context, and edge function integrations are all working correctly.

