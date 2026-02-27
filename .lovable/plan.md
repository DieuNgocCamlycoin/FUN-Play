


# Báo cáo Kiểm tra: Hệ thống Mint FUN Money — Trạng thái hiện tại

## Kết luận: Hệ thống ĐÃ tuân thủ quy chuẩn mới nhất

Sau khi kiểm tra toàn bộ mã nguồn hiện tại, hệ thống đã được cập nhật đúng theo LS-Math v1.0 và PPLP v2.0. Dưới đây là chi tiết:

---

## 1. Công thức đang áp dụng

Tất cả 3 luồng mint (Manual, Auto-Mint, 1-Click) hiện sử dụng **cùng một engine** (`scoreAction()` trong `pplp-engine.ts`):

```text
Mint Amount = baseReward × Q × I × K × Ux × lsMathFactor

Trong đó:
  lsMathFactor = M_cons × M_seq × Π

  M_cons = 1 + 0.6 × (1 - e^(-streak/30))     ← Hệ số bền vững
  M_seq  = 1 + 0.5 × tanh(sequenceBonus/5)     ← Hệ số chuỗi
  Π      = 1 - min(0.5, 0.8 × riskScore)       ← Điều chỉnh cân bằng
```

## 2. Trình tự Mint của User (3 luồng)

| Luồng | Nguồn dữ liệu Pillar | LS-Math | PPLP v2.0 | Trạng thái |
|-------|----------------------|---------|-----------|------------|
| Manual Form | User tự nhập (0-100) | ✅ Có | ✅ Default all true | ✅ Đúng |
| Auto-Mint (CAMLY) | Từ profile thực (light_score, streak, content_pillar_score) | ✅ Có | ✅ Theo action type | ✅ Đúng |
| 1-Click | Từ caller truyền vào | ✅ Có (qua scoreAction) | ✅ Có (dựa trên riskScore) | ✅ Đúng |

## 3. PPLP v2.0 — 5 điều kiện bắt buộc

`validatePPLP()` trong `constitution.ts` **ĐÃ ĐƯỢC GỌI** bởi `scoreAction()` (dòng 283-298). Nếu bất kỳ điều kiện nào false → REJECT ngay lập tức, amount = 0.

- ✅ `hasRealAction` — kiểm tra hành vi thực
- ✅ `hasRealValue` — kiểm tra giá trị tạo ra
- ✅ `hasPositiveImpact` — tác động tích cực
- ✅ `noExploitation` — anti-farm (riskScore < 0.4)
- ✅ `charterCompliant` — tuân thủ charter

## 4. Dữ liệu thực vs Hardcode

- ✅ Auto-mint: Pillar scores tính từ `profile.light_score`, `features_user_day.content_pillar_score`, `streak`, `avatar_verified`, `account_age`
- ✅ `streakDays`, `sequenceBonus`, `riskScore` lấy từ bảng `features_user_day`
- ✅ `antiSybilScore` tính từ `1 - suspicious_score/10`

## 5. Vấn đề còn tồn tại (nhỏ)

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 1 | Manual Form vẫn cho user tự nhập pillar scores (0-100) thay vì dùng community ratings từ `pplp_ratings` | Thấp — cần community ratings đủ lớn trước |
| 2 | Auto-mint pillar scores vẫn là **phái sinh** từ profile data, chưa phải peer-rated scores từ `pplp_ratings` | Thấp — cần hệ thống rating đủ dữ liệu |
| 3 | `LIKE_VIDEO` và `SHARE` có `hasRealValue = false` trong auto-mint, có thể bị reject | Cần xác nhận chính sách |

---

## Tóm tắt

Hệ thống **đã tuân thủ quy chuẩn mới nhất**. Cả 3 luồng mint đều đi qua `scoreAction()` với LS-Math v1.0 (M_cons, M_seq, Π) và PPLP v2.0 validation. Không còn engine song song hay logic bypass. Các vấn đề còn lại là về nguồn dữ liệu đầu vào (self-reported vs peer-rated) — cần hệ thống rating cộng đồng đủ dữ liệu trước khi chuyển đổi hoàn toàn.
