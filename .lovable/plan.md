

# Kế hoạch: Nâng cấp Light Score & FUN Money theo tài liệu PPLP bổ sung

## Trạng thái: ĐÃ TRIỂN KHAI ✅

### Những gì đã hoàn thành

1. ✅ **Migration**: Thêm cột `light_level` TEXT và `consistency_days` INTEGER vào profiles
2. ✅ **RPC `calculate_user_light_score`**: Viết lại hoàn toàn với:
   - **6 trụ cột mới**: Truth(20) + Trust(15) + Service(20) + Healing(20) + Community(15) + Sequence Bonus(10)
   - **Reputation Weight** (0.6→1.3): Dựa trên account age + no violations + approved content + donations
   - **Consistency Multiplier** (1.0→1.6): Dựa trên số ngày active từ daily_reward_limits
   - **Sequence Bonus**: Light Growth Chain (5pts) + Economic Integrity (5pts)
   - **Light Level**: Tự động gán presence/contributor/builder/guardian/architect
3. ✅ **pplp-engine.ts**: Thêm `getLightLevelLabel`, `getLightLevelEmoji`, `calculateReputationWeight`, `calculateConsistencyMultiplier`
4. ✅ **useLightActivity.ts**: Thêm `lightLevel`, `reputationWeight`, `consistencyMultiplier`, `consistencyDays`, `sequenceBonus`, `rawScore`; sử dụng server-side light_score
5. ✅ **LightActivityBreakdown.tsx**: Hiển thị 6 pillars + Light Level badge + Reputation/Consistency multipliers + raw score

---

## Ghi nhớ cho tương lai (CHƯA triển khai)

| Tính năng | Ghi chú |
|---|---|
| Mint Pool theo chu kỳ (tuần/tháng) | Cần thiết kế Mint Pool engine, phân bổ tỷ lệ, cron job hàng tuần |
| 8 Câu Thần Chú PPLP | Cần UI flow xác nhận, bảng `pplp_mantras_confirmed` |
| Cam kết 5 lời hứa cộng đồng | Cần UI + bảng tracking |
| Light Check-in hàng ngày | Cần UI widget + bảng `daily_checkins` |
| Không hiển thị bảng xếp hạng cạnh tranh | Cần redesign trang Admin stats + public ranking |
| Staking CAMLY tăng Reputation Weight | Chưa có smart contract staking |
| Cross-platform contribution score | Chưa có FUN Academy, FUN Earth, FUN Legal |
| AI phát hiện spam cảm xúc giả | Cần tích hợp AI layer riêng |
| Ẩn điểm chi tiết trên profile công khai | Channel.tsx chỉ hiện Light Level badge (đã thêm light_level vào ProfileData) |
