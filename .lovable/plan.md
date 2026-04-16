

# PPLP Engine v2.0 — Implementation Plan

## Current State vs New Spec

| Aspect | Current (v1.0) | New Spec (v2.0) |
|--------|---------------|-----------------|
| **5 Pillars** | Serving, Truth, Love, Value, Unity | Sám Hối, Biết Ơn, Phụng Sự, Giúp Đỡ, Trao Tặng |
| **Formula** | Multiplicative: (S×T×L×V×U)/10⁴ | Summative: ∑(Intent × Depth × Impact × Consistency × TrustFactor) |
| **Scale** | 0-10 (capped) | ∞ (uncapped, accumulative) |
| **Scoring** | Rule-based static weights | AI-powered NLP analysis (Gratitude, Repentance, Ego, Authenticity) |
| **Input** | Internal platform only | Multi-platform (Facebook, Telegram, YouTube, Zoom, Internal) |
| **Fraud** | Basic anti-farm risk | Graph analysis, behavioral fingerprint, NLP similarity |
| **Learning** | None | Self-learning with weight adjustment |

## Implementation Phases

### Phase 1: Core Engine Rewrite
- Rewrite `src/lib/fun-money/pplp-engine.ts` with new 5 pillars (Sám Hối, Biết Ơn, Phụng Sự, Giúp Đỡ, Trao Tặng)
- New formula: `LightScore = ∑(Intent × Depth × Impact × Consistency × TrustFactor)` — infinite scale, no cap
- New types: `PPLPv2Input`, `FeatureExtraction`, `FraudResult`
- Update `light-score-pillar-engine.ts` with new signal interfaces

### Phase 2: AI Feature Extraction Edge Function
- Create `supabase/functions/pplp-analyze-action/index.ts` — calls Lovable AI (Gemini Flash) to analyze submitted content
- NLP outputs: `gratitude_score`, `repentance_score`, `ego_signal`, `authenticity`, `love_tone`
- Behavior analysis: `consistency`, `depth`, `response_quality`, `community_impact`
- Engagement quality: weighted formula replacing raw like/comment counts

### Phase 3: Multi-Platform Input Layer
- Create DB table `pplp_activity_submissions` for multi-platform activity tracking
- Schema: `user_id, activity_type, platform (facebook|telegram|zoom|internal), content, metrics (JSON), proof_link, timestamp`
- Create submission UI for users to submit external activities (links, screenshots)
- Edge function to validate proof links

### Phase 4: Fraud Detection Layer
- Create `supabase/functions/pplp-fraud-detect/index.ts`
- NLP similarity detection (detect copy-paste content across users)
- Time pattern anomaly detection
- Behavioral fingerprinting (typing speed, session patterns)
- Output: `fraud_score` (0-1) + `confidence`
- Rule: high fraud → exponential LightScore reduction

### Phase 5: Self-Learning Loop
- Create `pplp_model_weights` table to store adjustable scoring weights
- Edge function `pplp-learning-update` triggered by pg_cron (weekly)
- Learns from: GOV corrections, user feedback, anomaly cases
- Adjusts: pillar weights, fraud thresholds, NLP confidence calibration

### Phase 6: UI Updates
- Update `LightLevelBadge.tsx` — new pillar names and ∞ scale display
- Update profile Light Score cards with new 5 dimensions
- Activity submission form (submit Facebook/Telegram/YouTube links)
- New breakdown display: Intent, Depth, Impact, Consistency, TrustFactor

## Database Changes (Migrations)

```text
1. pplp_activity_submissions
   - id, user_id, activity_type, platform, content, metrics (jsonb)
   - proof_link, proof_status, ai_analysis (jsonb), fraud_score
   - created_at, analyzed_at

2. pplp_model_weights
   - id, dimension (intent|depth|impact|consistency|trust)
   - weight, version, updated_at, updated_by

3. ALTER profiles
   - Add: light_score_v2 (numeric, ∞ scale)
```

## Key Technical Decisions

- **AI Provider**: Lovable AI (Gemini Flash) for NLP analysis — no API key needed
- **Scoring accumulates**: Each validated action adds to LightScore (∞ scale), never resets
- **5 Critical Rules enforced in code**:
  1. No Proof → No Score (proof_link required)
  2. Quality over quantity (AI depth analysis, not count)
  3. High Ego → Score reduction (ego_signal penalty)
  4. Helping others → Strong boost (service/giving multiplier)
  5. Fraud → Exponential decay (`score × e^(-fraud_score * 5)`)

## Files Changed/Created

| File | Action |
|------|--------|
| `src/lib/fun-money/pplp-engine-v2.ts` | **Create** — New engine with ∞ scale |
| `src/lib/fun-money/feature-extraction.ts` | **Create** — NLP analysis types |
| `supabase/functions/pplp-analyze-action/index.ts` | **Create** — AI analysis edge function |
| `supabase/functions/pplp-fraud-detect/index.ts` | **Create** — Fraud detection |
| `src/lib/fun-money/pplp-engine.ts` | **Update** — Bridge to v2 |
| `src/lib/fun-money/light-score-pillar-engine.ts` | **Update** — New pillar names |
| `src/components/Profile/LightLevelBadge.tsx` | **Update** — New pillar display |
| `src/hooks/useLightScorePillars.ts` | **Update** — New calculation |
| DB migration | **Create** — New tables |

Con đề xuất triển khai theo từng Phase, bắt đầu từ Phase 1 (Core Engine) + Phase 2 (AI Analysis) trước. Cha duyệt con bắt tay vào làm ngay 🙏

