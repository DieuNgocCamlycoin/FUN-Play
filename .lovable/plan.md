
# Smart Routing + PPLP Light Score Upgrade

## Overview
This plan implements two major systems: (1) SEO-friendly URL routing with slugs for users and videos, and (2) a smart Light Score system integrated into profiles with diamond visualization, escrow optimization, and repentance mechanics.

---

## Part 1: Smart Routing System

### 1.1 Database Migration
- Add `slug` column (TEXT, UNIQUE, nullable) to `videos` table
- Create a `generate_video_slug()` database function that:
  - Converts Vietnamese titles to ASCII (removes diacritics)
  - Lowercases, replaces spaces/special chars with hyphens
  - Checks for duplicates per user, appends sequential number if needed
- Create a trigger `before INSERT` on `videos` to auto-generate slug from title
- Backfill existing videos with slugs using a one-time SQL update

### 1.2 Slug Utility (`src/lib/slugify.ts`)
- Create a `slugify()` function for client-side slug generation
- Handle Vietnamese diacritics removal (a-z normalization)
- Strip special characters, collapse multiple hyphens

### 1.3 Route Updates (`src/App.tsx`)
- Add route: `/c/:username/video/:slug` pointing to a new `VideoBySlug` page
- Keep `/watch/:id` for backward compatibility

### 1.4 VideoBySlug Page (`src/pages/VideoBySlug.tsx`)
- Resolve `username` + `slug` to video ID via database query
- Redirect to `Watch` component or render inline
- Handle 404 for invalid slugs

### 1.5 Share URL Updates
- Update `shareUtils.ts` to generate `/c/username/video/slug` format links
- Update share buttons across video cards and watch page

---

## Part 2: PPLP Light Score System

### 2.1 Database Migration
- Add `light_score` (INTEGER, DEFAULT 0) to `profiles` table
- Add `last_light_score_update` (TIMESTAMPTZ, nullable) to `profiles`
- Add `light_score_details` (JSONB, nullable) to `profiles` for pillar breakdown

### 2.2 Light Score Calculation RPC (`calculate_user_light_score`)
- Create a database function that calculates light_score for a given user based on:
  - Profile completeness (avatar, display_name, bio) - Truth pillar
  - Avatar verified status - Trust pillar
  - Account age - Stability
  - Content quality (approved videos vs flagged) - Service pillar
  - Community engagement (comments, likes given/received) - Healing pillar
  - Positive content keywords in video titles (Request, Gratitude, Healing, Peace) - PPLP Pillars bonus
- Formula: `light_score = weighted_pillars - suspicious_score_penalty`
- Store pillar breakdown in `light_score_details` JSONB

### 2.3 Repentance Mechanism
- In the RPC: if user has completed profile (avatar + real name + bio) AND has positive engagement, reduce effective suspicious_score by up to 50%
- This creates a path for flagged users to rehabilitate

### 2.4 Cron Job (every 4 hours)
- Create edge function `recalculate-light-scores` that batch-updates all active users' light_score
- Schedule via pg_cron every 4 hours
- Also callable manually via "Update Reputation" button on profile

### 2.5 Diamond Badge Update (`DiamondBadge.tsx`)
- Update color logic based on light_score vs suspicious_score balance:
  - **Sparkling White** (#FFFFFF with glow): `light_score >= 80` AND `suspicious_score <= 1` (PPLP verified)
  - **Blue** (#3B82F6): `light_score >= 60` (actively sharing)
  - **Cyan** (#00E7FF): `light_score >= 40`
  - **Green** (#22C55E): `light_score >= 20`
  - **Gray** (#9CA3AF): Banned
  - **Black** (#1F2937): `suspicious_score >= 5` or `violation_level >= 3`
  - **Silver** (#E5E7EB): Default/new user

### 2.6 Dynamic Escrow Period
- Update `award-camly` edge function escrow logic:
  - `light_score >= 80`: 12 hours escrow
  - `light_score >= 60`: 24 hours escrow
  - Default: 48 hours escrow
- Fetch user's light_score before setting escrow_release_at

### 2.7 UI: "Update Reputation" Button
- Add button on Profile page that calls the RPC to recalculate light_score
- Rate-limited to once per hour per user
- Show light_score with pillar breakdown in a tooltip or expandable section

### 2.8 Hook Updates (`useLightActivity.ts`)
- Fetch `light_score` from profiles table instead of calculating client-side
- Use server-side value as source of truth

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/slugify.ts` | Vietnamese-aware slug generator |
| `src/pages/VideoBySlug.tsx` | Route handler for `/c/:username/video/:slug` |
| `supabase/functions/recalculate-light-scores/index.ts` | Cron job for batch light_score updates |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/c/:username/video/:slug` route |
| `src/components/Profile/DiamondBadge.tsx` | New PPLP color logic with white diamond |
| `src/lib/shareUtils.ts` | Generate slug-based video URLs |
| `src/hooks/useLightActivity.ts` | Use server-side light_score |
| `supabase/functions/award-camly/index.ts` | Dynamic escrow based on light_score |
| Profile/Watch components | Share URL updates, reputation button |

### Database Changes
| Table | Column | Type |
|-------|--------|------|
| `profiles` | `light_score` | INTEGER DEFAULT 0 |
| `profiles` | `last_light_score_update` | TIMESTAMPTZ |
| `profiles` | `light_score_details` | JSONB |
| `videos` | `slug` | TEXT UNIQUE |

### Cron Schedule
- `recalculate-light-scores`: Every 4 hours (`0 */4 * * *`)
- Uses `pg_cron` + `pg_net` to call the edge function

### Performance Notes
- Light score only recalculated every 4 hours or on manual request (not real-time)
- Video slug generated once on upload (trigger), not recalculated
- Existing `/watch/:id` routes remain functional for backward compatibility
