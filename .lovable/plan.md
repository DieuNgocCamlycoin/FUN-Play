

# Remove White Background Around CAMLY Token Logo

## Problem
The CAMLY coin logo next to "CAMLY Token" on the price chart has a visible white/light background around it, making it look out of place against the card background.

## Solution

Since the uploaded image has a white background baked into the PNG file itself, we need to use CSS to visually remove it. There are two approaches combined for best results:

1. **Use `mix-blend-mode: multiply`** on the image -- this CSS property makes white pixels transparent, effectively removing the white background while preserving the coin design.

2. **Add a subtle gradient background behind the logo** to ensure smooth blending on any background.

3. **Remove `rounded-full`** clipping if the coin design already has its own circular shape, or keep it if the image needs cropping.

## File Changed

| File | Change |
|------|--------|
| `src/components/Wallet/CAMLYPriceSection.tsx` | Add `mix-blend-mode: multiply` and adjust styling to remove visible white background |

## Technical Details

In `CAMLYPriceSection.tsx` (around line 76-80), update the `img` element:

```text
// Before:
<img
  src="/images/camly-coin-new.png"
  alt="CAMLY"
  className="h-14 w-14 rounded-full object-cover"
/>

// After:
<img
  src="/images/camly-coin-new.png"
  alt="CAMLY"
  className="h-14 w-14 rounded-full object-cover"
  style={{ mixBlendMode: 'multiply' }}
/>
```

The `mix-blend-mode: multiply` property will make white pixels effectively transparent, cleanly removing the white background around the coin logo. This works on both web and mobile browsers.

If the blend mode alone isn't sufficient (e.g., if the background behind the logo isn't white), we'll also add a circular background wrapper to ensure a clean appearance.

