
# Kế Hoạch: Nâng Cấp Hệ Thống Thưởng Tự Động FUN PLAY

## Tổng Quan Hiện Trạng

### ✅ Đã Có Sẵn
| Thành Phần | Trạng Thái |
|------------|------------|
| Edge Function `award-camly` | ✅ Có - cần cập nhật logic |
| Edge Function `claim-camly` | ✅ Có - đầy đủ |
| Edge Function `update-reward-config` | ✅ Có |
| Bảng `reward_config` | ✅ Có - cần thêm configs |
| Bảng `daily_reward_limits` | ✅ Có - cần thêm cột count |
| Bảng `profiles` | ✅ Có - cần thêm `suspicious_score`, `signup_ip_hash` |
| Hook `useAutoReward` | ✅ Có - cần thêm SHORT/LONG video |
| Component `ClaimRewardsModal` | ✅ Có - đầy đủ |

### ❌ Cần Bổ Sung
| Thành Phần | Mô Tả |
|------------|-------|
| Edge Function `check-upload-reward` | Kiểm tra và trao thưởng creator khi đủ 3 views |
| Edge Function `detect-abuse` | Tính suspicious_score |
| Bảng `reward_actions` | Chống thưởng trùng lặp (LIKE/SHARE 1 lần/video) |
| Bảng `ip_tracking` | Chống multi-account |
| Bảng `daily_claim_records` | Giới hạn claim hàng ngày |
| Cột mới trong `daily_reward_limits` | `view_count`, `like_count`, `share_count`, `comment_count`, `short_video_count`, `long_video_count` |
| Cột mới trong `profiles` | `suspicious_score`, `signup_ip_hash` |

---

## Chi Tiết Triển Khai

### 1. Tạo Database Tables Mới

#### Bảng `reward_actions` (Chống trùng lặp)
```sql
CREATE TABLE reward_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  video_id UUID NOT NULL REFERENCES videos(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('VIEW', 'LIKE', 'SHARE')),
  rewarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, video_id, action_type)
);

ALTER TABLE reward_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions" ON reward_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert actions" ON reward_actions
  FOR INSERT WITH CHECK (true);
```

#### Bảng `ip_tracking` (Chống multi-account)
```sql
CREATE TABLE ip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('signup', 'wallet_connect', 'claim')),
  wallet_address TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ip_tracking_hash ON ip_tracking(ip_hash);
CREATE INDEX idx_ip_tracking_user ON ip_tracking(user_id);
```

#### Bảng `daily_claim_records` (Giới hạn claim)
```sql
CREATE TABLE daily_claim_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_claimed NUMERIC DEFAULT 0,
  claim_count INTEGER DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE daily_claim_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims" ON daily_claim_records
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 2. Cập Nhật Tables Hiện Có

#### Thêm cột vào `daily_reward_limits`
```sql
ALTER TABLE daily_reward_limits
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS short_video_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS long_video_count INTEGER DEFAULT 0;
```

#### Thêm cột vào `profiles`
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS suspicious_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signup_ip_hash TEXT;
```

---

### 3. Thêm Reward Config Mới

```sql
INSERT INTO reward_config (config_key, config_value, description) VALUES
('SHORT_VIDEO_REWARD', 20000, 'CAMLY for short video (<3min)'),
('LONG_VIDEO_REWARD', 70000, 'CAMLY for long video (>=3min)'),
('DAILY_VIEW_COUNT_LIMIT', 10, 'Max view rewards per day'),
('DAILY_LIKE_COUNT_LIMIT', 20, 'Max like rewards per day'),
('DAILY_SHARE_COUNT_LIMIT', 10, 'Max share rewards per day'),
('DAILY_COMMENT_COUNT_LIMIT', 10, 'Max comment rewards per day'),
('DAILY_SHORT_VIDEO_LIMIT', 5, 'Max short video rewards per day'),
('DAILY_LONG_VIDEO_LIMIT', 3, 'Max long video rewards per day'),
('SHORT_VIDEO_MAX_DURATION', 180, 'Max seconds for short video (3 min)'),
('MIN_VIEWS_FOR_UPLOAD_REWARD', 3, 'Views needed for creator upload reward'),
('DAILY_CLAIM_LIMIT', 500000, 'Max CAMLY claim per day'),
('MIN_CLAIM_AMOUNT', 200000, 'Min CAMLY to claim'),
('AUTO_APPROVE_THRESHOLD', 3, 'Suspicious score threshold for auto-approve')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
```

