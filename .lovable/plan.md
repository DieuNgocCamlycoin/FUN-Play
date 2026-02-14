

# Update Profile Honor Board to Match Global FUN Play Parameters

## What Changes

The Honor Board on each user's personal profile page currently shows **10 metrics** (Posts, Friends, Reactions, NFTs, Comments, Shares, Claimable, Claimed, Total Reward, Total Money) with a gold/amber theme. It will be updated to align with the **global FUN Play Honor Board** style and parameters, while keeping it in its original position (top-right corner of the cover photo).

## Visual Changes

### Metrics Alignment
The profile Honor Board will show **user-specific versions** of the same 5 global parameters, plus 2 personal financial stats:

| # | Label | Source | Description |
|---|-------|--------|-------------|
| 1 | Posts | User's post count | Personal posts |
| 2 | Photos | User's photo uploads | Personal photos |
| 3 | Videos | User's video uploads | Personal videos |
| 4 | Friends | Channel subscriber count | Followers |
| 5 | Total Reward | total_camly_rewards | All-time CAMLY earned |
| 6 | Claimable | approved_reward | CAMLY waiting to claim |
| 7 | Total Money | Calculated from rewards | Estimated USD value |

### Style Update
- Switch from **gold/amber** theme to the **holographic cyan/purple** theme matching the global Honor Board (gradient border from #00E7FF to #7A2BFF to #FF00E5, white glassmorphism background)
- Use the same `StatPill` row style with icon + label + animated counter
- Crown icons in header matching global board

### Responsive Layout
- **Desktop (lg+)**: Positioned at top-right of cover photo, width 280px, 1-column stat pills
- **Mobile (<768px)**: Repositioned below the cover photo as a full-width card instead of absolute overlay (avoids overflow and tiny text on small screens), with a 2-column grid for stats to save vertical space

## Technical Details

### File: `src/components/Profile/ProfileHonorBoard.tsx`
- Replace the 10 stat items with 7 aligned metrics
- Update theme from amber/gold gradient to holographic cyan/purple gradient (matching `HonorBoardCard.tsx` style)
- Add responsive breakpoint logic:
  - On desktop: keep `absolute top-3 right-3` positioning on cover photo
  - On mobile: render as a relative card below the cover, full-width with 2-column grid
- Import and use `CounterAnimation` component for animated numbers (matching global board)
- Add video and photo count queries to `fetchHonorStats`

### File: `src/components/Profile/ProfileHeader.tsx`
- On mobile, move the `ProfileHonorBoard` component outside the cover photo container (render it below instead of inside the absolute-positioned cover)
- Use `useIsMobile()` hook to conditionally render placement

### Data Queries (in ProfileHonorBoard)
- Add query for user's video count: `supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", userId)`
- Add query for user's photo count: `supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("category", "photo")`
- Keep existing queries for posts, comments, profile rewards, likes, and channel subscribers

