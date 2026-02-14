

# Fix Claim CAMLY Chat Messages and Notifications

## Current Status

After investigating the database, I found that the code changes from the previous update are correct but the edge function needs to be redeployed. Evidence:
- 0 donation_transactions with context_type "claim" (insert never executed)
- 0 chat messages from the Treasurer (chat never created)
- Existing notifications still have BSCScan links (old code)

Additionally, the Treasurer profile needs a proper display name and avatar for the Celebration Card to render nicely.

## Changes Required

### 1. Redeploy `claim-camly` edge function
The code is already correct -- it just needs a fresh deployment to take effect. No code changes needed.

### 2. Update Treasurer profile data
The Treasurer profile currently shows `display_name: "treasurer@funplay.system"` and `username: "user_f0f0f0f0"` with no avatar. This will cause the Celebration Card to display ugly fallback text. Update to:
- `display_name`: "Fun Pay Treasurer"
- `username`: "funpay_treasurer"
- `avatar_url`: A suitable system avatar (e.g., the platform logo)

### 3. Verify ChatDonationCard handles claim context
The `ChatDonationCard` component fetches sender/receiver data from `donation_transactions` joins. The card title says "CHUC MUNG TANG THUONG THANH CONG" (Gift Success). For claims, this should say something more appropriate like "CLAIM CAMLY THANH CONG". This requires a small frontend update to detect `context_type: "claim"` from the metadata.

## Technical Details

### File: `supabase/functions/claim-camly/index.ts`
- No code changes needed -- the current code is correct
- Redeploy the function

### Database: Update Treasurer profile
```sql
UPDATE profiles 
SET display_name = 'Fun Pay Treasurer', 
    username = 'funpay_treasurer'
WHERE id = 'f0f0f0f0-0000-0000-0000-000000000001';
```

### File: `src/components/Chat/ChatDonationCard.tsx`
- Add detection of `context_type` from metadata to customize the card title for claim vs gift transactions
- When `context_type = "claim"`, show title "CLAIM CAMLY THANH CONG" instead of "CHUC MUNG TANG THUONG THANH CONG"

## Execution Order
1. Update Treasurer profile in database
2. Redeploy the edge function
3. Update ChatDonationCard for claim context display
4. Test with a claim transaction

