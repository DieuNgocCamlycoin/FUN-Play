
# PPLP Scoring & FUN Money Infrastructure — Roadmap

## Pipeline hoàn chỉnh

| Component | Status | Ghi chú |
|-----------|--------|---------|
| Event Ingest (`ingest-pplp-event`) | ✅ Done | 26 loại event, append-only |
| Feature Builder Cron | ✅ Done | `build-features` — tổng hợp features_user_day |
| PPLP Rating UI | ✅ Done | `PPLPRatingModal` — 5 trụ × 0-2, tích hợp PostCard |
| Client Event Hook | ✅ Done | `usePplpEventIngest` — hook gọi ingest từ client |
| Sequence Detector | ✅ Done | `detect-sequences` — 4 loại chuỗi, cron 2:30 AM daily |
| Mint Epoch Engine | ✅ Done | `mint-epoch-engine` — weekly epoch, cron 3:00 AM Monday |
| Scoring Rule Versioning | ✅ Done | Bảng `scoring_rules`, V1.0 seeded, `rule_version` in ledger |
| Reason Codes System | ✅ Done | `reason-codes.ts` — positive language, no negative terms |
| Anti-Whale Cap | ✅ Done | 3% max share per user, redistribute excess |
| PPLP Light API | ✅ Done | `pplp-light-api` — profile/me/epoch/transparency |
| Level System Update | ✅ Done | seed/sprout/builder/guardian/architect + trend |
| AI Content Analyzer | Thiết kế | Ego Risk Classifier, Pillar Support Scorer |
| AI Spam Detector | Thiết kế | Burst pattern, reciprocal rings |
| 8 Câu Thần Chú PPLP | Cần UI | Flow xác nhận + bảng events |
| Transparency Dashboard UI | Cần UI | Public stats widget, no individual data |
| Model Drift Monitor | Thiết kế | Phát hiện khi hành vi lệch về Ego |
| Community Council Review | Thiết kế | Guardian + Architect review định kỳ |
| Slow Mint Curve | Thiết kế | Total supply tăng từ từ |

## Cron Schedule

| Job | Schedule | Function |
|-----|----------|----------|
| build-features | 02:00 AM daily | Tổng hợp features_user_day |
| detect-sequences | 02:30 AM daily | Phát hiện chuỗi hành vi |
| mint-epoch-weekly | 03:00 AM Monday | Tạo epoch + phân bổ mint |

## Kiến trúc

```
Events → Features (2:00 AM) → Sequences (2:30 AM) → Scoring (RPC) → Mint Epoch (3:00 AM Monday)
                                                          ↓
                                                   Light API (4 actions)
                                                   ├── /profile (public, no raw score)
                                                   ├── /me (authenticated, full detail)
                                                   ├── /epoch (public, mint summary)
                                                   └── /transparency (public, system stats)
```

## Triết lý thiết kế

- **Không nuôi Ego**: Không hiển thị raw score công khai, không ranking cá nhân
- **Ngôn ngữ tích cực**: Reason codes dùng từ xây dựng, không tiêu cực
- **Anti-Whale**: Tối đa 3% pool/user, bảo vệ công bằng
- **Versioning**: Mỗi epoch ghi nhận rule_version, có thể audit toàn bộ lịch sử
- **Trend > Score**: Hiển thị Growing/Stable/Reflecting/Rebalancing thay vì số
