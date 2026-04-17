/**
 * PPLP Engine v2.5 — 16Apr2026
 * "Verified Value Units" Engine
 * 
 * 3 LAYERS:
 * 1. Behavior Layer — Event capture → Context tagging → Quality filtering → Trust weighting
 * 2. Intention Layer — Intent Integrity Score (IIS) 0→1.5
 * 3. Impact Layer — Impact Multiplier (IM) 0→3.0
 * 
 * CORE FORMULA:
 * VVU_e = BaseValue × Quality × Trust × IIS × IM × AntiAbuse × ERP
 * 
 * PPLP Output → Verified Value Units (VVU) → Light Score Engine → Economic Layer
 */

import {
  resolveBaseValue,
  getQualityMultiplier,
  getTrustConfidence,
  classifyIIS,
  classifyImpact,
  classifyAAF,
  calculateEgoRiskPenalty,
  classifyEgoRisk,
  type EgoRiskSignals,
} from './light-score-params-v1';

// ===== TYPES =====

export type EventCategory =
  | 'content_creation' | 'learning' | 'social_interaction' | 'transaction'
  | 'identity_verification' | 'asset_holding' | 'community_service'
  | 'moderation' | 'governance' | 'referral' | 'staking';

export interface RawEvent {
  event_id: string;
  user_id: string;
  category: EventCategory;
  action_code: string;
  timestamp: string;
  proof_link?: string;
  metadata: Record<string, unknown>;
}

export interface ContextTag {
  platform: string;
  is_first_time: boolean;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  day_of_week: number;
  user_trust_tier: string; // now accepts 5-level tier IDs too
  account_age_days: number;
}

// ===== 1. BEHAVIOR LAYER =====

export interface QualitySignals {
  content_length: number;
  content_originality: number;
  response_time_minutes: number;
  completion_rate: number;
  proof_verified: boolean;
}

export interface BehaviorOutput {
  base_value: number;
  quality_score: number;   // 0.3-1.8 (spec Q_e range)
  trust_weight: number;    // 0.5-1.5 (spec TC_e range)
  context_bonus: number;
}

/**
 * Behavior Layer — 4 steps
 * Now uses spec Parameter Table v1.0
 */
export function evaluateBehavior(
  event: RawEvent,
  context: ContextTag,
  quality: QualitySignals,
): BehaviorOutput {
  // Step 1: Base value from spec table
  const base_value = resolveBaseValue(event.action_code);

  // Step 2: Context bonus
  let context_bonus = 1.0;
  if (context.is_first_time) context_bonus += 0.1;
  if (context.time_of_day === 'morning' || context.time_of_day === 'evening') context_bonus += 0.05;

  // Step 3: Quality → mapped to spec Q_e levels (0.3-1.8)
  const lengthQ = Math.min(1, quality.content_length / 200);
  const origQ = quality.content_originality;
  const compQ = quality.completion_rate;
  const proofQ = quality.proof_verified ? 1.0 : 0.3;
  const rawQuality = lengthQ * 0.25 + origQ * 0.35 + compQ * 0.2 + proofQ * 0.2;
  const quality_score = getQualityMultiplier(rawQuality);

  // Step 4: Trust → 5-level TC_e (0.5-1.5)
  const trust_weight = getTrustConfidence(context.user_trust_tier);

  return {
    base_value,
    quality_score: round4(quality_score),
    trust_weight,
    context_bonus: round4(Math.max(0.8, Math.min(1.2, context_bonus))),
  };
}

// ===== 2. INTENTION LAYER =====

export interface IntentionSignals {
  active_streak_days: number;
  total_actions_30d: number;
  useful_actions_30d: number;
  farm_pattern_actions_30d: number;
  manipulation_flags: number;
  value_before_reward_ratio: number;
  self_vs_network_ratio: number;
  consistency_variance: number;
}

export interface IntentionOutput {
  iis: number;
  pattern: string; // classified IIS pattern ID
  breakdown: {
    consistency_signal: number;
    useful_ratio: number;
    manipulation_penalty: number;
    value_first_bonus: number;
    network_orientation: number;
  };
}

/**
 * Intent Integrity Score (IIS)
 * Scale: 0 → 1.5
 * 5 patterns: Spam(0-0.3) → Farming(0.5-0.8) → Normal(0.9-1.0) → Good(1.0-1.2) → Pure(1.2-1.5)
 */
