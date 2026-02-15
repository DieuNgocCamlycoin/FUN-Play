

# Fix CAMLY Logo - Remove White Background Properly

## Problem
The current `mix-blend-mode: darken` approach with a gold gradient background is not fully removing the white background. It turns the white into a gold ring, creating an unnatural border effect around the coin.

## Solution
Use a two-part approach for a clean result:

1. **Scale the image slightly larger** (`scale-110` or `scale-125`) within the `overflow-hidden` container so the white border edges get clipped outside the visible area, revealing only the coin design itself.

2. **Keep the gold gradient background** as a fallback behind the image, but remove the `mix-blend-mode` since scaling + clipping handles the white border removal.

3. **Fine-tune sizing** to ensure the coin fills the circular container cleanly on both web and mobile.

## File Changed

| File | Change |
|------|--------|
| `src/components/Wallet/CAMLYPriceSection.tsx` | Scale image to clip white borders, remove blend mode |

## Technical Details

Update lines 65-84 in `CAMLYPriceSection.tsx`:

```text
<motion.div
  className="relative rounded-full overflow-hidden h-14 w-14"
  animate={{
    boxShadow: [
      "0 0 20px rgba(255, 215, 0, 0.4)",
      "0 0 40px rgba(255, 215, 0, 0.6)",
      "0 0 20px rgba(255, 215, 0, 0.4)",
    ],
  }}
  transition={{ duration: 2, repeat: Infinity }}
  style={{
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
  }}
>
  <img
    src="/images/camly-coin-new.png"
    alt="CAMLY"
    className="h-full w-full object-cover scale-125"
  />
</motion.div>
```

Key changes:
- Set explicit `h-14 w-14` on the wrapper div (not the img) to control the container size
- Use `h-full w-full` on the image to fill the container
- Add `scale-125` to zoom the image slightly so the white border area falls outside the `overflow-hidden` clipping boundary
- Remove `mix-blend-mode` entirely since it's no longer needed
- The `rounded-full overflow-hidden` on the wrapper clips everything into a clean circle

This approach works reliably on all browsers, both web and mobile, without relying on CSS blend modes.
