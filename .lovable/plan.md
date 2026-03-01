

## Plan: Light Level Guide Table on Homepage

Create a new component `LightLevelGuide` that displays all 5 light levels in a visually rich, easy-to-understand card on the homepage.

### Component Design

A premium card with 5 rows, one per light level, showing:
- Emoji icon + Level name
- Light Score threshold
- Short description of what the level represents
- Visual gradient accent per level

| Level | Emoji | Threshold | Color Accent |
|-------|-------|-----------|-------------|
| Seed | 🌱 | 0+ | Emerald/Green |
| Sprout | 🌿 | 50+ | Cyan/Teal |
| Builder | 🌳 | 200+ | Violet/Purple |
| Guardian | 🛡️ | 500+ | Amber/Orange |
| Architect | 👑 | 1200+ | Gold/Yellow |

### Implementation Steps

1. **Create `src/components/FunMoney/LightLevelGuide.tsx`** - New standalone component with:
   - Glassmorphism card style matching project aesthetic
   - 5 level rows with gradient backgrounds, emoji, name, threshold, and description
   - Responsive design (stacks nicely on mobile)
   - Animated entrance using framer-motion

2. **Add to Homepage (`src/pages/Index.tsx`)** - Insert the guide above the video grid (after ProfileNudgeBanner, before ContinueWatching), visible to all users.

### Technical Details

- Uses existing `getLightLevelLabel`, `getLightLevelEmoji` from `pplp-engine.ts`
- Styled with Tailwind gradients matching `LightLevelBadge` color scheme
- Uses `framer-motion` for staggered row animations
- Card uses the project's glassmorphism pattern (`glass-card` or gradient borders)

