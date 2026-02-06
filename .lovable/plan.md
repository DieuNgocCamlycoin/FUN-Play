

# Plan: Build & Bounty Feature for FUN Play

## Overview

This feature adds a **Bounty system** where community members can submit contributions (bug reports, feature suggestions, content, etc.) and admins can review and reward them with CAMLY tokens. When rewarded, the CAMLY is automatically added to the user's profile rewards and tracked in `reward_transactions`.

---

## What Needs to Be Built

### 1. Database: `bounty_submissions` Table

Create a new table to store bounty submissions:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (nullable) | FK to profiles, null = anonymous |
| title | text | Submission title |
| description | text | Detailed description |
| category | text | bug_report, feature_request, content, translation, other |
| contact_info | text (nullable) | For anonymous submissions |
| status | text | pending, approved, rejected, rewarded |
| reward_amount | numeric | CAMLY amount awarded (default 0) |
| admin_note | text (nullable) | Admin feedback |
| approved_by | uuid (nullable) | Admin who reviewed |
| approved_at | timestamptz (nullable) | When reviewed |
| created_at | timestamptz | Auto timestamp |
| updated_at | timestamptz | Auto timestamp |

RLS Policies:
- Users can view their own submissions
- Users can insert submissions (authenticated)
- Admins can view all submissions
- Admins can update submissions (for approval/reward)

### 2. Admin Tab: `BountyApprovalTab.tsx`

A new tab inside the **Rewards Management** section of Admin Dashboard with:

- **Stats cards**: Total submissions, Pending, Rewarded count, Total CAMLY given
- **Submission list** with search/filter by status and category
- Each submission card shows: title, description, category badge, user info (or "Anonymous"), creation date
- **Action buttons**: Approve, Reject, Reward (with amount input)
- When rewarding:
  - Updates `bounty_submissions` status to "rewarded"
  - Adds reward_amount to user's `total_camly_rewards` and `pending_rewards` in profiles
  - Creates a `reward_transactions` record with `reward_type: 'BOUNTY'`
  - Shows warning if submission is anonymous (no user_id)

### 3. User Submission Page: `/bounty`

A public-facing page where logged-in users can:
- View available bounty categories
- Submit a new bounty contribution (title, description, category)
- See their past submissions and statuses
- See reward amounts for completed bounties

### 4. Navigation Updates

- Add "Bounty" link to the sidebar/collapsible sidebar
- Add "Bounty" to mobile bottom nav or mobile drawer
- Add bounty tab to admin rewards management

---

## Technical Details

### Database Migration SQL

```sql
-- Create bounty_submissions table
CREATE TABLE public.bounty_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  contact_info text,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  admin_note text,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own bounty submissions"
  ON public.bounty_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all bounty submissions"
  ON public.bounty_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can submit
CREATE POLICY "Users can create bounty submissions"
  ON public.bounty_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any submission
CREATE POLICY "Admins can update bounty submissions"
  ON public.bounty_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert reward_transactions for bounty
CREATE POLICY "Admins can insert bounty reward transactions"
  ON public.reward_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update profiles for bounty rewards
CREATE POLICY "Admins can update profiles for rewards"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/Admin/tabs/BountyApprovalTab.tsx` | Admin review/reward bounty submissions |
| `src/pages/Bounty.tsx` | User-facing bounty submission page |

### Modified Files

| File | Change |
|------|--------|
| `src/components/Admin/tabs/RewardsManagementTab.tsx` | Add "Bounty" tab |
| `src/App.tsx` | Add `/bounty` route |
| `src/components/Layout/CollapsibleSidebar.tsx` | Add Bounty nav link |
| `src/components/Layout/Sidebar.tsx` | Add Bounty nav link |
| `src/components/Layout/MobileDrawer.tsx` | Add Bounty nav link |

### Reward Flow (When Admin Clicks "Reward")

```text
Admin enters reward amount
       |
       v
Update bounty_submissions (status='rewarded', reward_amount, approved_by, approved_at)
       |
       v
Check: Does submission have user_id?
       |
  YES  |  NO --> Show warning "Anonymous submission, send manually via contact_info"
       |
       v
Fetch user profile (total_camly_rewards, pending_rewards)
       |
       v
Update profile:
  - total_camly_rewards += reward_amount
  - pending_rewards += reward_amount
       |
       v
Insert reward_transactions:
  - user_id, amount, reward_type='BOUNTY', status='success'
  - approved=false, tx_hash='BOUNTY_{timestamp}_{id}'
       |
       v
Show success toast
```

### Bounty Categories

| Category | Label (Vietnamese) | Icon |
|----------|-------------------|------|
| bug_report | Bao Loi | Bug |
| feature_request | De Xuat Tinh Nang | Lightbulb |
| content | Dong Gop Noi Dung | FileText |
| translation | Dich Thuat | Languages |
| other | Khac | HelpCircle |

---

## Expected Results

1. Users can submit bounty contributions from `/bounty` page
2. Admins see a new "Bounty" tab in Rewards Management with pending submissions
3. When admin rewards a bounty, CAMLY automatically adds to user's total and pending rewards
4. Reward appears in user's Reward History with type "BOUNTY"
5. Anonymous submissions show a warning -- admin must send manually
6. Full tracking via `reward_transactions` table
