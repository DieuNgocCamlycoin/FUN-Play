

# 🎯 Kế hoạch: Đăng ký 6 actions PPLP v2 + Mở cap lên 50M FUN/tháng

## Mục tiêu
Gỡ nghẽn hệ thống mint FUN bằng cách đăng ký thêm **5 action mới** lên contract `0x39A1b047...` (hiện chỉ có `FUN_REWARD`), nâng trần on-chain từ 1M → 6M FUN/ngày, và mở cap off-chain từ 5M → **50M FUN/tháng**.

## Quy trình tổng thể

```text
[1] Bé Trí (gov wallet) → mở /admin/pplp/register-actions
[2] Bấm "Register" cho 6 actions      → gọi govRegisterAction(name, 1)
[3] Edge function map action_type     → chọn on-chain action đúng
[4] Cap off-chain nâng 5M → 50M       → migration + audit log
[5] Re-mint 52 giao dịch stale (~1.95M FUN)
[6] Sau 30 ngày → deprecate FUN_REWARD
```

## 📦 Phase A — UI đăng ký 6 actions on-chain

**Tạo `src/config/pplp-action-registry.ts`** — danh sách chuẩn:

| # | On-chain name | Pillar | Mapping từ `light_actions.action_type` |
|---|---|---|---|
| 1 | `INNER_WORK` | Sám Hối | `journal_write`, `gratitude_practice`, inner reflection |
| 2 | `CHANNELING` | Biết Ơn | `vision_create`, `post_create`, `content_create` |
| 3 | `GIVING` | Trao Tặng | `donate_support`, gift FUN/CAMLY/BTC |
| 4 | `HELPING` | Giúp Đỡ | `comment_create`, mentor, support |
| 5 | `GRATITUDE` | Biết Ơn | `reaction`, `gratitude` |
| 6 | `SERVICE` | Phụng Sự | `share`, `livestream`, event hosting |

**Tạo `src/hooks/usePplpGovActions.ts`** — đọc/đăng ký action on-chain:
- `useReadContract` gọi `actions(hash)` cho từng action → trả về `{ allowed, deprecated, version }`
- `useWriteContract` gọi `govRegisterAction(name, version=1)` từ ví bé Trí
- Verify lại sau ký bằng cách re-fetch

**Tạo `src/pages/admin/PplpActionRegistration.tsx`**:
- Bảng 6 dòng: Name · Hash (keccak256) · Status badge · Gas ước tính · Nút Register
- Status: `chưa đăng ký` (đỏ) / `đã đăng ký` (xanh) / `deprecated` (xám)
- Hiển thị hash đầy đủ trước khi ký (chống ký nhầm)
- Toast confirm + auto re-verify sau tx success

**Route**: thêm vào `src/pages/Admin.tsx` tab mới hoặc route `/admin/pplp/register-actions`

**Doc `docs/pplp-action-registration-guide.md`**: hướng dẫn bé Trí step-by-step (kết nối ví, gas ~0.0005 BNB/action, faucet tBNB).

## 📦 Phase B — Edge function map action động

**Tạo `supabase/functions/pplp-authorize-mint/action-mapper.ts`**:
- Hàm `mapActionType(lightActionType: string): OnChainAction`
- Trả về `{ name, hash }` theo bảng mapping ở Phase A
- Default fallback: `FUN_REWARD` (cho 14 ngày đầu)

**Sửa `supabase/functions/pplp-authorize-mint/index.ts`**:
- Bỏ hardcode `action_name = "FUN_REWARD"`
- Khi mint request gộp nhiều `light_actions` → **chia thành nhiều mint request con** (1 request 1 action on-chain)
- Lưu đúng `action_name` + `action_hash` vào `pplp_mint_requests`
- Log mỗi lần map vào `pplp_v2_event_log` (event `action.mapped`)

**Backward compat**: trong 30 ngày, nếu mapping fail thì fallback về `FUN_REWARD`.

## 📦 Phase C — Nâng cap off-chain 5M → 50M

