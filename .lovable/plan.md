

# Kế Hoạch: FUN Money Auto-Mint từ Light Activity

## Phần I: Hiểu Yêu Cầu Mới

### Flow Mới (Đơn Giản Hóa)

```text
TRƯỚC (Phức tạp - User phải điền form):
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ User làm activity → User mở FUN Money → User điền form (pillars, evidence, v.v.)   │
│                                       → Submit → Pending → Admin approve → Mint    │
└─────────────────────────────────────────────────────────────────────────────────────┘

SAU (Tự động - User chỉ cần bấm MINT):
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ User làm activity → Hệ thống tự động track & tính điểm → Hiển thị "Mintable FUN"   │
│                   → User bấm MINT → Pending → Admin approve → Mint                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phần II: Nguồn Dữ Liệu Light Activity

### Dữ Liệu Đã Có (reward_transactions + daily_reward_limits)

| Activity Type | Bảng | Đã Track |
|---------------|------|----------|
| VIEW | reward_transactions | View video |
| LIKE | reward_transactions | Like video |
| COMMENT | reward_transactions | Comment chất lượng |
| SHARE | reward_transactions | Share video |
| UPLOAD | reward_transactions | Upload video |
| SIGNUP | reward_transactions | Đăng ký tài khoản |
| WALLET_CONNECT | reward_transactions | Kết nối ví |

### Thống Kê Mẫu (Từ Database)

| Type | Total CAMLY | Activity Count |
|------|-------------|----------------|
| LIKE | 73,161,000 | 14,640 |
| COMMENT | 13,770,000 | 2,754 |
| SIGNUP | 8,450,000 | 169 |
| UPLOAD | 4,300,000 | 43 |
| VIEW | 3,888,000 | 423 |

---

## Phần III: Công Thức Tính Mintable FUN

### Logic Chuyển Đổi CAMLY → FUN

```text
Mintable FUN = f(User's Light Activities)

Dựa trên:
1. Tổng CAMLY đã earn (approved + pending)
2. Số lượng activities theo loại (view, like, comment, upload, share)
3. Chất lượng activities (comment length, video duration)
4. Anti-sybil score (suspicious_score từ profiles)
5. Account age & verification status

Công thức đề xuất:
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│  Base FUN = (Total CAMLY × Conversion Rate) / 1000                                 │
│                                                                                     │
│  Light Score = Tự động tính từ activity breakdown:                                 │
│    - S (Service): Dựa trên uploads, helpful comments                               │
│    - T (Truth): Dựa trên verified status, unique content                           │
│    - H (Healing): Dựa trên positive interactions                                   │
│    - C (Contribution): Dựa trên total engagement                                   │
│    - U (Unity): Dựa trên community interactions                                    │
│                                                                                     │
│  Final Mintable = Base FUN × (Light Score / 100) × K (Integrity)                   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phần IV: UI/UX Mới - Light Activity Dashboard

### Thiết Kế Trang /fun-money

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           FUN MONEY                                                  │
│                   Proof of Pure Love Protocol                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                    💎 YOUR MINTABLE FUN                                        │ │
│  │  ───────────────────────────────────────────────────────────────────────────── │ │
│  │                                                                                 │ │
│  │                          ✨ 1,250 FUN ✨                                       │ │
│  │                    (≈ $125.00 USD estimated)                                    │ │
│  │                                                                                 │ │
│  │   Light Score: 78/100  ████████████████████░░░░░                               │ │
│  │                                                                                 │ │
│  │           ┌──────────────────────────────────────────────┐                     │ │
│  │           │         🌟 MINT NOW 🌟                       │                     │ │
│  │           │    (Tạo yêu cầu mint FUN)                    │                     │ │
│  │           └──────────────────────────────────────────────┘                     │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                 📊 LIGHT ACTIVITY BREAKDOWN                                    │ │
│  │  ───────────────────────────────────────────────────────────────────────────── │ │
│  │                                                                                 │ │
│  │   🙏 Service (S)        ████████████████░░░░  85    Uploads: 5, Helps: 12      │ │
│  │   💎 Truth (T)          ████████████████░░░░  82    Verified: Yes              │ │
│  │   💚 Healing (H)        ██████████████░░░░░░  70    Positive: 89%              │ │
│  │   🎁 Contribution (C)   ████████████████████  95    Total: 1,250 activities    │ │
│  │   🤝 Unity (U)          ██████████░░░░░░░░░░  50    Collabs: 3                 │ │
│  │                                                                                 │ │
│  │   ─────────────────────────────────────────────────────────────────────────── │ │
│  │   Total Light Score:    ████████████████░░░░  78                               │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                 📈 ACTIVITY SUMMARY                                            │ │
│  │  ───────────────────────────────────────────────────────────────────────────── │ │
│  │                                                                                 │ │
│  │   Views: 423      Likes: 1,250     Comments: 89     Shares: 17                 │ │
│  │   Uploads: 5      CAMLY Earned: 95,000                                         │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  [Pending Requests]  [Mint History]                                                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phần V: Files Cần Tạo/Sửa

### 5.1. Files Mới

| File | Mục đích |
|------|----------|
| `src/hooks/useLightActivity.ts` | Hook tính toán light activity & mintable FUN |
| `src/components/FunMoney/MintableCard.tsx` | Card hiển thị mintable FUN với nút MINT |
| `src/components/FunMoney/LightActivityBreakdown.tsx` | Breakdown 5 pillars từ activities |
| `src/components/FunMoney/ActivitySummary.tsx` | Tóm tắt activities của user |

### 5.2. Files Cập Nhật

| File | Thay đổi |
|------|----------|
| `src/pages/FunMoneyPage.tsx` | Thay MintRequestForm bằng MintableCard + Breakdown |
| `src/hooks/useFunMoneyMintRequest.ts` | Thêm submitAutoRequest (không cần form input) |
| `src/lib/fun-money/pplp-engine.ts` | Thêm calculatePillarsFromActivity() |

---

## Phần VI: Chi Tiết Technical

### 6.1. useLightActivity Hook

```typescript
interface LightActivity {
  // Activity counts
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalUploads: number;
  
  // CAMLY earned
  totalCamlyEarned: number;
  pendingCamly: number;
  approvedCamly: number;
  
  // Calculated pillars (auto từ activities)
  pillars: {
    S: number; // Service - từ uploads, helpful comments
    T: number; // Truth - từ verified, unique content
    H: number; // Healing - từ positive ratio
    C: number; // Contribution - từ total activities
    U: number; // Unity - từ collaborations
  };
  
  // Light score
  lightScore: number;
  
  // Mintable FUN
  mintableFun: string; // formatted
  mintableFunAtomic: string;
  
  // Status
  canMint: boolean;
  mintBlockReason?: string; // "Insufficient activity", "Already pending", etc.
}

export function useLightActivity(userId: string): {
  activity: LightActivity | null;
  loading: boolean;
  refetch: () => Promise<void>;
}
```

### 6.2. Công Thức Tính Pillars Tự Động

```typescript
function calculatePillarsFromActivity(activity: ActivityData): PillarScores {
  // S (Service): Uploads + helpful comments
  const S = Math.min(100, 
    (activity.uploads * 15) + 
    (activity.qualityComments * 2) + 
    30 // base
  );
  
  // T (Truth): Verified + unique content + account age
  const T = Math.min(100,
    (activity.isVerified ? 30 : 0) +
    (activity.uniqueContentRatio * 40) +
    (Math.min(activity.accountAgeDays, 365) / 365 * 30)
  );
  
  // H (Healing): Positive interaction ratio
  const H = Math.min(100,
    (activity.positiveRatio * 70) +
    (activity.noReports ? 30 : 0)
  );
  
  // C (Contribution): Total engagement
  const C = Math.min(100,
    Math.log10(activity.totalEngagement + 1) * 20 +
    30 // base
  );
  
  // U (Unity): Collaborations + community
  const U = Math.min(100,
    (activity.collaborations * 20) +
    (activity.communityInteractions * 5) +
    20 // base
  );
  
  return { S, T, H, C, U };
}
```

### 6.3. MintableCard Component

```typescript
// Key features:
// - Hiển thị số FUN có thể mint (lớn, nổi bật)
// - Progress bar Light Score
// - Nút MINT lớn với hiệu ứng vàng kim loại
// - Disabled nếu đã có pending request hoặc không đủ điều kiện
// - Tooltip giải thích tại sao không thể mint
```

### 6.4. Quick Mint Flow (1 Click)

```typescript
const handleQuickMint = async () => {
  if (!activity || !canMint) return;
  
  // Tự động submit với dữ liệu đã tính sẵn
  const result = await submitAutoRequest({
    userWalletAddress: address,
    calculatedPillars: activity.pillars,
    calculatedLightScore: activity.lightScore,
    mintableFunAtomic: activity.mintableFunAtomic,
    activitySummary: {
      views: activity.totalViews,
      likes: activity.totalLikes,
      comments: activity.totalComments,
      uploads: activity.totalUploads
    }
  });
  
  if (result) {
    toast.success("Mint request created!");
    // Navigate to history or show pending card
  }
};
```

---

## Phần VII: Database Updates

### 7.1. Thêm Cột Tracking Cho Auto-Mint

```sql
-- Thêm cột để track khi nào user đã mint từ activities
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_fun_mint_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_fun_minted NUMERIC DEFAULT 0;

-- Thêm index cho query activities nhanh hơn
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_type 
ON reward_transactions(user_id, reward_type);
```

---

## Phần VIII: Thứ Tự Triển Khai

| Phase | Công việc | Thời gian |
|-------|-----------|-----------|
| **Phase 1** | useLightActivity hook (fetch + calculate) | 25 phút |
| **Phase 2** | calculatePillarsFromActivity trong pplp-engine | 15 phút |
| **Phase 3** | MintableCard component | 20 phút |
| **Phase 4** | LightActivityBreakdown component | 15 phút |
| **Phase 5** | ActivitySummary component | 10 phút |
| **Phase 6** | Update FunMoneyPage layout | 15 phút |
| **Phase 7** | submitAutoRequest trong useMintRequest | 15 phút |
| **Phase 8** | Database migration | 5 phút |
| **Phase 9** | Testing + refinements | 20 phút |

**Tổng thời gian ước tính:** 2-2.5 giờ

---

## Phần IX: So Sánh UX

```text
TRƯỚC (7 bước, user phải nghĩ):
1. Mở trang FUN Money
2. Click "New Request"
3. Điền description
4. Điền proof URL
5. Điều chỉnh 5 sliders (S, T, H, C, U)
6. Check 4 unity signals
7. Submit

SAU (2 bước, user chỉ cần nhìn và bấm):
1. Mở trang FUN Money → Thấy ngay "1,250 FUN có thể mint"
2. Bấm "MINT NOW" → Done!
```

---

## Tóm Tắt

| Thay đổi | Chi tiết |
|----------|----------|
| **Bỏ form thủ công** | Không cần user điền pillars, evidence |
| **Tự động tính từ activity** | Dựa trên reward_transactions đã track |
| **1-click mint** | User chỉ bấm MINT, hệ thống làm hết |
| **Hiển thị trực quan** | Card lớn với số FUN, progress bar Light Score |
| **Giữ nguyên flow admin** | Pending → Admin review → Approve → Mint on-chain |

