

# Admin Panel Upgrade: Bulk Delete & Ban, Hide Fix, Spam Tracing, Reward Avatar Links

## 1. New RPC: `bulk_delete_videos_and_ban_users`

Create a single database function that accepts an array of video IDs and performs all operations atomically:
- Look up distinct `user_id` values from the video IDs
- Delete related records: likes, comments, watch_history, reward_transactions for those videos
- Delete the videos themselves
- Ban each user via the existing `ban_user_permanently` logic (set banned=true, zero rewards, blacklist wallets, create reward_bans)

This replaces N individual calls with 1 RPC call.

**New migration SQL**: Creates `bulk_delete_videos_and_ban_users(p_admin_id uuid, p_video_ids uuid[])` function.

---

## 2. Spam Filter: Add Checkboxes + "Delete & Ban" Button

**File**: `src/components/Admin/tabs/VideosManagementTab.tsx` (SpamFilterContent)

Current state: Spam filter already has checkboxes and a "Hide" bulk button. Changes:
- Add a **"Delete & Ban"** button (red, with Shield icon) next to the existing "Hide" button in the toolbar
- When clicked, show a confirmation dialog listing how many videos and unique users will be affected
- On confirm, call the new `bulk_delete_videos_and_ban_users` RPC
- Refresh the list after completion

---

## 3. Fix Hide Button Logic

**File**: `src/components/Admin/tabs/VideosManagementTab.tsx` (SpamFilterContent, `handleBulkHide`)

Current code updates `is_hidden = true` via Supabase client, which should work. However, videos may still appear on the homepage because some feeds filter with `.or('is_hidden.is.null,is_hidden.eq.false')` -- this is already correct and will exclude hidden videos.

The real fix needed: after hiding, also set `approval_status = 'rejected'` so the video is excluded by both the `is_hidden` filter AND the `approval_status = 'approved'` filter. This ensures immediate removal from all feeds.

Update `handleBulkHide` to:
```
.update({ is_hidden: true, approval_status: 'rejected' })
```

---

## 4. Owner Column + Quick Ban in Short & Duplicate Filters

**File**: `src/components/Admin/tabs/VideosManagementTab.tsx` (SpamFilterContent)

Changes to the spam filter table:
- Fetch `profiles` data (username, display_name, avatar_url) alongside video data by joining on `user_id`
- Add an **"Owner"** column after the Video column showing the user's avatar + name
- Add a **"Quick Ban"** button (small, red Shield icon) in each row
- On hover over the user's name, show a **Tooltip** displaying:
  - How many short videos (duration < 90s) this user has uploaded
  - Total videos by this user
  - This requires a quick count query or pre-aggregation when fetching spam videos

For the tooltip data, fetch video counts per user_id in the same query using a subquery or do a secondary grouped query.

---

## 5. Reward Approval: Avatar Links to User Channel

**File**: `src/components/Admin/tabs/RewardApprovalTab.tsx`

Current state: Avatar is a plain `<Avatar>` component with no click behavior.

Change: Wrap the Avatar in an `<a>` tag that opens `https://official-funplay.lovable.app/{username}` in a new tab when clicked. Add a cursor-pointer style.

```text
<a href={`https://official-funplay.lovable.app/${user.username}`} target="_blank" rel="noopener noreferrer">
  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary">
    ...
  </Avatar>
</a>
```

---

## File Changes Summary

| File | Change |
|------|--------|
| **New migration** | Create `bulk_delete_videos_and_ban_users` RPC function |
| `src/components/Admin/tabs/VideosManagementTab.tsx` | Add "Delete & Ban" button, fix Hide logic, add Owner column with tooltip + Quick Ban |
| `src/components/Admin/tabs/RewardApprovalTab.tsx` | Make Avatar clickable to open user channel in new tab |

All changes apply equally to web and mobile since these are admin panel components rendered responsively.