export function evaluateIntention(signals: IntentionSignals): IntentionOutput {
  const streakFactor = Math.min(1, Math.log(1 + signals.active_streak_days) / Math.log(91));
  const variancePenalty = Math.max(0, 1 - signals.consistency_variance);
  const consistency_signal = round4(streakFactor * 0.6 + variancePenalty * 0.4);

  const totalActions = Math.max(1, signals.total_actions_30d);
  const useful_ratio = round4(Math.min(1, signals.useful_actions_30d / totalActions));
  const farmRatio = signals.farm_pattern_actions_30d / totalActions;
  const manipulation_penalty = round4(Math.exp(-signals.manipulation_flags * 2));
  const value_first_bonus = round4(signals.value_before_reward_ratio * 0.5);
  const network_orientation = round4(signals.self_vs_network_ratio);

  let iis =
    consistency_signal * 0.25 +
    useful_ratio * 0.25 +
    manipulation_penalty * 0.2 +
    network_orientation * 0.15 +
    value_first_bonus * 0.15;

  if (farmRatio > 0.3) {
    iis *= Math.max(0.1, 1 - farmRatio);
  }

  if (consistency_signal > 0.8 && useful_ratio > 0.7 && manipulation_penalty > 0.9) {
    iis = Math.min(1.5, iis * 1.5);
  }

  const finalIIS = round4(Math.max(0, Math.min(1.5, iis)));
  const pattern = classifyIIS(finalIIS);

  return {
    iis: finalIIS,
    pattern: pattern.id,
    breakdown: {
      consistency_signal,
      useful_ratio,
      manipulation_penalty,
      value_first_bonus,
      network_orientation,
    },
  };
}

// ===== 3. IMPACT LAYER =====

export interface ImpactSignals {
  helped_newbie_activate: number;
  helped_others_trust_increase: number;
  content_saved_count: number;
  content_reused_count: number;
  referral_active_count: number;
  referral_total_count: number;
  proposal_improvement_score: number;
  retention_contribution: number;
  community_quality_contribution: number;
  knowledge_contribution: number;
  healthy_liquidity_contribution: number;
}

export interface ImpactOutput {
  im: number;
  level: string; // classified impact level ID
  breakdown: {
    activation_help: number;
    trust_amplification: number;
    content_ripple: number;
    referral_quality: number;
    ecosystem_health: number;
  };
}

/**
 * Impact Multiplier (IM)
 * Scale: 0.5 → 3.0 (spec: None 0.5-0.8 → Massive 2.5-3.0)
 */
export function evaluateImpact(signals: ImpactSignals): ImpactOutput {
  const activation_help = round4(Math.min(1, Math.sqrt(signals.helped_newbie_activate) * 0.5));
  const trust_amplification = round4(Math.min(1, Math.sqrt(signals.helped_others_trust_increase) * 0.4));
  const contentImpact = signals.content_saved_count + signals.content_reused_count * 2;
  const content_ripple = round4(Math.min(1, Math.log(1 + contentImpact) / 5));
  const refTotal = Math.max(1, signals.referral_total_count);
  const referral_quality = round4((signals.referral_active_count / refTotal) * Math.min(1, Math.sqrt(signals.referral_active_count) * 0.3));
  const ecosystem_health = round4(
    (signals.proposal_improvement_score + signals.retention_contribution +
     signals.community_quality_contribution + signals.knowledge_contribution +
     signals.healthy_liquidity_contribution) * 0.2
  );

  const baseIm =
    activation_help * 0.25 +
    trust_amplification * 0.2 +
    content_ripple * 0.2 +
    referral_quality * 0.15 +
    ecosystem_health * 0.2;

  // Scale to spec range: minimum 0.5, max 3.0
  const im = round4(Math.max(0.5, Math.min(3.0, baseIm * 3.0)));
  const level = classifyImpact(im);

  return {
    im,
    level: level.id,
    breakdown: { activation_help, trust_amplification, content_ripple, referral_quality, ecosystem_health },
  };
}

// ===== 4. ANTI-ABUSE FACTOR =====

export interface AbuseSignals {
  fraud_score: number;
  sybil_probability: number;
  velocity_violation: boolean;
  duplicate_content: boolean;
  community_reports: number;
  ip_collision_score: number;
}

/**
 * Anti-Abuse Factor (AAF)
 * Scale: 0 → 1
 * 5 levels: Normal(1.0) → Suspicious(0.5-0.8) → Flag(0.2-0.5) → Near-spam(0.05-0.2) → Block(0)
 */
export function calculateAntiAbuseFactor(signals: AbuseSignals): { aaf: number; level: string } {
  let aaf = 1.0;
  aaf *= Math.exp(-signals.fraud_score * 4);
  aaf *= Math.max(0.05, 1 - signals.sybil_probability * 1.5);
  if (signals.velocity_violation) aaf *= 0.3;
  if (signals.duplicate_content) aaf *= 0.2;
  aaf *= Math.max(0.1, 1 - signals.community_reports * 0.15);
  aaf *= Math.max(0.3, 1 - signals.ip_collision_score * 0.5);
  const finalAAF = round4(Math.max(0, Math.min(1, aaf)));
  return { aaf: finalAAF, level: classifyAAF(finalAAF).id };
}

// ===== 5. EGO RISK PENALTY (ERP) — Pattern-based =====

export { calculateEgoRiskPenalty, type EgoRiskSignals };

// ===== 6. VVU CALCULATION =====

