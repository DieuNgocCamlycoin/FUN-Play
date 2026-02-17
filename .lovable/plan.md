

# Automatic Claim System -- Cleanup Unused Code

## Status

The automatic claim system is working correctly. The edge function (`claim-camly`) handles authentication, validation, daily/lifetime limits, stuck claim cleanup, and blockchain transactions properly. The client-side modal (`ClaimRewardsModal`) has proper error handling, realtime subscriptions, and UI feedback.

## Issues Found

### 1. Unused imports in ClaimRewardsModal.tsx
Several imports are declared but never used anywhere in the component, adding unnecessary bundle weight:
- `useNavigate` from `react-router-dom` (the component uses `window.location.href` instead)
- `Alert`, `AlertDescription`, `AlertTitle` from UI components (not used in JSX)
- `TrendingUp` icon from lucide-react (not used in JSX)

### 2. Unnecessary `navigate` variable
The `useNavigate()` hook is imported but the `navigate` function is never called -- the component uses `window.location.href` for redirects instead.

## Plan

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

**Line 7** -- Remove unused `Alert`, `AlertDescription`, `AlertTitle` import:
```typescript
// DELETE this line entirely
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
```

**Line 8** -- Remove `TrendingUp` from the lucide-react import:
```typescript
// Change from:
import { Coins, Sparkles, Gift, CheckCircle, Loader2, ExternalLink, Wallet, Smartphone, AlertCircle, HelpCircle, Clock, ShieldCheck, Info, TrendingUp, Camera } from "lucide-react";
// To:
import { Coins, Sparkles, Gift, CheckCircle, Loader2, ExternalLink, Wallet, Smartphone, AlertCircle, HelpCircle, Clock, ShieldCheck, Info, Camera } from "lucide-react";
```

**Line 9** -- Remove unused `useNavigate` import:
```typescript
// DELETE this line entirely
import { useNavigate } from "react-router-dom";
```

### No edge function changes needed
### No database changes needed
### No new dependencies needed
