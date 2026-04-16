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
  day_of_week: number; // 0-6
  user_trust_tier: TrustTier;
  account_age_days: number;
}

export type TrustTier = 'new' | 'standard' | 'trusted' | 'veteran';

// ===== BASE VALUE CONFIG =====

const BASE_VALUES: Record<string, number> = {
  // Content
  post_created: 3.0,
  video_uploaded: 5.0,
  livestream_hosted: 6.0,
  course_published: 8.0,
  comment_quality: 1.5,
  
  // Learning
  video_watched_full: 1.0,
  course_completed: 4.0,
  
  // Social
  like_given: 0.3,
  share_given: 0.8,
  bookmark_given: 0.5,
  mentor_session: 6.0,
  help_newbie: 4.0,
  answer_question: 2.5,
  
  // Transaction
  donation_made: 5.0,
  reward_sent: 3.0,
  
  // Identity
  profile_completed: 2.0,
  pplp_accepted: 3.0,
  wallet_linked: 2.0,
  kyc_verified: 5.0,
  
  // Community
  report_valid: 2.0,
  mediation_joined: 3.0,
  proposal_submitted: 4.0,
  gov_vote_cast: 2.0,
  
  // Technical
  bug_reported: 3.0,
  pr_merged: 6.0,
  
  // Participation
  daily_checkin: 1.0,
  event_attended: 3.0,
  staking_active: 2.0,
};

// ===== 1. BEHAVIOR LAYER =====

export interface QualitySignals {
  content_length: number;       // word count or duration
  content_originality: number;  // 0-1 from AI/hash check
  response_time_minutes: number;
  completion_rate: number;      // 0-1
  proof_verified: boolean;
}

export interface BehaviorOutput {
  base_value: number;
  quality_score: number;        // 0-1
  trust_weight: number;         // 0-1.2
  context_bonus: number;        // 0.8-1.2
}

/**
 * Step 1: Event Capture → get base value
 * Step 2: Context Tagging → apply context modifier
 * Step 3: Quality Filtering → score quality
 * Step 4: Trust Weighting → weight by trust tier
 */
export function evaluateBehavior(
  event: RawEvent,
  context: ContextTag,
  quality: QualitySignals,
): BehaviorOutput {
  // Step 1: Base value
  const base_value = BASE_VALUES[event.action_code] ?? 1.0;

  // Step 2: Context bonus
  let context_bonus = 1.0;
  if (context.is_first_time) context_bonus += 0.1; // first-time bonus
  // Morning/evening = slightly higher (intention signal)
  if (context.time_of_day === 'morning' || context.time_of_day === 'evening') context_bonus += 0.05;

  // Step 3: Quality filtering
  const lengthQ = Math.min(1, quality.content_length / 200); // 200 words = full quality
  const origQ = quality.content_originality;
  const compQ = quality.completion_rate;
  const proofQ = quality.proof_verified ? 1.0 : 0.3; // No proof → 30% quality
  
  const quality_score = round4(
    lengthQ * 0.25 + origQ * 0.35 + compQ * 0.2 + proofQ * 0.2
  );

  // Step 4: Trust weighting
  const TRUST_WEIGHTS: Record<TrustTier, number> = {
    new: 0.6,
    standard: 0.85,
    trusted: 1.0,
    veteran: 1.15,
  };
  const trust_weight = TRUST_WEIGHTS[context.user_trust_tier];

  return {
    base_value,
    quality_score: Math.max(0, Math.min(1, quality_score)),
    trust_weight,
    context_bonus: Math.max(0.8, Math.min(1.2, context_bonus)),
  };
}

// ===== 2. INTENTION LAYER =====

export interface IntentionSignals {
  active_streak_days: number;
  total_actions_30d: number;
  useful_actions_30d: number;     // actions that benefited others
  farm_pattern_actions_30d: number; // repetitive low-value actions
  manipulation_flags: number;       // system-detected manipulation attempts
  value_before_reward_ratio: number; // actions before first reward claim 0-1
  self_vs_network_ratio: number;     // 0 = all self, 1 = all network benefit
  consistency_variance: number;      // low = steady, high = burst-then-idle
}

