

# Security Action: Permanent Ban of Dung Luu / Joni Nguyen Fraud Ring

## Summary of Fraud

The investigation confirmed a coordinated multi-account farming operation:
- **Total accounts identified**: 21+ accounts across the fraud ring
- **Total CAMLY extracted**: ~6,490,000 CAMLY via wallet funnel
- **3 main receiving wallets** identified as endpoints
- **8 accounts still active** that need immediate banning

## Action Plan

### Step 1: Ban All Active Fraud Accounts
Execute database updates to permanently ban the 8 remaining active accounts, setting:
- `banned = true`
- `banned_at = now()`
- `ban_reason = 'Permanent ban: Dung Luu / Joni Nguyen coordinated fraud ring - multi-account farming'`
- `violation_level = 3`
- `pending_rewards = 0`
- `approved_reward = 0`

Target accounts:
1. **Luu Thi Lien** (f287a53a) - 909,000 approved + 123,000 pending
2. **Dung** (912c1dd6) - 500,000 approved + 50,000 pending
3. **Luu Lien** (491ceec1) - 54,000 approved
4. **Dung pham** (bc813955) - 50,000 approved
5. **Luu dung** (edaec4d3) - 20,000 approved
6. **Dam thi Dung** (04fefdf7) - 50,000 pending
7. **Nguyendung** (1fab2a80) - 50,000 pending
8. **Hanh Dung** (6a545452) - 0 rewards

### Step 2: Blacklist All Associated Wallets
Add all wallets from the fraud ring to the `blacklisted_wallets` table to prevent re-entry:
- `0xcBb90eE9776b54AD7B9508B15f7201c236694C2F` (joni - main funnel)
- `0x77dfA842a276E269f942d6bC89f2fF330D59eC7b` (LUUDUNG)
- `0x0CFc026492fA6fb729Ae9Ac67540da3b54fdb59B` (LUUDUNG alt)
- `0xdaae7ffff89a69948ecd0aad9d366dabcd9200fc` (Luu Thi Lien)
- `0x4cc23a2a18c1b22c3012c97a50af52a426195ccd` (Luu Lien)
- `0x1B4c41d6C8A5fab58EA88927a56D0472178Df909` (Dung pham)
- `0x709c6B45f8D2abAAe8E61c1d487336A43F79211b` (Dam thi Dung)
- All wallets from the IP cluster accounts (already banned but wallets not yet blacklisted)

### Step 3: Flag IP Hashes for Auto-Block
The `track-ip` Edge Function already auto-bans new signups from IPs with 2+ banned accounts. The banned accounts' IP hashes will automatically trigger this protection for any future re-entry attempts.

## Technical Implementation
- Use direct database UPDATE statements via the insert tool for banning
- Use INSERT statements for wallet blacklisting
- No code changes needed - the existing ban enforcement system handles the rest (BannedScreen, reward blocking, claim rejection)

