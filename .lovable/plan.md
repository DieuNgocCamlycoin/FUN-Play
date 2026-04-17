

User wants me to build Identity + Trust Layer Spec v1.0. Let me check what already exists.
<lov-tool-use id="toolu_vrtx_01ASfk82xoAfz8MpCxd5U7hS" name="code--list_dir" integration-id="code" data="{\"dir_path\": \"src/lib/identity\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EGz8Ap6UW9j58pNgjUqsLZ" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%did%' OR table_name LIKE '%sbt%' OR table_name LIKE '%dib%' OR table_name LIKE '%trust%' OR table_name LIKE '%attestation%' OR table_name LIKE '%identity%') ORDER BY table_name;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01UGTF9H7Kfai4zpyicJjZLg" name="code--list_dir" integration-id="code" data="{\"dir_path\": \"src/lib/identity\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_014TsvV6ap8sjEHKe3oGcWLx" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%did%' OR table_name LIKE '%sbt%' OR table_name LIKE '%dib%' OR table_name LIKE '%trust%' OR table_name LIKE '%attestation%' OR table_name LIKE '%identity%') ORDER BY table_name;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01UQucqFG1A8Xu2K4zaHWuRT" name="code--view" integration-id="code" data="{\"file_path\": \"src/lib/identity/soulbound-types.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_016wtAsd3XDpuogDf9cwEmsu" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='user_identity_proofs' ORDER BY ordinal_position;\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01BBKZxbBLVYt1ebTVzgPYBz" name="supabase--read_query" integration-id="supabase" data="{\"query\": \"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%profile%' OR table_name LIKE '%wallet%' OR table_name LIKE '%blacklist%' OR table_name LIKE '%community%' OR table_name LIKE '%ip_track%' OR table_name LIKE '%epoch%' OR table_name LIKE '%governance%') ORDER BY table_name;\"}">
</lov-tool-use>
Cha đã rà soát hiện trạng. Hệ thống hiện có nền móng (DID levels 5-tier rút gọn, SBT types, DIB scoring, edge function `identity-trust-engine`) nhưng còn rất xa so với spec v1.0 con đề xuất. Cha trình kế hoạch:

<lov-plan>

## Kế hoạch: Identity + Trust Layer Spec v1.0 — Implementation

### Hiện trạng vs Spec v1.0

| Thành phần | Hiện có | Cần build |
|---|---|---|
| DID Registry | Chỉ `user_identity_proofs` (1 bảng) | 5-level (L0-L4), entity_type, status engine |
| SBT | Chỉ TypeScript types, **chưa có table/contract** | 6 nhóm SBT, on-chain anchor, issuance rules |
| DIB | Score formula in-memory | 7 vault, snapshot, public/private split |
| Trust Engine | TC_e đơn giản (5 input weighted) | TC = f(VS,BS,SS,OS,HS)×RF + 5-tier T0-T4 |
| Anti-Sybil | IP collision + blacklist cơ bản | Multi-signal sybil scoring 0-100 |
| Recovery | Không có | 4-layer (primary/wallet/guardian/governance) |
| Epoch Snapshot | `user_epoch_scores` (chỉ score) | Identity+Trust snapshot per epoch |
| Attestation | Không có | Peer attestation log |

### Phạm vi triển khai (Phase 1+2 — Foundation & Reputation)

Phase 3-4 (zk, AI-agent identity, org identity) để dành sau khi nền vững.

### Database Schema mới (8 bảng)

```text
did_registry           — gốc DID, 5 level, entity_type, status
identity_links         — wallet/social/device linking
trust_profile          — TC, tier, sybil/fraud risk, cleanliness
sbt_registry           — 6 nhóm SBT off-chain mirror
sbt_issuance_rules     — auto/semi-auto/governance rules
attestation_log        — peer attestations
identity_events        — event sourcing cho TC_delta
identity_epoch_snapshot — snapshot per epoch (audit + mint)
recovery_log           — recovery events với cooldown
```

Tất cả enable RLS, dùng `has_role()` SECURITY DEFINER.

### Code Structure

```text
src/lib/identity/
  did-registry.ts          — DID CRUD, level upgrade
  trust-engine-v1.ts       — TC = (0.30·VS + 0.25·BS + 0.15·SS + 0.20·OS + 0.10·HS) × RF
  trust-tier.ts            — T0-T4 mapping
  sbt-issuance.ts          — 6 SBT nhóm + 3 mode issuance
  dib-vault.ts             — 7 vault aggregator
  anti-sybil-engine.ts     — multi-signal scoring
  recovery-engine.ts       — 4-layer recovery
  epoch-snapshot.ts        — identity snapshot per epoch
  permission-matrix.ts     — activation matrix (earn/vote/propose/issue)
```

### Edge Functions mới

```text
did-registry-engine        — quản lý DID lifecycle, level upgrade
trust-engine-v1            — replace identity-trust-engine cũ với spec v1.0
sbt-issuance-engine        — auto-issue dựa rule, ghi sbt_registry
attestation-engine         — peer attestation + verify
identity-epoch-snapshot    — cron mỗi epoch
identity-recovery          — flow recovery 4 lớp
```

### Tích hợp với hệ hiện có

1. **PPLP v2.5**: `trust_engine.tc_e` thay TC_e static trong `runPPLPv25Pipeline`
2. **Light Score**: SBT trust_weight cộng vào multiplier
3. **Mint (FUN_MAIN)**: `pplp-mint-fun` check `trust_tier ≥ T2` mới mint full, T0/T1 sandbox
4. **Charter**: PPLP acceptance → tạo Identity SBT auto
5. **Governance**: Tier T3+ mới được vote/propose

### Permission Matrix (apply ngay)

| Action | Min DID | Min TC | SBT |
|---|---|---|---|
| Earn basic | L1 | 0.8 | optional |
| Referral reward | L2 | 0.9 | recommended |
| Governance vote | L2/L3 | 1.0 | yes |
| Proposal submit | L3 | 1.1 | yes |
| SBT issuer | L4 | 1.25 | required |

### UI mới

```text
src/pages/Identity.tsx           — DID dashboard cho user
src/components/Identity/
  DIDLevelCard.tsx               — hiển thị L0-L4 progress
  SBTGallery.tsx                 — 6 nhóm SBT badges
  TrustScoreCard.tsx             — TC + tier breakdown
  AttestationPanel.tsx           — give/receive attestation
  RecoverySetup.tsx              — setup 4-layer recovery
src/components/Admin/
  TrustEngineMonitor.tsx         — admin: sybil clusters, TC distribution
```

### Privacy & On-chain split

- **On-chain (later phase)**: DID anchor hash, SBT ownership, epoch trust root
- **Off-chain (now)**: raw signals, AI scoring, KYC docs (encrypted), device map
- **Public**: DID level, selected SBT badges, trust tier
- **Private**: KYC, phone/email, device hash, recovery data

### Thứ tự build (5 task)

1. **DB migrations** — 8 bảng mới + RLS + seed SBT issuance rules
2. **Trust Engine v1** — code + edge function (replace cũ)
3. **SBT issuance + DIB vault** — code + auto-issue cho user hiện tại đủ điều kiện
4. **Identity UI** — page `/identity` + dashboard cards
5. **Tích hợp PPLP/Mint/Governance** — wire TC_e mới vào pipelines hiện có + epoch snapshot cron

### Files

| File | Action |
|---|---|
| 9 migrations DB | Create |
| `src/lib/identity/*` (8 files mới) | Create |
| `src/lib/identity/identity-trust-layer.ts` | Update — dùng trust-engine-v1 |
| 6 edge functions mới | Create |
| `supabase/functions/identity-trust-engine` | Deprecate (keep proxy 1 tháng) |
| `supabase/functions/pplp-mint-fun` | Update — check trust_tier |
| `src/lib/fun-money/pplp-engine-v25.ts` | Update — đọc TC_e từ trust_profile |
| `src/pages/Identity.tsx` + 6 components | Create |
| `mem://architecture/identity-trust-layer-v1` | Update với spec v1.0 đầy đủ |

