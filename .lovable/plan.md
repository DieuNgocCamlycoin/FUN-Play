

# Replace CAMLY Token Logo in Price Chart

## What Will Change

The current CAMLY coin logo (`/images/camly-coin.png`) next to the "CAMLY Token" text in the price chart section will be replaced with the new uploaded logo featuring the rainbow-glow CAMLY coin design.

## Steps

1. **Copy the uploaded image** to `public/images/camly-coin-new.png` (using public folder since the current logo already uses a public path pattern)

2. **Update `src/components/Wallet/CAMLYPriceSection.tsx`**:
   - Change the `img src` from `/images/camly-coin.png` to `/images/camly-coin-new.png`
   - The existing animated glow effect (`boxShadow` animation) will be adjusted to complement the rainbow glow already present in the new logo
   - Size remains `h-14 w-14` on desktop with `rounded-full` for clean circular display

## Files Changed

| File | Change |
|------|--------|
| `public/images/camly-coin-new.png` | New uploaded logo file |
| `src/components/Wallet/CAMLYPriceSection.tsx` | Update image `src` to use the new logo |

