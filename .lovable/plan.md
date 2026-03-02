

# Plan: Tích hợp Multisig 3-of-3 (WILL + WISDOM + LOVE)

## Phân tích hiện trạng

Dự án hiện có hệ thống mint FUN Money **single-sig** (1 attester ký, admin submit). Cần nâng cấp lên **multisig 3-of-3** theo guide, với bảng `pplp_mint_requests` riêng, GOV Groups config, và UI cho Attester/Admin.

Các thành phần đã có sẵn và tái sử dụng được:
- EIP-712 signer (`src/lib/fun-money/eip712-signer.ts`)
- Contract helpers & ABI (`src/lib/fun-money/contract-helpers.ts`, `web3-config.ts`)
- Wagmi/AppKit provider đã cấu hình trong `App.tsx`

## Các bước triển khai

### 1. Database Migration - Tạo bảng `pplp_mint_requests`

Tạo bảng mới với đầy đủ cột theo guide (Section 5): `multisig_signatures` (JSONB), `multisig_completed_groups` (TEXT[]), `multisig_required_groups` (TEXT[]), status flow `pending_sig → signing → signed → submitted → confirmed`. Kèm RLS policies (user chỉ xem request mình, attester xem request đang ký) và bật Realtime.

### 2. PPLP Multisig Config - `src/lib/fun-money/pplp-multisig-config.ts`

File config chứa:
- GOV Groups (WILL/WISDOM/LOVE) với danh sách 11 địa chỉ ví và tên
- Helper functions: `getGroupForAddress()`, `isAttesterAddress()`, `getAttesterName()`
- Constants: `REQUIRED_GROUPS`, `CONTRACT_ADDRESS`, `EIP712_DOMAIN`

### 3. PPLP Types - `src/lib/fun-money/pplp-multisig-types.ts`

Interfaces cho `MultisigSignature`, `MultisigSignatures`, `PPLPMintRequest`, status enum.

### 4. Edge Function - `supabase/functions/pplp-mint-fun/index.ts`

Xử lý POST request tạo mint request:
- Validate user (auth, not banned, daily cap 2/ngày)
- Validate light actions (eligible, mint_status = approved)
- Tính amount, tạo evidence hash, lưu nonce on-chain
- Insert vào `pplp_mint_requests` với status `pending_sig`
- Platform ID = `fun_play`

### 5. Frontend Hook - `src/hooks/useAttesterSigning.ts`

Hook cho GOV Attester:
- Detect wallet address → xác định group (WILL/WISDOM/LOVE)
- Load pending requests cần ký (Realtime subscription)
- `signRequest()`: Tạo EIP-712 typed data, ký bằng wagmi signer, lưu signature vào `multisig_signatures` JSONB
- Auto-update status: `pending_sig → signing` (khi có 1-2 chữ ký), `signing → signed` (đủ 3/3)

### 6. Frontend Hook - `src/hooks/useMintSubmit.ts`

Hook cho Admin submit on-chain:
- Load requests có status `signed` (đủ 3 chữ ký)
- `verifyNonce()`: So sánh nonce DB vs on-chain
- `submitMint()`: Gọi `lockWithPPLP(user, action, amount, evidenceHash, [sig_will, sig_wisdom, sig_love])`
- Update status: `signed → submitted → confirmed/failed`

### 7. UI Components

**`src/components/Multisig/AttesterPanel.tsx`**: Giao diện cho GOV member ký request - hiển thị danh sách request pending, nút ký, trạng thái 3 nhóm.

**`src/components/Multisig/AdminMintPanel.tsx`**: Giao diện cho Admin submit on-chain - hiển thị request đã đủ chữ ký, nonce verification, nút submit.

**`src/components/Multisig/MultisigStatusBadge.tsx`**: Badge hiển thị trạng thái 3 chữ ký (WILL ✓, WISDOM ✓, LOVE ⏳).

### 8. Tích hợp vào Admin page

Thêm tab/section "Multisig Mint" vào trang Admin hiện có, chứa cả AttesterPanel và AdminMintPanel.

## Thứ tự triển khai

1. Database migration (bảng + RLS + Realtime)
2. Config + Types files
3. Edge function
4. Frontend hooks (useAttesterSigning, useMintSubmit)
5. UI components
6. Tích hợp vào Admin page

## Lưu ý kỹ thuật

- Threshold trên contract hiện là 1 (single-sig). Guide yêu cầu 3-of-3, nghĩa là contract cần được update threshold bằng `govSetThreshold(3)` - đây là bước on-chain ngoài phạm vi code.
- 11 địa chỉ GOV cần được đăng ký on-chain bằng `govRegisterAttester()` - cũng là bước on-chain.
- Chữ ký phải theo thứ tự [WILL, WISDOM, LOVE] khi submit.

