

# Fix: Add Server-Side Security to Claim Edge Function

## Problem
The `claim-camly` edge function has NO server-side validation for:
1. **Banned status** -- a banned user can still claim by calling the API directly
2. **Avatar verification** -- unverified users can bypass the frontend gate
3. **Duplicate wallet** -- multiple accounts share the same wallet, allowing reward farming

User "Hoai An" exploits this with 2 accounts (`user_acac8b73` + `lehoaian2411`) sharing wallet `0x7407...6B0dA`, accumulating rewards on both and claiming from either.

## Changes

### 1. Edge Function: `claim-camly/index.ts`
Add server-side checks right after authentication (before any claim logic):

- **Banned check**: Query `profiles.banned` -- reject if `true`
- **Avatar verified check**: Query `profiles.avatar_verified` -- reject if `false`
- **Blacklisted wallet check**: Query `blacklisted_wallets` table -- reject if wallet is listed
- **Duplicate wallet check**: Query `profiles` for other accounts with the same `wallet_address` -- reject or warn if found

These 4 checks can be combined into a single query for efficiency:

```text
After auth validation:
  1. Fetch profile: banned, avatar_verified, wallet_address
  2. If banned -> reject "Tài khoản bị khóa"
  3. If !avatar_verified -> reject "Cần xác minh ảnh chân dung"
  4. If wallet != request wallet -> reject "Ví không khớp"
  5. Check blacklisted_wallets -> reject if found
  6. Check profiles count with same wallet -> warn/reject if > 1
```

### 2. No frontend changes needed
The frontend already has these checks -- this fix ensures they cannot be bypassed via direct API calls.

## Technical Details

Insert the following validation block in `claim-camly/index.ts` after line 57 (`userId = user.id`) and before line 59 (`const body = await req.json()`):

```typescript
// === SERVER-SIDE SECURITY CHECKS ===
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('banned, avatar_verified, wallet_address')
  .eq('id', user.id)
  .single();

if (profileError || !profile) {
  return jsonError('Không tìm thấy hồ sơ người dùng.');
}

if (profile.banned) {
  return jsonError('Tài khoản đã bị khóa. Không thể rút thưởng.');
}

if (!profile.avatar_verified) {
  return jsonError('Cần xác minh ảnh chân dung trước khi claim. Vui lòng vào Cài đặt hồ sơ.');
}
```

Then after parsing `walletAddress` from the request body (after line 77 wallet validation):

```typescript
// Verify wallet matches profile
if (profile.wallet_address?.toLowerCase() !== walletAddress.toLowerCase()) {
  return jsonError('Địa chỉ ví không khớp với hồ sơ. Vui lòng sử dụng ví đã đăng ký.');
}

// Check blacklisted wallet
const { data: blacklisted } = await supabaseAdmin
  .from('blacklisted_wallets')
  .select('id')
  .eq('wallet_address', walletAddress.toLowerCase())
  .limit(1)
  .maybeSingle();

if (blacklisted) {
  return jsonError('Ví này đã bị khóa. Không thể rút thưởng.');
}

// Check duplicate wallet (multiple accounts same wallet)
const { count: walletUserCount } = await supabaseAdmin
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .ilike('wallet_address', walletAddress);

if ((walletUserCount || 0) > 1) {
  return jsonError('Ví này được sử dụng bởi nhiều tài khoản. Vui lòng liên hệ admin.');
}
```

