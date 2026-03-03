

## So sánh: Trước và Sau khi sửa `useLightActivity.ts`

### HIỆN TẠI (Sai spec)

```text
useLightActivity.ts — calculateMintableFun()
─────────────────────────────────────────────
FUN = count × BASE_REWARDS_FUN (cố định)

Ví dụ user có: 100 views, 20 likes, 5 comments, 3 shares, 1 upload
  views:    100 × 10  = 1,000 FUN
  likes:     20 ×  5  =   100 FUN
  comments:   5 × 15  =    75 FUN
  shares:     3 × 20  =    60 FUN
  uploads:    1 × 100 =   100 FUN
  ──────────────────────────────
  TỔNG = 1,335 FUN  ← Không có multiplier nào!

Vấn đề:
• Bỏ qua Q (Quality), I (Impact), K (Integrity), Ux (Unity)
• Bỏ qua M_cons (Consistency), M_seq (Sequence), Π (Penalty)
• User spam 1000 views = 10,000 FUN, user chất lượng cao cũng chỉ = 10,000 FUN
• Mâu thuẫn với scoreAction() trong pplp-engine.ts đã implement đầy đủ
```

### SAU KHI SỬA (Đúng LS-Math v1.0)

```text
useLightActivity.ts — calculateMintableFun() MỚI
─────────────────────────────────────────────────
FUN = Σ scoreAction(action) cho từng loại action
    = baseReward × Q × I × K × Ux  (per action)
    + áp dụng M_cons, M_seq, Π từ profile

Cùng ví dụ user: 100 views, 20 likes, 5 comments, 3 shares, 1 upload
Giả sử: Q=1.0, I=1.0, K=0.85, Ux=1.0 (Unity Score ~55)

  views:    100 × 10 × 1.0 × 1.0 × 0.85 × 1.0 =   850 FUN
  likes:     20 ×  5 × 1.0 × 1.0 × 0.85 × 1.0 =    85 FUN
  comments:   5 × 15 × 1.0 × 1.0 × 0.85 × 1.0 =    64 FUN
  shares:     3 × 20 × 1.0 × 1.0 × 0.85 × 1.0 =    51 FUN
  uploads:    1 × 100× 1.0 × 1.0 × 0.85 × 1.0 =    85 FUN
  ──────────────────────────────────────────────
  TỔNG ~1,135 FUN  ← Giảm vì K=0.85 (integrity chưa hoàn hảo)

Nếu user có Unity Score cao (Ux=1.5):  → ~1,700 FUN (thưởng thêm)
Nếu user suspicious (K=0):             → 0 FUN (bị chặn hoàn toàn)
```

### Bảng so sánh tổng quan

| Yếu tố | Hiện tại | Sau sửa |
|---------|----------|---------|
| **Công thức** | `count × fixed_base` | `base × Q × I × K × Ux` |
| **Quality (Q)** | ❌ Bỏ qua | ✅ 0.5–3.0 |
| **Impact (I)** | ❌ Bỏ qua | ✅ 0.5–5.0 |
| **Integrity (K)** | ❌ Bỏ qua | ✅ 0–1.0, chặn fraud |
| **Unity (Ux)** | ❌ Bỏ qua | ✅ 0.5–2.5, thưởng cộng đồng |
| **Anti-whale** | ❌ Không kiểm tra | ✅ Cap 3% pool |
| **Consistency** | ❌ Không tính | ✅ M_cons từ streakDays |
| **Sequence** | ❌ Không tính | ✅ M_seq từ sequenceBonus |
| **Spam user** | Nhận đầy đủ FUN | Bị giảm bởi K thấp |
| **User chất lượng** | Giống spam user | Nhận nhiều hơn (Q, Ux cao) |
| **Nguồn BASE_REWARDS** | Hardcode riêng | Import từ `pplp-engine.ts` |
| **UI hiển thị** | Chỉ base reward | Base + multiplied (so sánh) |

### Thay đổi code cụ thể

**1. Xóa** `BASE_REWARDS_FUN` hardcode (dòng 78-85) → import `BASE_REWARDS.FUN_PLAY` từ engine

**2. Sửa** `calculateMintableFun()` — gọi `scoreAction()` cho mỗi action type với đầy đủ tham số: pillarScores, unitySignals, antiSybilScore, streakDays, sequenceBonus, riskScore

**3. Thêm** `multipliedBreakdown` vào `LightActivity` interface — hiển thị FUN sau khi áp dụng multipliers (cạnh base breakdown hiện tại)

**4. Cập nhật** `ActivitySummary.tsx` — hiển thị thêm cột "Actual FUN" bên cạnh "Base FUN" để user thấy sự khác biệt do multipliers

### Tác động
- User spam/suspicious sẽ nhận **ít hơn** FUN (K thấp, Ux thấp)
- User chất lượng cao, cộng đồng tốt sẽ nhận **nhiều hơn** FUN (Q, Ux cao)
- Đúng spec LS-Math v1.0 end-to-end