export interface IntentionOutput {
  iis: number; // Intent Integrity Score 0→1.5
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
 * 0 = blocked/near-zero
 * 1 = normal
 * >1 = pure, sustained, consistent contributor
 */
export function evaluateIntention(signals: IntentionSignals): IntentionOutput {
  // Consistency: low variance + steady streak = good
  const streakFactor = Math.min(1, Math.log(1 + signals.active_streak_days) / Math.log(91)); // 90 days = 1.0
  const variancePenalty = Math.max(0, 1 - signals.consistency_variance);
  const consistency_signal = round4(streakFactor * 0.6 + variancePenalty * 0.4);

  // Useful ratio: useful actions / total actions
  const totalActions = Math.max(1, signals.total_actions_30d);
  const useful_ratio = round4(Math.min(1, signals.useful_actions_30d / totalActions));

  // Farm ratio: farm patterns / total (penalty)
  const farmRatio = signals.farm_pattern_actions_30d / totalActions;
  
  // Manipulation penalty: exponential
  const manipulation_penalty = round4(Math.exp(-signals.manipulation_flags * 2));

  // Value-first bonus: people who contribute before claiming rewards
  const value_first_bonus = round4(signals.value_before_reward_ratio * 0.5);

  // Network orientation: benefits others vs self
  const network_orientation = round4(signals.self_vs_network_ratio);

  // Combined IIS
  let iis =
    consistency_signal * 0.25 +
    useful_ratio * 0.25 +
    manipulation_penalty * 0.2 +
    network_orientation * 0.15 +
    value_first_bonus * 0.15;

  // Farm penalty: heavily reduce if >30% farm actions
  if (farmRatio > 0.3) {
    iis *= Math.max(0.1, 1 - farmRatio);
  }

  // Scale to 0-1.5 range
  // Base score is 0-1, bonus for exceptional contributors
  if (consistency_signal > 0.8 && useful_ratio > 0.7 && manipulation_penalty > 0.9) {
    iis = Math.min(1.5, iis * 1.5); // Can reach up to 1.5 for pure contributors
  }

  return {
    iis: round4(Math.max(0, Math.min(1.5, iis))),
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
  helped_newbie_activate: number;       // helped someone activate
  helped_others_trust_increase: number; // helped others gain trust
  content_saved_count: number;          // others saved this content
  content_reused_count: number;         // others referenced/reshared
  referral_active_count: number;        // referred people who are ACTIVE
  referral_total_count: number;         // total referrals (for ratio)
  proposal_improvement_score: number;   // 0-1 for governance proposals
  retention_contribution: number;       // 0-1 helped retain users
  community_quality_contribution: number; // 0-1
  knowledge_contribution: number;       // 0-1
  healthy_liquidity_contribution: number; // 0-1
}

export interface ImpactOutput {
  im: number; // Impact Multiplier 0→3.0
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
 * Scale: 0 → 3.0
 * Measures real-world positive effect
 */
export function evaluateImpact(signals: ImpactSignals): ImpactOutput {
  // Activation help: helped newbies succeed
  const activation_help = round4(Math.min(1, Math.sqrt(signals.helped_newbie_activate) * 0.5));

  // Trust amplification: helped others grow
  const trust_amplification = round4(Math.min(1, Math.sqrt(signals.helped_others_trust_increase) * 0.4));

  // Content ripple: content that lives on
  const contentImpact = signals.content_saved_count + signals.content_reused_count * 2;
  const content_ripple = round4(Math.min(1, Math.log(1 + contentImpact) / 5));

  // Referral quality: ratio of active referrals to total
  const refTotal = Math.max(1, signals.referral_total_count);
  const referral_quality = round4((signals.referral_active_count / refTotal) * Math.min(1, Math.sqrt(signals.referral_active_count) * 0.3));

  // Ecosystem health: aggregate contribution
  const ecosystem_health = round4(
    signals.proposal_improvement_score * 0.2 +
    signals.retention_contribution * 0.2 +
    signals.community_quality_contribution * 0.2 +
    signals.knowledge_contribution * 0.2 +
    signals.healthy_liquidity_contribution * 0.2
  );

  // Combined IM (base 0-1, scaled to 0-3)
  const baseIm =
    activation_help * 0.25 +
    trust_amplification * 0.2 +
    content_ripple * 0.2 +
    referral_quality * 0.15 +
    ecosystem_health * 0.2;

  // Scale: multiply by 3 for exceptional impact
  const im = round4(Math.min(3.0, baseIm * 3.0));

  return {
    im: Math.max(0, im),
    breakdown: {
      activation_help,
      trust_amplification,
      content_ripple,
      referral_quality,
      ecosystem_health,
    },
  };
}

// ===== 4. ANTI-ABUSE FACTOR =====

export interface AbuseSignals {
  fraud_score: number;          // 0-1 from fraud detection
  sybil_probability: number;    // 0-1
  velocity_violation: boolean;
  duplicate_content: boolean;
  community_reports: number;
  ip_collision_score: number;   // 0-1
}

/**
 * Anti-Abuse Factor (AAF)
 * Scale: 0 → 1
 * 1 = clean, 0 = blocked
 */
export function calculateAntiAbuseFactor(signals: AbuseSignals): number {
  let aaf = 1.0;

  // Fraud: exponential decay
  aaf *= Math.exp(-signals.fraud_score * 4);

  // Sybil: strong penalty
  aaf *= Math.max(0.05, 1 - signals.sybil_probability * 1.5);

  // Velocity violation: flat penalty
  if (signals.velocity_violation) aaf *= 0.3;

  // Duplicate content: significant penalty
  if (signals.duplicate_content) aaf *= 0.2;

  // Community reports: diminishing
  aaf *= Math.max(0.1, 1 - signals.community_reports * 0.15);

  // IP collision
  aaf *= Math.max(0.3, 1 - signals.ip_collision_score * 0.5);

  return round4(Math.max(0, Math.min(1, aaf)));
}

// ===== 5. EPOCH RECENCY PREMIUM (ERP) =====

/**
 * ERP rewards recent activity more than old activity
 * Scale: 0.5 → 1.0
 */
export function calculateERP(eventAgeDays: number): number {
  // Recent (< 7d) = 1.0, old (> 90d) = 0.5
  if (eventAgeDays <= 7) return 1.0;
  if (eventAgeDays >= 90) return 0.5;
  return round4(1.0 - (eventAgeDays - 7) * (0.5 / 83));
}

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
  event_age_days: number;
}

export interface PPLPv25PipelineOutput {
  vvu: number;
  behavior: BehaviorOutput;
  intention: IntentionOutput;
  impact: ImpactOutput;
  aaf: number;
  erp: number;
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
  const aaf = calculateAntiAbuseFactor(input.abuse);
  const erp = calculateERP(input.event_age_days);

  const result = calculateVVU(behavior, intention, impact, aaf, erp);

  return {
    vvu: result.vvu,
    behavior,
    intention,
    impact,
    aaf,
    erp,
    components: result.components,
  };
}

// ===== UTILITY =====

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
