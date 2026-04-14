

# Thay thế FUNMoney v1.2.1 bằng FUNMoneyMinter Contract

## Tổng quan thay đổi

Contract mới **FUNMoneyMinter** đơn giản hóa đáng kể quy trình mint:

```text
CŨ (v1.2.1):  lockWithPPLP (3 chữ ký EIP-712) → activate (user trả gas) → claim (user trả gas)
MỚI (Minter):  mintValidatedAction (1 bước, authorizedMinter gọi) → token về thẳng user
```

Không còn 3 bước, không còn EIP-712 multisig, không còn user trả gas. Backend gọi `mintValidatedAction` → 99% user / 1% platform tự động on-chain.

## Kế hoạch triển khai

### Step 1: Lưu contract mới & cập nhật ABI + config

- Copy `FUNMoneyMinter.sol` vào `src/lib/fun-money/contracts/`
- Cập nhật `web3-config.ts`:
  - Thay `FUN_MONEY_ABI` bằng ABI mới (`mintValidatedAction`, `mintValidatedActionLocked`, `releaseLockedGrant`, `previewSplit`, `getLockedGrants`)
  - Xóa các hàm cũ: `lockWithPPLP`, `activate`, `claim`, `nonces`, `isAttester`, `alloc`, governance functions
  - Cập nhật contract address (sẽ cần deploy mới)
  - Xóa `activateTokens()`, `claimTokens()`, `getAllocation()` — không còn dùng

### Step 2: Loại bỏ EIP-712 multisig signing

Xóa hoặc deprecate các file không còn cần:
- `eip712-signer.ts` — không còn cần EIP-712 signatures
- `pplp-multisig-config.ts` — không còn 3/3 multisig
- `pplp-multisig-helpers.ts` — helper cho multisig
- `pplp-multisig-types.ts` — types cho multisig
- `pplp-nonce-refresh.ts` — nonce management cho EIP-712

### Step 3: Đơn giản hóa mint flow

- `contract-helpers.ts`: Thay `validateBeforeMint()` — chỉ cần kiểm tra `authorizedMinters[sender]` thay vì attester + nonce + EIP-712
- `useMintSubmit.ts`: Gọi `mintValidatedAction(actionId, user, totalMint, validationDigest)` thay vì `lockWithPPLP` + 3 signatures
- `useAttesterSigning.ts`: Không còn cần — authorizedMinter gọi trực tiếp, không cần 3 chữ ký riêng

### Step 4: Cập nhật UI components

- **`TokenLifecyclePanel.tsx`**: Không còn 3 trạng thái LOCKED/ACTIVATED/FLOWING. Thay bằng: MINTED (instant) hoặc LOCKED (time-release) → RELEASED
- **`ClaimGuide.tsx`**: Cập nhật FAQ — user không còn cần tBNB cho activate/claim
- **`MintableCard`**: Xóa cảnh báo tBNB, đơn giản hóa flow
- **Admin pages** (`/gov-sign`): Chuyển từ multisig signing sang authorized minter flow — admin chỉ cần gọi `mintValidatedAction`

### Step 5: Cập nhật edge functions

- `mint-from-action`: Tích hợp gọi contract `mintValidatedAction` thay vì tạo multisig queue
- Xóa logic auto-route-multisig trigger (không còn multisig)

### Step 6: Hỗ trợ Locked Grants (optional vesting)

- Thêm UI cho `getLockedGrants(user)` — hiển thị locked grants và nút `releaseLockedGrant(index)` khi đã đến `releaseAt`
- Đây là tính năng mới thay thế cơ chế activate/claim cũ

## Files affected

**Xóa/Deprecate:**
- `src/lib/fun-money/eip712-signer.ts`
- `src/lib/fun-money/pplp-multisig-config.ts`
- `src/lib/fun-money/pplp-multisig-helpers.ts`
- `src/lib/fun-money/pplp-multisig-types.ts`
- `src/lib/fun-money/pplp-nonce-refresh.ts`

**Thay đổi lớn:**
- `src/lib/fun-money/web3-config.ts` — ABI + helpers mới
- `src/lib/fun-money/contract-helpers.ts` — mint flow mới
- `src/hooks/useMintSubmit.ts` — gọi `mintValidatedAction`
- `src/hooks/useAttesterSigning.ts` — đơn giản hóa hoặc xóa
- `src/components/FunMoney/TokenLifecyclePanel.tsx` — UI mới
- `src/components/FunMoney/ClaimGuide.tsx` — cập nhật docs
- `src/components/Multisig/AdminMintPanel.tsx` — authorized minter flow
- `supabase/functions/mint-from-action/index.ts` — tích hợp contract mới

**Thêm mới:**
- `src/lib/fun-money/contracts/FUNMoneyMinter.sol`

## Giữ nguyên
- PPLP scoring engine (multiplicative formula, zero-kill rule)
- 99/1 split (giờ được enforce cả on-chain lẫn off-chain)
- Action pipeline (submit → proof → validate → mint)
- Attendance system
- Database tables

