

# Add Daily Withdrawal Limit Display + Friendly Daily Limit Notification

## Changes

### File: `src/components/Wallet/ClaimRewardsSection.tsx`

#### 1. Fetch today's claimed amount
- Add `dailyClaimed` to the stats state
- In `fetchStats`, query `daily_claim_records` for today's date and the current user to get `total_claimed`
- Store the value in state

#### 2. Add daily limit info to the Stats Grid or Info Notes
- Add a new info line in the bottom info section showing: "Gioi han rut hang ngay: 500,000 CAMLY" with a progress indicator showing how much has been claimed today (e.g., "Da rut hom nay: 123,000 / 500,000 CAMLY")
- Use a `Clock` icon with blue color for the daily limit line

#### 3. Disable Claim button when daily limit reached
- If `dailyClaimed >= 500,000`, disable the Claim button
- Change button text to "Da dat gioi han hom nay"
- When user clicks (or taps on disabled state), show the friendly congratulatory toast

#### 4. Show friendly toast on claim attempt when limit reached
- Instead of letting the edge function return an error, pre-check the daily limit in `ClaimRewardsSection` before opening the modal
- Show toast: "Chuc mung! Ban da dat gioi han rut 500,000 CAMLY trong ngay. Vui long quay lai ngay mai!"

---

## Technical Details

| Change | File | What |
|--------|------|------|
| Add `dailyClaimed` state + fetch | `ClaimRewardsSection.tsx` | Query `daily_claim_records` for today |
| Daily limit progress in info section | `ClaimRewardsSection.tsx` | Show "Da rut hom nay: X / 500,000 CAMLY" |
| Disable button when limit reached | `ClaimRewardsSection.tsx` | Prevent opening modal, show friendly toast |
| Add daily limit info line | `ClaimRewardsSection.tsx` | New line with Clock icon in info notes |

