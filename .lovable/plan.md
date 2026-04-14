

# Build Founder Dashboard for Camly / Bé Ly

## Summary

Create a dedicated Founder Dashboard page accessible only to the owner role, consolidating 7 panels from the spec. Most data already exists across existing hooks — the main work is building the UI and adding a few new queries.

## Data Source Mapping

| Panel | Data Source | Status |
|-------|-----------|--------|
| 1. Overview | `useAdminStatistics` + `useAdminFunMoneyStats` + `useTransparencyStats` | ✅ Existing |
| 2. User Insights | `useAdminStatistics` (topEarners) + new RPC for trust distribution, streaks, flagged users | ⚠️ Partial |
| 3. PPLP Analytics | `get-light-profile` pillar data + new RPC for system-wide pillar averages | ⚠️ Need new RPC |
| 4. Anti-Fake Monitor | `useAdminManage` (walletGroups, suspicion scores) | ✅ Existing |
| 5. Event & Love House | New RPC for event stats, attendance rates | ⚠️ Need new RPC |
| 6. Economy Flow | `useAdminFunMoneyStats` (dailyMints, actionBreakdown) + `useTransparencyStats` | ✅ Mostly existing |
| 7. Real-Time Alerts | New — simple anomaly detection from existing data | ⚠️ New logic |

## Plan

### Step 1: Database — create `get_founder_dashboard_stats` RPC
Single RPC that returns:
- System-wide pillar averages (from `pplp_validations`)
- Trust level distribution (from `profiles`)
- Event/attendance stats (from `events` + `attendance`)
- Flagged user count, velocity alerts
- Top Light Score users, fastest growing users

### Step 2: Create `useFounderDashboard` hook
Combines the new RPC with existing hooks (`useAdminFunMoneyStats`, `useTransparencyStats`, `useAdminStatistics`).

### Step 3: Build `FounderDashboardPage.tsx`
A standalone page at `/founder` (owner-only), with 7 collapsible panels:
1. **Overview** — KPI cards (Total Light, FUN Minted, Active Users, Validation Rate)
2. **User Insights** — Top users table, trust distribution pie chart, streak leaders
3. **PPLP Analytics** — Radar chart for 5 pillars, weakest/strongest indicators
4. **Anti-Fake Monitor** — Alert cards for duplicates, velocity, spam
5. **Event & Love House** — Event list with participation stats
6. **Economy Flow** — Area chart for mint over time, distribution breakdown
7. **Real-Time Alerts** — Alert feed from anomaly thresholds

### Step 4: Add route and navigation
- Add `/founder` route (owner-only)
- Or add as a new section `"founder"` in `UnifiedAdminLayout` visible only to owners

## Files

**New:**
- `src/pages/FounderDashboard.tsx` — main page with 7 panels
- `src/hooks/useFounderDashboard.ts` — data aggregation hook

**Modified:**
- `src/App.tsx` — add `/founder` route
- `src/components/Admin/UnifiedAdminLayout.tsx` — add sidebar link (owner-only)
- `src/pages/UnifiedAdminDashboard.tsx` — add section case

**Migration:**
- `get_founder_dashboard_stats` RPC function

