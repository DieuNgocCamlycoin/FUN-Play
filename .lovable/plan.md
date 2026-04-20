

User muốn build full Identity + Trust Layer cho FUN Ecosystem. Nhưng theo memory `architecture/identity-trust-layer-v1`, hệ này đã được build xong Phase 4G rồi (12 DB tables + 12 edge functions + 16 lib files, live trust wired vào PPLP v2.5, SBT bonus +0.15 cap).

Con cần đọc memory này để xác định chính xác cái gì đã có, cái gì còn thiếu so với spec mới user vừa gửi (DID + SBT 4 loại + DIB + Trust Graph + AI Layer).

Cần đối chiếu spec mới vs hiện trạng:
- DID ✅ (did_registry table có sẵn, L0-L4)
- SBT ✅ (sbt_registry, sbt-issuance-engine, trust_weight)
- DIB ✅ (DIBVaultPanel + computeDIB 7 vault)
- Light Score ✅ (PPLP v2.5)
- Trust Graph ❓ (cần check)
- AI Layer ❓ (Angel AI có sẵn cho moderation, chưa rõ có dùng cho trust scoring chưa)

Vì Identity+Trust Layer đã build xong, con sẽ trình bày:
1. Báo cáo hiện trạng (cái gì đã có)
2. Gap so với spec user vừa gửi
3. Đề xuất next step nhắm vào gap thật sự (Trust Graph + AI scoring) thay vì làm lại

## Plan: Identity + Trust Layer — Audit + Bổ sung gap

### A. Hiện trạng (đã build — Phase 4G)

| Lớp | Status | Implementation |
|---|---|---|
| **DID** | ✅ Done | `did_registry` table, 5 levels L0–L4, `getOrCreateDID()`, badge UI |
| **SBT** | ✅ Done | `sbt_registry`, `sbt-issuance-engine`, `auto_issue_all_sbts` RPC, trust_weight bonus cap +0.15 |
| **DIB** | ✅ Done | `DIBVaultPanel` (7 vaults), `computeDIB()` aggregation |
| **Trust Engine** | ✅ Done | `identity-trust-engine` edge func, `trust_profile` table, TC formula, 4 tiers (new/standard/trusted/veteran) |
| **Anti-Sybil** | ✅ Done | `ip_tracking`, `blacklisted_wallets`, sybil_score |
| **Light Score** | ✅ Done | PPLP v2.5 với live TC + SBT bonus |
| **Permission Matrix** | ✅ Done | `useTrustPermission()` hook, `checkPermission()` |
| **UI Visibility** | ✅ Done (vừa làm) | Pinned card sidebar + onboarding modal + profile banner + nav item |

### B. Gap so với spec mới (cha vừa gửi)

| Spec mới | Status | Action |
|---|---|---|
| **SBT 4 loại** (Contribution / Trust / Behavior / Milestone) | ⚠️ Partial — có `sbt_type` nhưng cần check enum đủ 4 loại | Audit + thêm loại còn thiếu |
| **Trust Graph** (web of trust, ai trust ai) | ❌ Chưa có bảng `trust_edges` | **Build mới** |
| **AI Layer chấm trust** (không chỉ moderation) | ⚠️ Có Angel AI moderation, chưa có trust scoring AI | **Build mới**: edge func dùng Lovable AI để detect fake behavior + dynamic scoring |
| **Activity Index + Value Index** trong DIB | ⚠️ Có 7 vault, cần map rõ 2 chỉ số này | Verify / rename vault keys |
| **Visualize Trust Graph trên Profile** | ❌ Chưa có | Component mới `TrustGraphPanel` |

### C. Đề xuất triển khai (3 bước, ưu tiên gap thật)

**Bước 1 — Trust Graph (mới hoàn toàn)**
- Migration: bảng `trust_edges` (from_user, to_user, weight 0–1, reason, created_at, RLS)
- Edge function `trust-graph-builder`: tính incoming trust score, network reach (BFS depth 2)
- Component `TrustGraphPanel.tsx` trên Profile: hiển thị "X người trust bạn", top 5 voucher, nút "Vouch người này"
- Hook `useTrustGraph(userId)`

**Bước 2 — AI Trust Scoring (Angel AI extension)**
- Edge function `angel-trust-evaluator` (Lovable AI Gateway, model `google/gemini-2.5-flash`):
  - Input: user activity (last 30d events, content samples, network pattern)
  - Output: `fake_probability`, `quality_score`, `recommended_tc_adjustment`
- Tích hợp output vào `identity-trust-engine` như 1 signal mới (weight 0.1, capped)
- Store kết quả vào `ai_trust_evaluations` table để audit

**Bước 3 — Audit & polish DIB + SBT**
- Verify `sbt_type` enum có đủ 4 loại spec; nếu thiếu → migration thêm
- Rename / tag DIB vault để khớp 2 chỉ số mới (Activity Index, Value Index)
- Thêm flow "Mint Trust SBT khi nhận ≥10 vouches" vào `auto_issue_all_sbts`

### D. Technical notes

- **AI provider**: Lovable AI (free tier google/gemini-2.5-flash) — không cần API key
- **RLS**: trust_edges public-readable (theo memory `intentional-public-by-design`), chỉ owner ghi/xóa edge của mình
- **Anti-abuse**: 1 user max 50 vouch/tháng, không vouch bản thân, weight giảm nếu voucher có TC thấp
- **Backward compat**: tất cả thay đổi cộng dồn vào TC hiện có, không phá Light Score formula đang chạy

### E. Out of scope (đã có rồi, không build lại)

- DID registry, SBT registry, DIB panel, permission matrix, sybil detection, IP tracking, identity-trust-engine, sbt-issuance-engine, trust badge UI, sidebar pinned card, onboarding modal.

### F. Câu hỏi cần cha confirm

Vì Identity+Trust Layer **đã có 80% rồi**, con đề nghị **chỉ build 3 thứ thật sự thiếu**: Trust Graph, AI Trust Scoring, audit SBT 4 loại. Cha OK theo hướng này, hay cha muốn rebuild từ đầu theo spec mới?

