

# Kế hoạch: Hợp nhất Mint FUN về 1 nơi — fun.rich

## Đánh giá khả thi

**Hoàn toàn khả thi.** Kiến trúc hiện tại đã hỗ trợ multi-platform qua `platform_id` trên cả `mint_requests` và `pplp_mint_requests`. Edge function `pplp-mint-fun` đã có config 3 platform với shared epoch cap 20M FUN.

### Hiện trạng cần thay đổi

| Vấn đề | Hiện tại | Cần làm |
|--------|----------|---------|
| Activity query | Chỉ lấy `FUN_PLAY` | Aggregate cả 3 platform |
| Auto-mint insert | Hardcode `platform_id: 'FUN_PROFILE'` | Dùng `'fun_main'` (fun.rich) |
| Light Score | Chỉ tính từ play.fun.rich activities | Gộp activities từ cả 3 nguồn |
| Edge function | Mỗi platform mint riêng | fun.rich là điểm mint duy nhất |
| UI | MintableCard hiển thị data 1 platform | Hiển thị tổng hợp cross-platform |

---

## Triển khai

### 1. Tạo Edge Function `aggregate-cross-platform-activity`
- Query activities từ cả 3 platform (play, angel, main)
- Tổng hợp Light Score, pillar scores, activity counts
- Trả về unified `LightActivity` object
- Tránh double-counting (dedup theo `action_hash`)

### 2. Cập nhật `useLightActivity.ts`
- Bỏ filter `platform_id = 'FUN_PLAY'` trong mint_requests queries
- Aggregate `calculated_amount_formatted` từ TẤT CẢ platform_id
- Thêm `platformBreakdown` field hiển thị FUN đã mint từ mỗi platform

### 3. Cập nhật `useFunMoneyMintRequest.ts` (Auto-mint)
- `submitAutoRequest`: đổi `platform_id` từ `'FUN_PROFILE'` sang `'fun_main'`
- Dedup check: mở rộng kiểm tra across all platforms (không chỉ 1)

### 4. Cập nhật Edge Function `pplp-mint-fun`
- Thêm validation: chỉ accept mint từ `fun_main` (các platform khác redirect)
- Cross-platform activity verification trước khi mint

### 5. Cập nhật `MintableCard.tsx`
- Hiển thị tổng FUN từ cả 3 platform
- Thêm breakdown badge (play: X, angel: Y, main: Z)
- Badge "Mint tại fun.rich" thay vì per-platform

### 6. Tạo `CrossPlatformSummary` component
- Bảng tóm tắt activities từ mỗi platform
- Tổng Light Score hợp nhất
- Visual indicator nguồn dữ liệu

---

## Files

| File | Action |
|------|--------|
| `supabase/functions/aggregate-cross-platform-activity/index.ts` | **Create** |
| `src/hooks/useLightActivity.ts` | **Update** — bỏ FUN_PLAY filter, aggregate all |
| `src/hooks/useFunMoneyMintRequest.ts` | **Update** — platform_id → fun_main |
| `supabase/functions/pplp-mint-fun/index.ts` | **Update** — single mint point validation |
| `src/components/FunMoney/MintableCard.tsx` | **Update** — cross-platform display |
| `src/components/FunMoney/CrossPlatformSummary.tsx` | **Create** |
| `mem://economy/unified-single-mint-point` | **Create** |

