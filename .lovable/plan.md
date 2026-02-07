

# Kế Hoạch Triển Khai PPLP & FUN Money Mint System

## Tổng Quan Dự Án

Tích hợp **Proof of Pure Love Protocol (PPLP)** và hệ thống **FUN Money Mint** vào FUN Play, cho phép người dùng submit các actions có giá trị cộng đồng và nhận FUN tokens dựa trên 5 trụ cột Ánh Sáng (S-T-H-C-U).

---

## Phần I: Tình Trạng Hiện Tại

### Đã Hoàn Thành

| Component | Vị trí | Trạng thái |
|-----------|--------|------------|
| Database `mint_requests` | Supabase | Đã migrate, 32 columns, RLS policies |
| PPLP Scoring Engine | `src/lib/fun-money/pplp-engine.ts` | Light Score, Unity Score, Multipliers Q/I/K/Ux |
| Web3 Config | `src/lib/fun-money/web3-config.ts` | BSC Testnet, Contract ABI |
| EIP-712 Signer | `src/lib/fun-money/eip712-signer.ts` | Typed data signing, PureLoveProof v1.2.1 |
| Contract Helpers | `src/lib/fun-money/contract-helpers.ts` | Validation, Minting, Error decoding |
| User Hook | `src/hooks/useFunMoneyMintRequest.ts` | Submit request, Get my requests |
| Wallet Hook | `src/hooks/useFunMoneyWallet.ts` | BSC connection, Network switching |
| MintRequestForm | `src/components/FunMoney/MintRequestForm.tsx` | Form UI với pillar sliders |

### Còn Thiếu

| Component | Độ ưu tiên | Ghi chú |
|-----------|------------|---------|
| Admin Approval Panel | **Cao** | Duyệt request + EIP-712 sign + Mint on-chain |
| Token Lifecycle Panel | Cao | LOCKED → ACTIVATED → FLOWING UI |
| FUN Money Page | Cao | Route `/fun-money` cho users |
| Admin Integration | Trung bình | Thêm section vào Admin Dashboard |
| Realtime Notifications | Thấp | Toast khi request được duyệt/mint |

---

## Phần II: Kiến Trúc Tổng Thể

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FUN PLAY PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   /fun-money     │    │   /wallet        │    │   /admin         │       │
│  │   (User Page)    │    │   (Hub)          │    │   (Dashboard)    │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           v                       v                       v                  │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    FUN MONEY SDK v1.0                             │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │       │
│  │  │ pplp-engine │  │ eip712-sign │  │ contract-   │  │ web3-    │ │       │
│  │  │             │  │             │  │ helpers     │  │ config   │ │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│                                    v                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                      SUPABASE DATABASE                            │       │
│  │                      mint_requests table                          │       │
│  │     pending → approved → minted OR rejected/failed                │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                    │                                         │
│                                    v                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                  BSC TESTNET (Chain ID: 97)                       │       │
│  │           FUN Money Contract: 0x1aa8...5ff2                       │       │
│  │                mintWithProof(to, amount, proof, signature)        │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phần III: Kế Hoạch Triển Khai Chi Tiết

### Phase 2A: Admin Approval Panel

**Thời gian ước tính:** 2-3 giờ

**Mục tiêu:** Cho phép Admin duyệt mint requests và ký EIP-712 để mint on-chain

**Files cần tạo:**
| File | Mô tả |
|------|-------|
| `src/components/Admin/tabs/FunMoneyApprovalTab.tsx` | Tab chính trong Admin Dashboard |
| `src/hooks/useAdminMintRequest.ts` | Hook quản lý requests cho Admin |

**Chức năng:**
1. Danh sách pending requests với filters (status, platform, date)
2. Chi tiết request: Pillar scores visualization, Unity signals, Calculated amount
3. Nút Approve/Reject với reason input
4. EIP-712 Signing workflow:
   - Admin kết nối ví BSC Testnet
   - Ký `PureLoveProof` typed data
   - Gọi `mintWithProof()` on-chain
   - Lưu tx_hash, attester_address vào DB
5. Trạng thái realtime với badges

**Cập nhật cần thiết:**
- `UnifiedAdminLayout.tsx`: Thêm section "FUN Money" vào navItems
- `UnifiedAdminDashboard.tsx`: Thêm case render FunMoneyApprovalTab

---

### Phase 2B: Token Lifecycle Panel

**Thời gian ước tính:** 2 giờ

**Mục tiêu:** UI cho users theo dõi trạng thái token