export interface VVUResult {
  vvu: number;
  components: {
    base_value: number;
    quality: number;
    trust: number;
    iis: number;
    im: number;
    aaf: number;
    erp: number;
  };
}

/**
 * CORE FORMULA:
 * VVU_e = BaseValue × Quality × Trust × IIS × IM × AntiAbuse × ERP
 */
export function calculateVVU(
  behavior: BehaviorOutput,
  intention: IntentionOutput,
  impact: ImpactOutput,
  aaf: number,
  erp: number,
): VVUResult {
  const vvu = round4(
    behavior.base_value *
    behavior.quality_score *
    behavior.trust_weight *
    behavior.context_bonus *
    intention.iis *
    impact.im *
    aaf *
    erp
  );

  return {
    vvu: Math.max(0, vvu),
    components: {
      base_value: behavior.base_value,
      quality: behavior.quality_score,
      trust: behavior.trust_weight,
      iis: intention.iis,
      im: impact.im,
      aaf,
      erp,
    },
  };
}

// ===== 7. FULL PIPELINE =====

export interface PPLPv25PipelineInput {
  event: RawEvent;
  context: ContextTag;
  quality: QualitySignals;
  intention: IntentionSignals;
  impact: ImpactSignals;
  abuse: AbuseSignals;
  ego_risk?: EgoRiskSignals;
}

export interface PPLPv25PipelineOutput {
  vvu: number;
  behavior: BehaviorOutput;
  intention: IntentionOutput;
  impact: ImpactOutput;
  aaf: number;
  aaf_level: string;
  erp: number;
  erp_level: string;
  components: VVUResult['components'];
}

/**
 * Full PPLP v2.5 Pipeline
 * Human Value Layer → PPLP Engine → VVU
 */
export function runPPLPv25Pipeline(input: PPLPv25PipelineInput): PPLPv25PipelineOutput {
  const behavior = evaluateBehavior(input.event, input.context, input.quality);
  const intention = evaluateIntention(input.intention);
  const impact = evaluateImpact(input.impact);
  const { aaf, level: aafLevel } = calculateAntiAbuseFactor(input.abuse);

  // ERP: now pattern-based Ego Risk Penalty (not time-decay)
  const egoSignals: EgoRiskSignals = input.ego_risk ?? {
    reward_claim_ratio: 0,
    shallow_content_ratio: 0,
    community_downvotes: 0,
    self_promotion_ratio: 0,
  };
  const erp = calculateEgoRiskPenalty(egoSignals);
  const erpLevel = classifyEgoRisk(erp);

  const result = calculateVVU(behavior, intention, impact, aaf, erp);

  return {
    vvu: result.vvu,
    behavior,
    intention,
    impact,
    aaf,
    aaf_level: aafLevel,
    erp,
    erp_level: erpLevel.id,
    components: result.components,
  };
}

// ===== ASYNC PIPELINE WITH LIVE TRUST =====

/**
 * Run PPLP v2.5 pipeline with live Trust Confidence resolved from trust_profile.
 * Falls back to context.user_trust_tier if userId is not provided.
 */
export async function runPPLPv25PipelineWithLiveTrust(
  input: PPLPv25PipelineInput,
  userId?: string,
): Promise<PPLPv25PipelineOutput & { live_tc?: number; live_tier?: string; sybil_risk?: number; sbt_bonus?: number }> {
  let liveTc: number | undefined;
  let liveTier: string | undefined;
  let sybilRisk: number | undefined;
  let sbtBonus = 0;

  if (userId) {
    try {
      const [{ resolveLiveTrust }, { getSbtTrustBonus }] = await Promise.all([
        import('@/lib/identity/trust-resolver'),
        import('@/lib/identity/sbt-trust-bonus'),
      ]);
      const [trust, bonus] = await Promise.all([
        resolveLiveTrust(userId),
        getSbtTrustBonus(userId),
      ]);
      liveTc = trust.tc;
      liveTier = trust.tier;
      sybilRisk = trust.sybil_risk;
      sbtBonus = bonus;
      // Override context tier so getTrustConfidence picks the live value
      input = { ...input, context: { ...input.context, user_trust_tier: trust.tier } };
    } catch (err) {
      console.warn('[pplp-engine-v25] live trust resolve failed, using static tier:', err);
    }
  }

  const out = runPPLPv25Pipeline(input);

  // SBT bonus boosts VVU by up to +15% (cap enforced in getSbtTrustBonus)
  let vvuAdjusted = out.vvu * (1 + sbtBonus);

  // Apply sybil penalty: high sybil risk reduces VVU
  if (sybilRisk !== undefined && sybilRisk >= 60) {
    const penalty = sybilRisk >= 80 ? 0.3 : 0.6;
    vvuAdjusted = vvuAdjusted * penalty;
  }

  return {
    ...out,
    vvu: vvuAdjusted,
    live_tc: liveTc,
    live_tier: liveTier,
    sybil_risk: sybilRisk,
    sbt_bonus: sbtBonus,
  };
}

// ===== UTILITY =====

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
