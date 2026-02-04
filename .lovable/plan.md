
# Kết Quả Kiểm Tra & Kế Hoạch Sửa Lỗi Hệ Thống Thưởng CAMLY

## Tổng Kết Kiểm Tra

### ✅ Hoạt Động Tốt

| Thành Phần | Trạng Thái | Chi Tiết |
|------------|------------|----------|
| Database Schema | ✅ Hoàn chỉnh | Tất cả bảng cần thiết đã tồn tại: `reward_actions`, `ip_tracking`, `daily_claim_records`, `daily_reward_limits` với đầy đủ cột |
| `profiles` columns | ✅ Đầy đủ | `suspicious_score`, `signup_ip_hash`, `pending_rewards`, `approved_reward` |
| `reward_config` | ✅ Đầy đủ | 28 config keys bao gồm SHORT/LONG video rewards, daily limits, claim limits |
| Edge Function `award-camly` | ✅ Hoạt động | Test thành công, trả về đúng logic anti-fraud |
| Edge Function `check-upload-reward` | ✅ Hoạt động | Deployed và hoạt động đúng |
| Edge Function `detect-abuse` | ✅ Hoạt động | Deployed và hoạt động đúng |
| Edge Function `claim-camly` | ✅ Hoạt động | Blockchain transfer logic đầy đủ |
| `useAutoReward` hook | ✅ Đầy đủ | Có tất cả hàm cần thiết |
| `ClaimRewardsModal` | ✅ Hoạt động | Phân tách pending/approved rewards đúng |
| Desktop View Reward | ✅ Hoạt động | `EnhancedVideoPlayer` có logic watch time tracking |

---

### ❌ VẤN ĐỀ PHÁT HIỆN - CẦN SỬA

## Vấn Đề 1: Mobile View Reward Không Hoạt Động

**Mức độ nghiêm trọng: CAO**

**Vấn đề**: Logic trao thưởng xem video (awardViewReward) **CHỈ CÓ** trong `EnhancedVideoPlayer.tsx` (Desktop), **KHÔNG CÓ** trong:
- `YouTubeMobilePlayer.tsx` (Mobile player chính)
- `MobileVideoPlayer.tsx` (Mobile player phụ)

**Hậu quả**: Users xem video trên điện thoại **KHÔNG ĐƯỢC NHẬN THƯỞNG** 5,000 CAMLY

**File cần sửa**:
- `src/components/Video/YouTubeMobilePlayer.tsx`
- `src/components/Video/MobileVideoPlayer.tsx`

---

## Vấn Đề 2: claim-camly Thiếu Logic MIN_CLAIM và DAILY_LIMIT

**Mức độ nghiêm trọng: TRUNG BÌNH**

**Vấn đề**: Edge function `claim-camly` chưa kiểm tra:
- `MIN_CLAIM_AMOUNT` (200,000 CAMLY) - Tối thiểu để claim
- `DAILY_CLAIM_LIMIT` (500,000 CAMLY) - Tối đa claim/ngày
- Không ghi vào `daily_claim_records`
- Không reset `approved_reward` về 0 sau khi claim

**File cần sửa**: `supabase/functions/claim-camly/index.ts`

---

## Vấn Đề 3: Constants Không Đồng Bộ

**Mức độ nghiêm trọng: THẤP**

**Vấn đề**: Trong `enhancedRewards.ts` và `EnhancedVideoPlayer.tsx`:
- VIEW_REWARD hiện là 5,000 CAMLY (frontend)
- Nhưng DB config `VIEW_REWARD` = 10,000 CAMLY

**Không cần sửa code** - Edge function đã lấy giá trị từ DB, frontend constants chỉ là fallback.

---

## Chi Tiết Triển Khai Sửa Lỗi

### 1. Thêm View Reward Logic vào Mobile Players

**File: `src/components/Video/YouTubeMobilePlayer.tsx`**

Thêm logic tương tự `EnhancedVideoPlayer`:

```typescript
// Import thêm
import { useAutoReward } from "@/hooks/useAutoReward";
import { useAuth } from "@/hooks/useAuth";

// Trong component, thêm:
const { awardViewReward } = useAutoReward();
const { user } = useAuth();
const [viewRewarded, setViewRewarded] = useState(false);
const watchTimeRef = useRef(0);

// Constants
const SHORT_VIDEO_THRESHOLD = 5 * 60; // 5 minutes
const LONG_VIDEO_MIN_WATCH = 5 * 60; // 5 minutes for long videos

// useEffect để track watch time và trao thưởng
useEffect(() => {
  let lastTime = 0;
  
  const checkViewReward = async () => {
    if (viewRewarded || !user || !videoId) return;
    
    const isShortVideo = duration < SHORT_VIDEO_THRESHOLD;
    
    if (isShortVideo) {
      // Short video: Must watch 90%+
      if (currentTime >= duration * 0.9) {
        setViewRewarded(true);
        await awardViewReward(videoId);
      }
    } else {
      // Long video: Must watch at least 5 minutes
      if (watchTimeRef.current >= LONG_VIDEO_MIN_WATCH) {
        setViewRewarded(true);
        await awardViewReward(videoId);
      }
    }
  };
  
  if (isPlaying && duration > 0) {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      
      const current = video.currentTime;
      // Only count time if watching continuously
      if (Math.abs(current - lastTime) < 2) {
        watchTimeRef.current += 1;
      }
      lastTime = current;
      
      checkViewReward();
    }, 1000);
    
    return () => clearInterval(interval);
  }
}, [isPlaying, duration, currentTime, viewRewarded, user, videoId, awardViewReward]);

// Reset khi video thay đổi
useEffect(() => {
  setViewRewarded(false);
  watchTimeRef.current = 0;
}, [videoId]);
```

