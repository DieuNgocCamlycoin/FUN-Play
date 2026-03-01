

## Plan: Public Transparency Page at `/transparency`

### What We're Building
A public-facing page at `/transparency` accessible to all users (no login required) that displays the same aggregate PPLP ecosystem stats currently in the admin dashboard. Includes educational content explaining the Light Score system and No-Ego philosophy.

### Implementation

**1. Create `src/pages/Transparency.tsx`**
- Reuses `useTransparencyStats` hook (already works without auth since the `transparency` action is public)
- Sections:
  - Hero banner with title "FUN Play Transparency" and philosophy tagline
  - 4 stat cards (Total Light, FUN Minted, Active Users, Sequences) — same data as admin tab
  - Level distribution pie chart (Seed→Architect)
  - "How It Works" educational cards explaining: Light Score basics, 5 Levels, No-Ego policy, Anti-Whale cap
  - Active scoring rule version
- Responsive layout, Vietnamese labels
- Back navigation to home

**2. Register route in `src/App.tsx`**
- Add `/transparency` route with lazy-loaded `Transparency` page
- Place before dynamic `/:username` catch-all route

### Key Details
- No new database changes needed — reuses existing `pplp-light-api` transparency endpoint
- No auth required — the transparency action returns only aggregate data
- Zero individual user data exposed (follows No-Ego policy)

