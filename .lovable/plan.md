

## Plan: Unified FUN Money System Report Dashboard

### What We're Building
A new comprehensive "System Report" tab in the Admin Dashboard that consolidates all FUN Money mint statistics into a single, easy-to-understand page. This combines data from PPLP scoring, mint engine, transparency, and platform activity into one unified view -- making it accessible for both admins and users.

### Data Sources
- **`get_fun_money_system_stats`** RPC - mint requests, action breakdown, top holders
- **`pplp-light-api?action=transparency`** - Light Score totals, level distribution
- **`pplp-light-api?action=epoch`** - Current epoch info
- **`get_admin_dashboard_stats`** RPC - platform stats (users, videos, activity)

### UI Layout (Single Page)

**Section 1: System Health Overview** (top cards row)
- Total Users | Total Light Score | Total FUN Minted | Active Mint Epoch | Scoring Rule Version

**Section 2: PPLP Scoring Pipeline Status** (info cards)
- Cron job schedule summary (build-features 02:00, detect-sequences 02:30, light-scores 4h, mint-epoch Mon 03:00)
- Current epoch period + status (draft/finalized)
- Anti-whale cap (3%) + min threshold (10)

**Section 3: Mint Flow Visualization** (charts)
- Pipeline diagram: Events → Features → Scoring → Mint (text-based)
- Level distribution pie chart (reuse from TransparencyDashboardTab)
- Action breakdown bar chart (reuse from FunMoneyStatsTab)
- Mint requests by status donut chart

**Section 4: Key Metrics Explanation** (educational cards)
- How Light Score works (formula summary in plain language)
- 5 Levels explained (Seed → Architect with thresholds)
- Multipliers explained (Consistency, Sequence, Integrity)
- Anti-Whale + No-Ego policy summary

### Implementation Steps

**1. Create `src/hooks/useSystemReport.ts`**
- Combines calls to `useAdminFunMoneyStats`, `useTransparencyStats`, and epoch data
- Returns unified typed data object

**2. Create `src/components/Admin/tabs/SystemReportTab.tsx`**
- Single comprehensive page with all 4 sections
- Uses existing recharts components
- Includes educational "How it works" cards for user understanding
- Mobile-responsive grid layout

**3. Register in admin navigation**
- Add `"system-report"` to `AdminSection` type
- Add nav item with `FileBarChart` icon and label "Báo Cáo Tổng Hợp"
- Add route case in `UnifiedAdminDashboard.tsx`

### Technical Details
- Reuses existing hooks (`useAdminFunMoneyStats`, `useTransparencyStats`) plus direct edge function calls
- All scoring config values read from `SCORING_RULES_V1` constant (single source of truth)
- No new database tables or migrations needed
- No individual user data exposed in the report (follows No-Ego policy)
- Vietnamese language for all labels