---

### 4. Edge Function: `check-upload-reward`

**File:** `supabase/functions/check-upload-reward/index.ts`

Kiểm tra và trao thưởng creator khi video đạt đủ views:
- Lấy video info (duration, view_count)
- Kiểm tra video đã đạt MIN_VIEWS_FOR_UPLOAD_REWARD (3 views) chưa
- Phân loại Short (<3 phút) hoặc Long (>=3 phút)
- Trao thưởng 20K hoặc 70K CAMLY tương ứng
- Ghi log vào reward_transactions

---

### 5. Edge Function: `detect-abuse`

**File:** `supabase/functions/detect-abuse/index.ts`

Tính suspicious_score dựa trên:
- Số ví từ cùng IP (>=3 → +3 điểm)
- Số tài khoản từ cùng IP (>2 → +2 điểm)
- Không có avatar → +1 điểm
- Tên quá ngắn (<=1 ký tự) → +1 điểm
- Pattern tên đáng ngờ → +1 điểm
- Claim >3 lần/ngày → +1 điểm

Kết quả:
- `suspicious_score < 3`: Auto-approve rewards
- `suspicious_score >= 3`: Cần Admin duyệt

---

### 6. Cập Nhật Edge Function: `award-camly`

**Thay đổi chính:**

1. **Thêm loại reward SHORT_VIDEO_UPLOAD và LONG_VIDEO_UPLOAD**
2. **Count-based daily limits** thay vì amount-based
3. **Kiểm tra reward_actions** cho LIKE/SHARE (1 lần/video)
4. **Auto-approve logic** dựa trên suspicious_score

```typescript
// Mức thưởng mới
const DEFAULT_REWARD_AMOUNTS = {
  VIEW: 5000,
  LIKE: 2000,
  COMMENT: 5000,
  SHARE: 5000,
  SHORT_VIDEO_UPLOAD: 20000,
  LONG_VIDEO_UPLOAD: 70000,
  FIRST_UPLOAD: 500000,
  SIGNUP: 50000,
  WALLET_CONNECT: 50000,
};

// Giới hạn theo số lượng
const DEFAULT_DAILY_LIMITS = {
  VIEW_COUNT: 10,
  LIKE_COUNT: 20,
  SHARE_COUNT: 10,
  COMMENT_COUNT: 10,
  SHORT_VIDEO: 5,
  LONG_VIDEO: 3,
};

// Logic auto-approve
const suspiciousScore = profileData?.suspicious_score || 0;
const canAutoApprove = suspiciousScore < 3;

if (canAutoApprove) {
  newApproved = oldApproved + amount;
} else {
  newPending = oldPending + amount;
}
```

---

### 7. Cập Nhật Frontend Hook: `useAutoReward`

**Thay đổi chính:**

1. **Thêm hàm cho SHORT/LONG video upload**
2. **Thêm hàm checkUploadReward** để gọi edge function mới
3. **Đồng bộ trên mobile** - hook đã dùng supabase functions nên hoạt động trên mọi platform

```typescript
// Thêm các hàm mới
const awardShortVideoUpload = useCallback(async (videoId: string) => {
  return awardCAMLY('SHORT_VIDEO_UPLOAD', videoId);
}, [awardCAMLY]);

const awardLongVideoUpload = useCallback(async (videoId: string) => {
  return awardCAMLY('LONG_VIDEO_UPLOAD', videoId);
}, [awardCAMLY]);

const checkUploadReward = useCallback(async (videoId: string) => {
  const { data, error } = await supabase.functions.invoke('check-upload-reward', {
    body: { videoId }
  });
  return { success: !error && data?.success, data };
}, []);
```

---

### 8. Cập Nhật `claim-camly`

**Thêm logic:**

1. **Kiểm tra MIN_CLAIM_AMOUNT** (200K CAMLY)
2. **Kiểm tra DAILY_CLAIM_LIMIT** (500K/ngày)
3. **Ghi vào daily_claim_records**
4. **Reset approved_reward về 0** sau khi claim

