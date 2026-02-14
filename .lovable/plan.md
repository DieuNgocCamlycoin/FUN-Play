

# Valentine's Day Update: Claim Rewards + Receipt Page

Since today is Valentine's Day, we'll add festive touches to two key areas.

## Changes

### 1. ClaimRewardsSection - Valentine Greeting (ClaimRewardsSection.tsx)

Add a Valentine's Day greeting banner below the CardDescription "Nhan thuong CAMLY tu hoat dong tren FUN PLAY":

- A pink/red gradient banner with heart icons
- Message: "Happy Valentine's Day! Chuc ban ngay le tinh nhan tran day yeu thuong va hanh phuc!"
- Animated hearts using framer-motion for a festive feel
- Mobile-optimized with proper text sizing and padding

### 2. Receipt Page - Valentine Theme (Receipt.tsx)

Add Valentine's Day decorative elements to both ClaimReceipt and DonationReceipt:

- **Heart decorations**: Floating heart emojis/icons around the receipt card header
- **Valentine banner**: A small "Happy Valentine's Day" ribbon with pink/red gradient below the logo
- **Decorative hearts border**: Subtle heart pattern on the card border for screenshot-friendly sharing
- **Footer**: "With Love from FUN Play" Valentine message at the bottom of the receipt, perfect for social media sharing

### Technical Details

| File | Change |
|------|--------|
| `src/components/Wallet/ClaimRewardsSection.tsx` | Add Valentine greeting banner after CardDescription (line 226-227) with Heart icon and pink gradient styling |
| `src/pages/Receipt.tsx` | Add Valentine decorations to ClaimReceipt header (line 79-85) and DonationReceipt header (line 240-246), plus a shareable Valentine footer before the action buttons |

Both updates use existing dependencies (framer-motion, lucide-react Heart icon) and are fully mobile-responsive with proper touch-friendly sizing.