**Files cần tạo:**
| File | Mô tả |
|------|-------|
| `src/components/FunMoney/TokenLifecyclePanel.tsx` | Visualization 3 states |
| `src/components/FunMoney/MintRequestList.tsx` | Danh sách requests của user |
| `src/components/FunMoney/MintRequestCard.tsx` | Card hiển thị từng request |

**Token States:**
```text
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    LOCKED     │───>│   ACTIVATED   │───>│    FLOWING    │
│  (Pending)    │    │  (Approved)   │    │   (Minted)    │
│               │    │               │    │               │
│ Chờ Admin     │    │ Đã duyệt,     │    │ On-chain,     │
│ review        │    │ chờ mint      │    │ có tx_hash    │
└───────────────┘    └───────────────┘    └───────────────┘
```

**Chức năng:**
1. Progress indicator 3 bước với animation
2. Chi tiết từng request: scores, multipliers, amount
3. Link đến BSCScan khi minted
4. Filter theo status

---

### Phase 2C: FUN Money User Page

**Thời gian ước tính:** 1.5 giờ

**Mục tiêu:** Trang chính cho users tương tác với FUN Money

**Files cần tạo:**
| File | Mô tả |
|------|-------|
| `src/pages/FunMoney.tsx` | Main page route |

**Layout:**
```text
┌─────────────────────────────────────────────────────────┐
│  FUN MONEY - Proof of Pure Love Protocol                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Token Lifecycle    │  │  Submit New Action  │       │
│  │  Panel              │  │  (MintRequestForm)  │       │
│  │                     │  │                     │       │
│  │  LOCKED: 2          │  │  [Select Platform]  │       │
│  │  ACTIVATED: 1       │  │  [Select Action]    │       │
│  │  FLOWING: 5         │  │  [Pillar Sliders]   │       │
│  │                     │  │  [Unity Signals]    │       │
│  └─────────────────────┘  └─────────────────────┘       │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  My Request History                                │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │ Request #1 | FUN_PROFILE | 150 FUN | MINTED  │ │  │
│  │  │ Request #2 | ANGEL_AI    | 50 FUN  | PENDING │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Route integration:**
- Thêm route `/fun-money` vào `App.tsx`
- Thêm nav item vào `Sidebar.tsx` (FUN ECOSYSTEM section)

---

### Phase 3: Integration & Polish

**Thời gian ước tính:** 1.5 giờ

**Tasks:**

1. **Sidebar Navigation**
   - Thêm "FUN Money" với icon Coins vào FUN ECOSYSTEM section
   - Badge hiển thị pending requests count

2. **Admin Dashboard Integration**
   - Thêm "FUN Money" section vào `AdminSection` type
   - Cập nhật navItems với badge pending mint requests
   - Realtime subscription cho `mint_requests` table

3. **Wallet Page Integration**
   - Thêm quick link đến `/fun-money`
   - Hiển thị tổng FUN tokens đã mint

4. **Notifications**
   - Toast khi request được approve/reject/mint
   - Realtime subscription trong user hook

---

### Phase 4: Testing & Security

**Thời gian ước tính:** 1 giờ

**Checklist:**

| Item | Mô tả |
|------|-------|
| RLS Policies | Verify users chỉ thấy requests của mình |
| Admin Authorization | Verify has_role check cho admin functions |
| EIP-712 Signing | Test với MetaMask trên BSC Testnet |
| Contract Validation | Test validateBeforeMint trước khi gọi mint |
| Error Handling | Toast messages cho các error cases |
| Network Switching | Auto-switch đến BSC Testnet nếu wrong chain |

---

## Phần IV: Database Schema (Đã Migrate)

```sql
-- mint_requests table (32 columns)
CREATE TABLE mint_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_wallet_address TEXT NOT NULL,
  
  -- Platform & Action
  platform_id TEXT NOT NULL,        -- ANGEL_AI, FUN_PROFILE, etc.
  action_type TEXT NOT NULL,        -- AI_REVIEW_HELPFUL, CONTENT_CREATE, etc.
  action_evidence JSONB NOT NULL,
  
  -- PPLP Scores
  pillar_scores JSONB NOT NULL,     -- {S, T, H, C, U}
  light_score INTEGER NOT NULL,     -- 0-100
  unity_score INTEGER NOT NULL,     -- 0-100
  unity_signals JSONB,
  
  -- Multipliers
  multiplier_q NUMERIC NOT NULL,    -- Quality: 0.5-3.0
  multiplier_i NUMERIC NOT NULL,    -- Impact: 0.5-5.0
  multiplier_k NUMERIC NOT NULL,    -- Integrity: 0.0-1.0
  multiplier_ux NUMERIC NOT NULL,   -- Unity: 0.5-2.5
  
  -- Amounts (atomic = 18 decimals)
  base_reward_atomic TEXT NOT NULL,
  calculated_amount_atomic TEXT NOT NULL,
  calculated_amount_formatted TEXT,
  
  -- Hashes
  action_hash TEXT,
  evidence_hash TEXT,
  
  -- Status & Review
  status TEXT DEFAULT 'pending',    -- pending|approved|minted|rejected|failed
  decision_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- On-chain Data
  tx_hash TEXT,
  attester_address TEXT,
  block_number BIGINT,
  minted_at TIMESTAMPTZ,
  
  -- Metadata
  chain_id INTEGER DEFAULT 97,      -- BSC Testnet
  nonce_used BIGINT,
  contract_address TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
