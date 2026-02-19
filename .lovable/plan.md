

# Add "Delete Only" Button to Spam Filter (No Ban)

## What's Needed

Currently the Spam Filter only has two bulk actions: "Hide" and "Delete & Ban". You want a third option: **Delete videos only** (without banning the users). This applies to all three filter tabs: Reported, Short, and Repetitive.

## Changes

### 1. New Database Function: `bulk_delete_videos_only`

Create a new RPC that deletes videos and all related data (likes, comments, watch_history, reward_transactions, etc.) but does **NOT** ban the users.

Parameters: `p_admin_id uuid, p_video_ids uuid[]`

Returns: `{ deleted_videos: number }`

### 2. UI: Add "Delete Only" Button

**File**: `src/components/Admin/tabs/VideosManagementTab.tsx`

Add a new button between "Hide" and "Delete & Ban":
- Orange/amber colored "Trash" icon button labeled "Xoa X video" (delete X videos)
- Shows a simpler confirmation dialog (no ban warning)
- On confirm, calls the new `bulk_delete_videos_only` RPC
- Refreshes the list after completion

### 3. New State & Dialog

Add state for `deleteOnlyOpen` and `deleteOnlyLoading`, plus a new `AlertDialog` for the "Delete Only" confirmation that clearly states videos will be permanently deleted but users will NOT be banned.

## File Changes Summary

| File | Change |
|------|--------|
| **New migration** | Create `bulk_delete_videos_only` RPC |
| `VideosManagementTab.tsx` | Add "Xoa Video" button, confirmation dialog, and handler calling new RPC |