---

## Danh Sách File Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| Database Migration | TẠO MỚI | Tạo tables và cột mới |
| `supabase/functions/award-camly/index.ts` | SỬA | Thêm logic SHORT/LONG video, count-based limits, auto-approve |
| `supabase/functions/check-upload-reward/index.ts` | TẠO MỚI | Kiểm tra và trao thưởng creator |
| `supabase/functions/detect-abuse/index.ts` | TẠO MỚI | Tính suspicious_score |
| `supabase/functions/claim-camly/index.ts` | SỬA | Thêm MIN/MAX claim logic |
| `src/hooks/useAutoReward.ts` | SỬA | Thêm hàm cho SHORT/LONG video |
| `src/lib/enhancedRewards.ts` | SỬA | Cập nhật constants |
| `supabase/config.toml` | SỬA | Thêm config cho functions mới |

---

## Bảng Mức Thưởng Mới (Theo Tài Liệu)

| Hành Động | Số CAMLY | Giới Hạn/Ngày | Điều Kiện |
|-----------|----------|---------------|-----------|
| 👁️ Xem Video | 5,000 | 10 lượt | Xem ≥30% hoặc 10 giây |
| ❤️ Thích Video | 2,000 | 20 lượt | 1 lần/video |
| 💬 Bình Luận | 5,000 | 10 lượt | ≥20 ký tự, không spam |
| 📤 Chia Sẻ | 5,000 | 10 lượt | 1 lần/video |
| 🎬 Video Ngắn (<3 phút) | 20,000 | 5 video | Cần 3 views thật |
| 🎥 Video Dài (≥3 phút) | 70,000 | 3 video | Cần 3 views thật |
| 🏆 Video Đầu Tiên | 500,000 | 1 lần | Một lần duy nhất |
| 👤 Đăng Ký | 50,000 | 1 lần | Một lần duy nhất |
| 👛 Kết Nối Ví | 50,000 | 3 ví/IP | Chống multi-account |

---

## Đồng Bộ Mobile

Hệ thống **đã đồng bộ trên mobile** vì:
1. **Edge Functions** chạy server-side, không phụ thuộc platform
2. **useAutoReward hook** dùng `supabase.functions.invoke()` - hoạt động trên mọi browser/app
3. **ClaimRewardsModal** đã hỗ trợ mobile wallet deep links (MetaMask, Bitget, Trust)
4. **Capacitor app** dùng cùng codebase React nên reward logic tự động hoạt động

---

## Sơ Đồ Luồng Thưởng

```text
User Action (View/Like/Comment/Share/Upload)
              │
              ▼
    ┌─────────────────────┐
    │   Frontend Hook     │
    │   useAutoReward     │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Edge Function      │
    │  award-camly        │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Anti-Fraud Checks  │
    │  - Duplicate view   │
    │  - Spam comment     │
    │  - Already rewarded │
    │  - Daily limits     │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  suspicious_score   │
    │  < 3: Auto-approve  │
    │  ≥ 3: Pending admin │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────────────────┐
    │         reward_transactions     │
    │  approved: true/false           │
    │  pending_rewards / approved_reward │
    └─────────────────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  User Claims CAMLY  │
    │  (approved only)    │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  BSC Blockchain     │
    │  CAMLY Token        │
    │  Transfer           │
    └─────────────────────┘
```

---

## Test Cases

1. **Xem video** → Nhận 5,000 CAMLY (max 10 lần/ngày)
2. **Like video** → Nhận 2,000 CAMLY (max 20 lần/ngày, 1 lần/video)
3. **Upload video ngắn** → Khi đạt 3 views → Nhận 20,000 CAMLY
4. **Upload video dài** → Khi đạt 3 views → Nhận 70,000 CAMLY
5. **User mới** (suspicious_score < 3) → Reward auto-approve
6. **User đáng ngờ** (suspicious_score ≥ 3) → Reward pending admin
7. **Claim** → Chỉ claim được reward đã approved, tối thiểu 200K, tối đa 500K/ngày
8. **Mobile** → Tất cả flow hoạt động như desktop