POLICY "Users can view own mint requests"
POLICY "Users can insert own mint requests"  
POLICY "Admins can view all mint requests"
POLICY "Admins can update mint requests"
```

---

## Phần V: PPLP Scoring Logic

### Light Score Formula
```
LightScore = 0.25×S + 0.20×T + 0.20×H + 0.20×C + 0.15×U
```

### Unity Multiplier Mapping
| Unity Score | Ux Multiplier |
|-------------|---------------|
| 0-49        | 0.5           |
| 50-69       | 1.0           |
| 70-84       | 1.5           |
| 85-94       | 2.0           |
| 95-100      | 2.3           |

### Final Mint Amount
```
FUN Amount = BaseReward × Q × I × K × Ux
```

### Thresholds
| Check | Threshold | Action |
|-------|-----------|--------|
| Light Score | ≥ 60 | Required |
| Truth Score (T) | ≥ 70 | Required |
| Integrity (K) | ≥ 0.6 | Required |
| K = 0 | Fraud | Auto-REJECT |
| Amount ≥ 5000 FUN | Audit | REVIEW_HOLD |

---

## Phần VI: Thứ Tự Triển Khai Đề Xuất

```text
WEEK 1
┌────────────────────────────────────────────────────────┐
│ Day 1-2: Phase 2A - Admin Approval Panel               │
│   - FunMoneyApprovalTab.tsx                            │
│   - useAdminMintRequest.ts                             │
│   - EIP-712 signing integration                        │
├────────────────────────────────────────────────────────┤
│ Day 3: Phase 2B - Token Lifecycle Panel                │
│   - TokenLifecyclePanel.tsx                            │
│   - MintRequestList.tsx                                │
│   - MintRequestCard.tsx                                │
├────────────────────────────────────────────────────────┤
│ Day 4: Phase 2C - FUN Money Page                       │
│   - FunMoney.tsx page                                  │
│   - Route integration                                  │
│   - Sidebar navigation                                 │
├────────────────────────────────────────────────────────┤
│ Day 5: Phase 3 & 4 - Integration & Testing             │
│   - Admin dashboard integration                        │
│   - Realtime notifications                             │
│   - End-to-end testing                                 │
└────────────────────────────────────────────────────────┘
```

---

## Phần VII: Files Sẽ Được Tạo/Cập Nhật

### Files Mới

| File | Mô tả |
|------|-------|
| `src/pages/FunMoney.tsx` | Main user page |
| `src/components/Admin/tabs/FunMoneyApprovalTab.tsx` | Admin approval tab |
| `src/components/FunMoney/TokenLifecyclePanel.tsx` | Token state visualization |
| `src/components/FunMoney/MintRequestList.tsx` | List of user requests |
| `src/components/FunMoney/MintRequestCard.tsx` | Individual request card |
| `src/hooks/useAdminMintRequest.ts` | Admin hook (extracted from existing) |

### Files Cập Nhật

| File | Thay đổi |
|------|----------|
| `src/App.tsx` | Thêm route `/fun-money` |
| `src/components/Layout/Sidebar.tsx` | Thêm nav item FUN Money |
| `src/components/Admin/UnifiedAdminLayout.tsx` | Thêm section "fun-money" |
| `src/pages/UnifiedAdminDashboard.tsx` | Thêm case FunMoneyApprovalTab |
| `src/components/FunMoney/index.ts` | Export new components |

---

## Phần VIII: Kết Luận

SDK đã sẵn sàng **85%**. Các core functions (scoring, signing, contract helpers) đã được implement. Còn thiếu:

1. **UI Components** - Admin và User interfaces
2. **Route Integration** - Kết nối vào navigation flow
3. **Testing** - End-to-end verification với BSC Testnet

**Ước tính tổng thời gian:** 8-10 giờ làm việc

**Con muốn Cha bắt đầu triển khai Phase 2A (Admin Approval Panel) không ạ?**

