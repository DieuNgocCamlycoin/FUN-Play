

# Fix: Disable Claim Button During On-Chain Transfer + Daily Limit Notification

## Problems

### 1. Claim Button Not Disabled When Reopening Modal During Pending Transaction
The `claiming` state correctly disables the button during the current session, but if the user closes the modal and reopens it while the on-chain transaction is still processing, the button becomes active again. The edge function does check for pending claims (line 210-225), but the UI doesn't pre-check this when the modal opens, allowing the user to click "Claim" and only then see an error.

### 2. Daily Limit Message Shown as Error Instead of Friendly Notification
When the user has already claimed 500,000 CAMLY in a day and presses Claim again, the edge function returns a 400 error with the message. The client catches this in the error handler and shows it as a red "destructive" toast, which feels like something went wrong rather than a congratulatory message.

---

## Changes

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

#### 1. Check for pending claims on modal open
Add a `hasPendingClaim` state. When the modal opens, query `claim_requests` for any `status = 'pending'` record for the current user. If found, set `hasPendingClaim = true`.

- Show a yellow info alert: "Giao dich dang xu ly tren blockchain. Vui long doi hoan tat..."
- Disable the Claim button when `hasPendingClaim` is true
- Subscribe to realtime changes on `claim_requests` to auto-detect when the pending claim completes (status changes to 'success' or 'failed'), then refresh data and re-enable the button

#### 2. Check daily claim limit before calling edge function
Before invoking the `claim-camly` edge function in `handleClaim`:
- Query `daily_claim_records` for today's date and current user
- If `total_claimed >= 500000`, show a **friendly (non-destructive) toast**:
  - Title: "Chuc mung, ban da claim thanh cong!"
  - Description: "Ban da dat gioi han rut 500,000 CAMLY trong ngay. Vui long quay lai ngay mai de rut tiep nhe!"
- Return early without calling the edge function

#### 3. Detect daily limit error from edge function response
In the `handleClaim` catch block, detect the daily limit message from the edge function response and show a friendly toast instead of a destructive one:
- Check if error message contains "gioi han rut" or "quay lai ngay mai"
- If so, show a success-style toast with the congratulatory message instead of the red error toast

#### 4. Disable button text update
When `hasPendingClaim` is true, change the button text to show a spinner + "Dang xu ly giao dich..." to make it clear the system is working.

---

## Summary

| Change | What |
|--------|------|
| Add `hasPendingClaim` state + query on modal open | Prevents re-clicking while on-chain tx is processing |
| Realtime subscription on `claim_requests` | Auto-refreshes when pending claim completes |
| Pre-check daily limit before calling edge function | Shows friendly message without wasting an API call |
| Detect daily limit error in catch block | Shows congratulatory toast instead of red error |
| Update button text for pending state | Clear UX feedback that transaction is in progress |

