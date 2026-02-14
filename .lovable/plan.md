
# Optimize Claim CAMLY Rewards Layout (Web + Mobile)

## Current Issues (from screenshot analysis)

1. **Redundant information**: The claimable amount (869,000 CAMLY) is displayed twice -- once in the main green card and once in the right-column summary card. This wastes space.
2. **Information overload on mobile**: When stacked vertically, wallet info, claimable amount, pending claim warning, avatar verification warning, and processing button all compete for attention.
3. **Claim button buried**: The most important action (Claim button) is positioned between warning alerts, making it hard to find.
4. **Two-column layout on desktop shows duplicate data**: Left column has claimable amount + breakdowns, right column repeats the same claimable total.

## Solution: Streamlined Single-Flow Layout

### New Layout Order (both web and mobile)

1. **Header row**: Wallet address (compact) + Claimable amount side-by-side on desktop, stacked on mobile
2. **Claim button**: Immediately after the key numbers -- the primary action should be prominent and early
3. **Warnings** (if any): Pending claim, avatar verification -- shown only when relevant, compact
4. **Daily limit progress bar**: Simple progress indicator
5. **Reward breakdown**: Approved rewards list, then pending rewards list -- collapsible on mobile
6. **Info notes**: Process explanation at the bottom

### File Changes

**`src/components/Rewards/ClaimRewardsModal.tsx`**:
- Remove the two-column (`md:grid-cols-2`) layout entirely -- use a single-column flow for both web and mobile
- Remove the duplicate "Tong quan phan thuong" (right column summary) since it repeats the same data
- Move Claim button to appear right after the claimable amount card
- Consolidate wallet info into a compact inline bar (address + connection status)
- Stack warnings compactly below the button
- Keep reward breakdowns (approved + pending) at the bottom with scroll area
- Add daily claim limit progress bar (currently only in ClaimRewardsSection, not in modal)

**`src/components/Wallet/ClaimRewardsSection.tsx`**:
- Reorder stat cards: "Co the Claim" first (most important), then "Cho duyet", "Da Claim", "Tong da nhan"
- Move Claim button higher, right after the "Co the Claim" stat
- Consolidate progress bars (threshold + daily limit) into a compact section
- Keep avatar warning but make it more compact

### Technical Details

- No backend/edge function changes needed -- the claim system is working correctly (logs confirm successful claims)
- Processing time (~5-10s) is normal BSC blockchain confirmation time -- no optimization possible there
- The "Dang xu ly giao dich" spinner is expected behavior during blockchain confirmation
- Layout changes are purely CSS/JSX restructuring within the two existing component files