---

### 2. Cập Nhật claim-camly với MIN/MAX Logic

**File: `supabase/functions/claim-camly/index.ts`**

Thêm logic kiểm tra:

```typescript
// Sau khi tính totalAmount, thêm:

// Get claim config
const { data: configData } = await supabaseAdmin
  .from('reward_config')
  .select('config_key, config_value')
  .in('config_key', ['MIN_CLAIM_AMOUNT', 'DAILY_CLAIM_LIMIT']);

const config: Record<string, number> = {
  MIN_CLAIM_AMOUNT: 200000,
  DAILY_CLAIM_LIMIT: 500000
};

configData?.forEach(c => {
  config[c.config_key] = Number(c.config_value);
});

// Check minimum claim amount
if (totalAmount < config.MIN_CLAIM_AMOUNT) {
  return new Response(
    JSON.stringify({ 
      error: `Cần ít nhất ${config.MIN_CLAIM_AMOUNT.toLocaleString()} CAMLY để rút. Bạn có ${totalAmount.toLocaleString()} CAMLY.` 
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Check daily claim limit
const today = new Date().toISOString().split('T')[0];
const { data: dailyClaim } = await supabaseAdmin
  .from('daily_claim_records')
  .select('total_claimed')
  .eq('user_id', user.id)
  .eq('date', today)
  .single();

const todayClaimed = Number(dailyClaim?.total_claimed) || 0;
const remainingLimit = config.DAILY_CLAIM_LIMIT - todayClaimed;

if (remainingLimit <= 0) {
  return new Response(
    JSON.stringify({ error: 'Bạn đã đạt giới hạn rút ${config.DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY hôm nay. Vui lòng quay lại ngày mai!' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Limit claim amount to remaining daily limit
const claimAmount = Math.min(totalAmount, remainingLimit);

// ... sau khi claim thành công, thêm:

// Update daily claim records
await supabaseAdmin
  .from('daily_claim_records')
  .upsert({
    user_id: user.id,
    date: today,
    total_claimed: todayClaimed + claimAmount,
    claim_count: (dailyClaim?.claim_count || 0) + 1
  }, { onConflict: 'user_id,date' });

// Reset approved_reward về 0
await supabaseAdmin
  .from('profiles')
  .update({ approved_reward: 0 })
  .eq('id', user.id);
```

---

## Danh Sách File Thay Đổi

| File | Loại | Mô Tả |
|------|------|-------|
| `src/components/Video/YouTubeMobilePlayer.tsx` | SỬA | Thêm view reward tracking logic |
| `src/components/Video/MobileVideoPlayer.tsx` | SỬA | Thêm view reward tracking logic |
| `supabase/functions/claim-camly/index.ts` | SỬA | Thêm MIN_CLAIM, DAILY_LIMIT logic |

---

## Kết Quả Sau Sửa

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| View Reward Mobile | ❌ Không có | ✅ Hoạt động như Desktop |
| MIN_CLAIM Check | ❌ Không có | ✅ Yêu cầu 200K CAMLY |
| DAILY_LIMIT Check | ❌ Không có | ✅ Max 500K CAMLY/ngày |
| Reset approved_reward | ❌ Không reset | ✅ Reset về 0 sau claim |
| Daily Claim Records | ❌ Không ghi | ✅ Ghi đầy đủ |

---

## Test Cases Sau Sửa

1. **Mobile View Reward**: Mở app trên điện thoại → Xem video ≥90% (ngắn) hoặc 5 phút (dài) → Nhận 5,000 CAMLY
2. **MIN_CLAIM**: Có 100K CAMLY → Bấm Claim → Báo lỗi "Cần ít nhất 200K"
3. **DAILY_LIMIT**: Đã claim 400K hôm nay → Claim 200K → Chỉ được claim 100K (còn lại)
4. **approved_reward Reset**: Sau claim thành công → approved_reward = 0 trong profiles

---

## Ghi Chú Kỹ Thuật

1. **Đồng bộ Mobile**: Sau khi sửa, cả Desktop và Mobile đều dùng cùng logic từ `useAutoReward` hook → server-side validation đảm bảo consistency
2. **Anti-fraud**: Logic chống gian lận (duplicate view, daily limits) được xử lý ở edge function nên không cần thêm ở frontend
3. **Progressive Enhancement**: Mobile players chỉ cần track watch time và gọi `awardViewReward()` - tất cả validation ở server