**Migration SQL** (chạy bằng insert tool, không phải migration tool vì là data update):

```sql
INSERT INTO pplp_v2_event_log (event_type, payload, created_by)
VALUES ('epoch.cap.updated', jsonb_build_object(
  'before', 5000000, 'after', 50000000,
  'reason', '6 actions registered on-chain → expand cap to 28% theoretical ceiling',
  'phase', 'C-direct-50M'
), 'system');

UPDATE epoch_config 
SET soft_ceiling = 50000000, updated_at = now()
WHERE config_key = 'default' AND is_active = true;
```

Sau update → trigger `pplp-epoch-snapshot` để re-snapshot epoch tháng 4.

## 📦 Phase D — Recovery 52 giao dịch hỏng

Sau khi 6 actions đã `allowed=true`:
- Chạy edge function `pplp-remint-stale` → re-mint 28 expired + 24 failed (~1.95M FUN)
- Mapping mới sẽ chia đều qua 6 actions → không nghẽn cap 1M/day

## 📦 Phase E — Memory updates

- Sửa `mem://constraints/contract-owner-access`: bé Trí có quyền gov + owner, gỡ blocker cũ
- Tạo `mem://smart-contracts/v1-2-1-action-registry`: 6 actions chính thức + hash
- Update `mem://economy/pplp-monthly-epoch-pool`: 5M → **50M FUN/tháng**
- Update Core rule: cap 50M

## 🔧 Files

**Tạo mới (5)**:
1. `src/config/pplp-action-registry.ts`
2. `src/hooks/usePplpGovActions.ts`
3. `src/pages/admin/PplpActionRegistration.tsx`
4. `supabase/functions/pplp-authorize-mint/action-mapper.ts`
5. `docs/pplp-action-registration-guide.md`

**Sửa (3)**:
1. `supabase/functions/pplp-authorize-mint/index.ts` — chia mint theo action
2. `src/components/admin/PplpMintTab.tsx` — thêm tab "Register Actions"
3. `src/pages/Admin.tsx` — route mới

## ✅ Acceptance criteria

1. 6 actions trên contract `0x39A1b047...` có `allowed=true, deprecated=false`
2. Edge function map đúng action cho từng `action_type`
3. Test mint 1 request mỗi action → lên block thành công
4. `epoch_config.soft_ceiling = 50000000`, snapshot tháng 4 đã refresh
5. 52 request stale re-mint xong, không revert vì cap
6. Memory `pplp-monthly-epoch-pool` ghi 50M
7. FUN_REWARD vẫn chạy song song trong 30 ngày (deprecate sau)

## ⚠️ Rủi ro & Mitigation

| Rủi ro | Mitigation |
|---|---|
| Bé Trí ký nhầm action name | UI hiển thị hash đầy đủ + auto verify sau ký |
| Edge map sai action | Fallback FUN_REWARD + log mọi lần map |
| Request `pending_sig` lúc đổi mapping | Chỉ áp dụng mapping mới cho request tạo sau timestamp X |
| Ví gov hết tBNB | Doc kèm link faucet |
| Cap 50M quá rộng → lạm phát đột biến | `pplp_v2_event_log` ghi nhận, có thể UPDATE giảm về 20M nhanh |

## 📋 Thứ tự triển khai

1. Update memory (gỡ blocker contract-owner-access)
2. Tạo `pplp-action-registry.ts` + `usePplpGovActions.ts`
3. Build trang `/admin/pplp/register-actions` + route
4. Bé Trí đăng ký 6 actions on-chain (~30 phút, ~0.003 BNB)
5. Verify on-chain qua hook
6. Refactor `pplp-authorize-mint` + `action-mapper.ts`
7. Migration SQL nâng cap 50M + audit log
8. Trigger re-snapshot epoch
9. Chạy `pplp-remint-stale` cho 52 giao dịch
10. Doc bé Trí + memory updates
11. Sau 30 ngày: gỡ FUN_REWARD khỏi mapping fallback

