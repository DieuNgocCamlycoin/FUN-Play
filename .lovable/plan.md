## Trạng thái triển khai PPLP Light Score & FUN Money

### ĐÃ HOÀN THÀNH ✅
- Công thức PPLP Score: 6 trụ × Reputation Weight × Consistency Multiplier – Integrity Penalty
- Light Level classification (presence/contributor/builder/guardian/architect) trong RPC
- Server-side `calculate_user_light_score` đầy đủ multipliers + checkin_bonus
- `useLightActivity.ts` và `LightActivityBreakdown.tsx` cập nhật với multipliers
- **Ẩn điểm chi tiết trên profile công khai** - chỉ hiển thị Light Level badge
- **Bỏ bảng xếp hạng cạnh tranh** - đổi từ "TOP RANKING" (CAMLY) sang "LIGHT COMMUNITY"
- `LightLevelBadge.tsx` component hiển thị level label trên avatar
- `useLightCommunity.ts` hook thay thế `useTopRanking.ts` cho sidebar cards
- **Daily Check-in**: Bảng `daily_checkins` + UI widget + tích hợp Light Score (checkin_bonus max 10 điểm)

### EVENT-SOURCING MODEL ✅ (DB Ready)

#### Bảng đã tạo:
| Bảng | Mô tả | RLS |
|---|---|---|
| `pplp_events` | Append-only event store (26 event types) | User own + Admin |
| `pplp_ratings` | Community peer ratings (5 pillars × 0-2) | Rater/Author + Admin |
| `signals_anti_farm` | Fraud detection signals (8 types) | Admin only |
| `light_score_ledger` | Historical score records (day/week/month) | User own + Admin |
| `score_explanations` | Audit trail for scoring decisions | User own + Admin |
| `sequences` | Behavioral chain tracking (6 types) | User own + Admin |
| `features_user_day` | Materialized daily features | User own + Admin |
| `mint_epochs` | Epoch-based mint pool | Public (finalized) + Admin |
| `mint_allocations` | Per-user allocation per epoch | User own + Admin |

#### Profile fields thêm:
- `pplp_accepted_at`, `pplp_version`, `mantra_ack_at`, `completion_pct`

#### Pipeline Architecture:
```
Ingest Events → Validate → Feature Builder → Scoring Engine → Mint Engine → On-chain
```

### CHƯA TRIỂN KHAI (cần code/infrastructure)
| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Event Ingest Edge Function | DB Ready | Cần edge function để ghi events từ client |
| Feature Builder Cron | DB Ready | Cron job tổng hợp features_user_day hàng ngày |
| PPLP Rating UI | DB Ready | UI cho user chấm điểm nội dung theo 5 trụ |
| Sequence Detector | DB Ready | Logic phát hiện và ghi nhận chuỗi hành vi |
| Mint Epoch Engine | DB Ready | Cron job tạo epoch + phân bổ mint |
| AI Content Analyzer | Thiết kế | Ego Risk Classifier, Pillar Support Scorer |
| AI Spam Detector | Thiết kế | Burst pattern, reciprocal rings |
| 8 Câu Thần Chú PPLP | Cần UI | Flow xác nhận + bảng events |
| Cam kết 5 lời hứa cộng đồng | Cần UI | Tracking qua events |
| Staking CAMLY tăng Reputation | Chưa có smart contract | |
| Cross-platform contribution | Chưa có FUN Academy/Earth/Legal | |
