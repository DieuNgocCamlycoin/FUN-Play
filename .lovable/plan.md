

## Plan: Transparency Dashboard Tab

### What We're Building
A new "PPLP Transparency" tab in the Admin Dashboard showing system-wide Light Score and FUN Money statistics without any individual user data. This follows the No-Ego policy.

### Data Source
The existing `pplp-light-api` edge function already has a `transparency` action returning:
- `total_light` - Total Light Score across system
- `total_users_with_light` - Users with Light > 0
- `total_fun_minted` - Total FUN minted from finalized epochs
- `level_distribution_pct` - % breakdown by level (seed/sprout/builder/guardian/architect)
- `total_sequences_completed` - Mentor chains etc.
- `active_rule` - Current scoring rule version

### Implementation Steps

**1. Create hook `src/hooks/useTransparencyStats.ts`**
- Calls `pplp-light-api?action=transparency` via `supabase.functions.invoke`
- Returns typed data with loading state

**2. Create component `src/components/Admin/tabs/TransparencyDashboardTab.tsx`**
- Top row: 4 stat cards (Total Light, Total FUN Minted, Users with Light, Sequences Completed)
- Middle: Pie/Bar chart showing level distribution (Seed/Sprout/Builder/Guardian/Architect %)
- Bottom: Active rule version info card
- No individual user data shown anywhere

**3. Register in admin navigation**
- Add `"transparency"` to `AdminSection` type in `UnifiedAdminLayout.tsx`
- Add nav item with `Sparkles` icon and label "PPLP Transparency"
- Add route case in `UnifiedAdminDashboard.tsx` with header text

### Technical Details
- Uses `recharts` PieChart for level distribution visualization
- Calls edge function: `supabase.functions.invoke('pplp-light-api', { body: null, headers: {} })` with query param `action=transparency`
- All data is system-aggregate only, zero individual exposure

