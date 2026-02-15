

# Fix CAMLY Logo White Background

## Problem
The `mix-blend-mode: multiply` approach does not work here because the card itself has a white background (`bg-white`). Multiplying white on white produces white, so the logo's baked-in white background remains fully visible.

## Solution
Replace the blend-mode approach with a proper visual fix:

1. **Add a gradient background circle** behind the logo that matches the gold theme, so the white pixels in the image blend naturally into a gold-toned circle instead of standing out.
2. **Use `mix-blend-mode: darken`** instead of `multiply` — this will make white pixels take on the background color beneath them (the gold gradient), effectively hiding the white border while preserving the coin design.
3. **Add `overflow-hidden` and `rounded-full`** on the wrapper div to cleanly clip everything into a circle.

## File Changed

| File | Change |
|------|--------|
| `src/components/Wallet/CAMLYPriceSection.tsx` | Wrap logo in a gradient background circle and switch blend mode |

## Technical Details

Update the motion.div wrapper and img (lines 65-82):

```text
<motion.div
  className="relative rounded-full overflow-hidden"
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
    className="h-14 w-14 rounded-full object-cover"
    style={{ mixBlendMode: 'darken' }}
  />
</motion.div>
```

- The gold gradient background fills the space behind the logo
- `mix-blend-mode: darken` makes the white pixels take on the darker gold background color, effectively removing the white border
- `overflow-hidden` and `rounded-full` on the wrapper ensure a clean circular clip
- Works consistently on both web and mobile browsers

