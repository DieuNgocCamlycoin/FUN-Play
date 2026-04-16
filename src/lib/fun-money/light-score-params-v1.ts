/**
 * Light Score Parameter Table v1.0 — 16Apr2026
 * Single source of truth for ALL tuning parameters
 * 
 * Design principles:
 * 1. No single variable decides everything
 * 2. All multipliers are bounded
 * 3. Quality > Volume
 * 4. Phase-tunable (Early / Growth / Mature)
 */

// ===== I. EVENT BASE VALUES (B_e) =====

export interface EventBaseConfig {
  code: string;
  label: string;
  min: number;
  max: number;
  default: number;
  category: EventCategoryV1;
}

export type EventCategoryV1 =
  | 'participation'
  | 'identity'
  | 'content'
  | 'learning'
  | 'social'
  | 'transaction'
  | 'governance'
  | 'technical'
  | 'legacy';

export const EVENT_BASE_VALUES: Record<string, EventBaseConfig> = {
  daily_checkin:        { code: 'daily_checkin',        label: 'Daily Check-in',         min: 0.1,  max: 0.3,   default: 0.2,   category: 'participation' },
  profile_completed:    { code: 'profile_completed',    label: 'Profile Completion',     min: 2,    max: 5,     default: 3,     category: 'identity' },
  did_verification:     { code: 'did_verification',     label: 'DID Verification',       min: 5,    max: 10,    default: 7,     category: 'identity' },
  soulbound_mint:       { code: 'soulbound_mint',       label: 'Soulbound Mint',         min: 8,    max: 15,    default: 10,    category: 'identity' },
  content_created:      { code: 'content_created',      label: 'Content Creation',       min: 1,    max: 5,     default: 3,     category: 'content' },
  content_saved_used:   { code: 'content_saved_used',   label: 'Content Saved/Used',     min: 2,    max: 10,    default: 5,     category: 'content' },
  learning_completed:   { code: 'learning_completed',   label: 'Learning Completion',    min: 1,    max: 4,     default: 2.5,   category: 'learning' },
  referral_raw:         { code: 'referral_raw',         label: 'Referral (raw)',         min: 0.5,  max: 2,     default: 1,     category: 'social' },
  referral_activated:   { code: 'referral_activated',   label: 'Referral Activated',     min: 5,    max: 20,    default: 10,    category: 'social' },
  transaction_real:     { code: 'transaction_real',     label: 'Real Transaction',       min: 0.5,  max: 3,     default: 1.5,   category: 'transaction' },
  contribution_system:  { code: 'contribution_system',  label: 'System Contribution',    min: 3,    max: 15,    default: 8,     category: 'technical' },
  gov_participation:    { code: 'gov_participation',    label: 'Governance Participation',min: 1,    max: 5,     default: 3,     category: 'governance' },
  proposal_successful:  { code: 'proposal_successful',  label: 'Successful Proposal',    min: 10,   max: 50,    default: 25,    category: 'governance' },
  long_term_asset:      { code: 'long_term_asset',      label: 'Long-term Value Asset',  min: 20,   max: 100,   default: 50,    category: 'legacy' },
  event_attended:       { code: 'event_attended',       label: 'Event Attended',         min: 1,    max: 5,     default: 3,     category: 'participation' },
};

/** Resolve base value — uses default, can be overridden */
export function getBaseValue(actionCode: string): number {
  const cfg = EVENT_BASE_VALUES[actionCode];
  return cfg?.default ?? 1.0;
}

/** Legacy mapping: old action codes → new spec codes */
export const LEGACY_ACTION_MAP: Record<string, string> = {
  post_created: 'content_created',
  video_uploaded: 'content_created',
  livestream_hosted: 'content_created',
  course_published: 'content_created',
  comment_quality: 'content_created',
  video_watched_full: 'learning_completed',
  course_completed: 'learning_completed',
  like_given: 'daily_checkin',
  share_given: 'daily_checkin',
  bookmark_given: 'daily_checkin',
  mentor_session: 'contribution_system',
  help_newbie: 'contribution_system',
  answer_question: 'contribution_system',
  donation_made: 'transaction_real',
  reward_sent: 'transaction_real',
  pplp_accepted: 'profile_completed',
  wallet_linked: 'profile_completed',
  kyc_verified: 'did_verification',
  report_valid: 'contribution_system',
  mediation_joined: 'contribution_system',
  proposal_submitted: 'gov_participation',
  gov_vote_cast: 'gov_participation',
  bug_reported: 'contribution_system',
  pr_merged: 'contribution_system',
  staking_active: 'transaction_real',
};

export function resolveBaseValue(actionCode: string): number {
  const mapped = LEGACY_ACTION_MAP[actionCode] ?? actionCode;
  return getBaseValue(mapped);
}

// ===== II. QUALITY LEVELS (Q_e) =====

export interface QualityLevel {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const QUALITY_LEVELS: QualityLevel[] = [
  { id: 'low',       label: 'Low (spam/sơ sài)',   min: 0.3,  max: 0.6 },
  { id: 'normal',    label: 'Normal',               min: 0.8,  max: 1.0 },
  { id: 'good',      label: 'Good',                 min: 1.0,  max: 1.3 },
  { id: 'excellent', label: 'Excellent',             min: 1.3,  max: 1.8 },
];

/** Map raw quality score (0-1) to spec Quality level (0.3-1.8) */
export function getQualityMultiplier(rawScore: number): number {
  if (rawScore < 0.3) return lerp(0.3, 0.6, rawScore / 0.3);
  if (rawScore < 0.6) return lerp(0.8, 1.0, (rawScore - 0.3) / 0.3);
  if (rawScore < 0.85) return lerp(1.0, 1.3, (rawScore - 0.6) / 0.25);
  return lerp(1.3, 1.8, Math.min(1, (rawScore - 0.85) / 0.15));
}

// ===== III. TRUST CONFIDENCE (TC_e) =====

export interface TrustLevel {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const TRUST_LEVELS: TrustLevel[] = [
  { id: 'unknown',  label: 'Unknown (chưa verify)',    min: 0.5, max: 0.8 },
  { id: 'basic',    label: 'Basic (email/phone)',       min: 0.8, max: 1.0 },
  { id: 'verified', label: 'Verified (DID)',            min: 1.0, max: 1.2 },
  { id: 'strong',   label: 'Strong (SBT + history)',    min: 1.2, max: 1.4 },
  { id: 'core',     label: 'Core (contributor lâu năm)',min: 1.4, max: 1.5 },
];

export type TrustTierV1 = 'unknown' | 'basic' | 'verified' | 'strong' | 'core';

const TRUST_MAP: Record<string, TrustTierV1> = {
  new: 'unknown',
  standard: 'basic',
  trusted: 'verified',
  veteran: 'strong',
};

export function getTrustConfidence(tier: string): number {
  const mapped = TRUST_MAP[tier] ?? tier;
  const level = TRUST_LEVELS.find(l => l.id === mapped);
  if (!level) return 0.8;
  return (level.min + level.max) / 2;
}

// ===== IV. INTENTION INTEGRITY (IIS_e) =====

export interface IISPattern {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const IIS_PATTERNS: IISPattern[] = [
  { id: 'spam',     label: 'Spam / exploit',           min: 0,   max: 0.3 },
  { id: 'farming',  label: 'Farming nhẹ',              min: 0.5, max: 0.8 },
  { id: 'normal',   label: 'Bình thường',               min: 0.9, max: 1.0 },
  { id: 'good',     label: 'Tốt, ổn định',              min: 1.0, max: 1.2 },
  { id: 'pure',     label: 'Thuần khiết, nhất quán',     min: 1.2, max: 1.5 },
];

export function classifyIIS(iis: number): IISPattern {
  if (iis <= 0.3) return IIS_PATTERNS[0];
  if (iis <= 0.8) return IIS_PATTERNS[1];
  if (iis <= 1.0) return IIS_PATTERNS[2];
  if (iis <= 1.2) return IIS_PATTERNS[3];
  return IIS_PATTERNS[4];
}

// ===== V. IMPACT LEVELS (IM_e) =====

export interface ImpactLevel {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const IMPACT_LEVELS: ImpactLevel[] = [
  { id: 'none',    label: 'Không ai dùng',     min: 0.5, max: 0.8 },
  { id: 'light',   label: 'Tương tác nhẹ',      min: 0.8, max: 1.0 },
  { id: 'clear',   label: 'Có ích rõ',          min: 1.0, max: 1.5 },
  { id: 'strong',  label: 'Lan tỏa mạnh',       min: 1.5, max: 2.5 },
  { id: 'massive', label: 'Tạo hệ quả lớn',    min: 2.5, max: 3.0 },
];

export function classifyImpact(im: number): ImpactLevel {
  if (im < 0.8) return IMPACT_LEVELS[0];
  if (im < 1.0) return IMPACT_LEVELS[1];
  if (im < 1.5) return IMPACT_LEVELS[2];
  if (im < 2.5) return IMPACT_LEVELS[3];
  return IMPACT_LEVELS[4];
}

// ===== VI. ANTI-ABUSE FACTOR (AAF_e) =====

export interface AAFLevel {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const AAF_LEVELS: AAFLevel[] = [
  { id: 'normal',     label: 'Bình thường',  min: 1.0,  max: 1.0 },
  { id: 'suspicious', label: 'Nghi ngờ',     min: 0.5,  max: 0.8 },
  { id: 'flagged',    label: 'Flag nhẹ',     min: 0.2,  max: 0.5 },
  { id: 'near_spam',  label: 'Gần spam',     min: 0.05, max: 0.2 },
  { id: 'blocked',    label: 'Block',        min: 0,    max: 0 },
];

export function classifyAAF(aaf: number): AAFLevel {
  if (aaf >= 0.9) return AAF_LEVELS[0];
  if (aaf >= 0.5) return AAF_LEVELS[1];
  if (aaf >= 0.2) return AAF_LEVELS[2];
  if (aaf > 0) return AAF_LEVELS[3];
  return AAF_LEVELS[4];
}

// ===== VII. EGO RISK PENALTY (ERP_e) — replaces time-decay ERP =====

export interface EgoRiskPattern {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const EGO_RISK_PATTERNS: EgoRiskPattern[] = [
  { id: 'neutral',   label: 'Trung tính',                min: 1.0,  max: 1.0 },
  { id: 'optimizing', label: 'Tối ưu reward',             min: 0.85, max: 0.9 },
  { id: 'clickbait', label: 'Clickbait / shallow',        min: 0.7,  max: 0.85 },
  { id: 'toxic',     label: 'Toxic / lệch hệ',           min: 0.5,  max: 0.7 },
];

export interface EgoRiskSignals {
  reward_claim_ratio: number;      // 0-1: claims/actions ratio (high = reward-seeking)
  shallow_content_ratio: number;   // 0-1: shallow content / total content
  community_downvotes: number;     // count of downvotes/reports
  self_promotion_ratio: number;    // 0-1: self-promo vs community content
}

/** Calculate Ego Risk Penalty from behavioral signals */
export function calculateEgoRiskPenalty(signals: EgoRiskSignals): number {
  let erp = 1.0;

  // Reward-seeking behavior
  if (signals.reward_claim_ratio > 0.7) erp -= 0.1;
  if (signals.reward_claim_ratio > 0.9) erp -= 0.1;

  // Shallow / clickbait content
  if (signals.shallow_content_ratio > 0.5) erp -= 0.15;
  if (signals.shallow_content_ratio > 0.8) erp -= 0.15;

  // Community negative feedback
  erp -= Math.min(0.2, signals.community_downvotes * 0.03);

  // Self-promotion
  if (signals.self_promotion_ratio > 0.6) erp -= 0.1;

  return Math.max(0.5, Math.min(1.0, round4(erp)));
}

export function classifyEgoRisk(erp: number): EgoRiskPattern {
  if (erp >= 0.95) return EGO_RISK_PATTERNS[0];
  if (erp >= 0.85) return EGO_RISK_PATTERNS[1];
  if (erp >= 0.7) return EGO_RISK_PATTERNS[2];
  return EGO_RISK_PATTERNS[3];
}

// ===== VIII. CONSISTENCY TABLE (C_t) =====

export interface ConsistencyBand {
  minDays: number;
  maxDays: number;
  multiplier: number;
}

export const CONSISTENCY_TABLE: ConsistencyBand[] = [
  { minDays: 1,   maxDays: 3,    multiplier: 0.95 },
  { minDays: 4,   maxDays: 7,    multiplier: 1.0 },
  { minDays: 8,   maxDays: 30,   multiplier: 1.05 },
  { minDays: 31,  maxDays: 90,   multiplier: 1.1 },
  { minDays: 91,  maxDays: 99999, multiplier: 1.2 },
];

export function getConsistencyMultiplier(streakDays: number): number {
  for (const band of CONSISTENCY_TABLE) {
    if (streakDays >= band.minDays && streakDays <= band.maxDays) {
      return band.multiplier;
    }
  }
  return 1.0;
}

// ===== IX. RELIABILITY TABLE (R_t) =====

export interface ReliabilityLevel {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const RELIABILITY_TABLE: ReliabilityLevel[] = [
  { id: 'abandon',    label: 'Hay bỏ dở',       min: 0.6, max: 0.8 },
  { id: 'normal',     label: 'Bình thường',       min: 0.9, max: 1.0 },
  { id: 'good',       label: 'Hoàn thành tốt',   min: 1.0, max: 1.1 },
  { id: 'excellent',  label: 'Rất đáng tin',      min: 1.1, max: 1.2 },
];

// ===== X. NETWORK MULTIPLIER TABLES =====

export const NETWORK_QUALITY_TABLE = [
  { id: 'empty',    label: 'Rỗng / inactive',  min: 0.2, max: 0.6 },
  { id: 'average',  label: 'Trung bình',        min: 0.8, max: 1.0 },
  { id: 'good',     label: 'Active tốt',        min: 1.0, max: 1.3 },
  { id: 'premium',  label: 'Rất chất lượng',    min: 1.3, max: 1.5 },
];

export const NETWORK_TRUST_TABLE = [
  { id: 'weak',     label: 'Nhiều account yếu', min: 0.5, max: 0.8 },
  { id: 'normal',   label: 'Bình thường',        min: 0.9, max: 1.0 },
  { id: 'verified', label: 'Verified cao',       min: 1.0, max: 1.2 },
  { id: 'strong',   label: 'Trust mạnh',         min: 1.2, max: 1.3 },
];

export const NETWORK_DIVERSITY_TABLE = [
  { id: 'cluster',  label: 'Cụm nhỏ',          min: 0.8, max: 0.8 },
  { id: 'moderate', label: 'Vừa',               min: 0.9, max: 1.0 },
  { id: 'good',     label: 'Đa dạng tốt',      min: 1.0, max: 1.1 },
  { id: 'diverse',  label: 'Rất đa dạng',       min: 1.1, max: 1.2 },
];

// ===== XI. LEGACY PARAMETER TABLES =====

export const LEGACY_PV_TABLE = [
  { id: 'low',    label: 'Thấp',         min: 1,  max: 5 },
  { id: 'medium', label: 'Trung bình',    min: 5,  max: 20 },
  { id: 'high',   label: 'Cao',           min: 20, max: 50 },
  { id: 'epic',   label: 'Rất cao',       min: 50, max: 100 },
];

export const LEGACY_AD_TABLE = [
  { id: 'low',       label: 'Ít dùng',       value: 0.5 },
  { id: 'light',     label: 'Dùng nhẹ',      value: 0.8 },
  { id: 'popular',   label: 'Phổ biến',       value: 1.0 },
  { id: 'standard',  label: 'Chuẩn hệ',      value: 1.3 },
];

/** Longevity: LO = log(1 + days_active) normalized */
export function calculateLongevity(daysActive: number): number {
  // 7d → 1, 30d → 1.5, 90d → 2, 365d → 3
  return round4(Math.log(1 + daysActive) / Math.log(1 + 7));
}

export const LEGACY_PU_TABLE = [
  { id: 'noise',   label: 'Gây nhiễu',    value: 0.5 },
  { id: 'neutral', label: 'Trung tính',    value: 1.0 },
  { id: 'good',    label: 'Tốt',           value: 1.2 },
  { id: 'pure',    label: 'Rất thuần',     value: 1.5 },
];

// ===== XII. TLS WEIGHT TABLE (PHASE-DEPENDENT) =====

export type SystemPhase = 'early' | 'growth' | 'mature';

export interface PhaseWeights {
  alpha: number;  // PLS weight
  beta: number;   // NLS weight
  gamma: number;  // LLS weight
}

export const TLS_PHASE_WEIGHTS: Record<SystemPhase, PhaseWeights> = {
  early:  { alpha: 0.7, beta: 0.2, gamma: 0.1 },
  growth: { alpha: 0.5, beta: 0.3, gamma: 0.2 },
  mature: { alpha: 0.4, beta: 0.3, gamma: 0.3 },
};

/** Current system phase — change this as the ecosystem matures */
export const CURRENT_PHASE: SystemPhase = 'early';

export function getPhaseWeights(phase?: SystemPhase): PhaseWeights {
  return TLS_PHASE_WEIGHTS[phase ?? CURRENT_PHASE];
}

// ===== XIII. ACTIVATION THRESHOLDS =====

export interface ActivationThreshold {
  feature: string;
  label: string;
  minDisplayLS: number;
  minTC?: number;
}

export const ACTIVATION_THRESHOLDS: ActivationThreshold[] = [
  { feature: 'earn_basic',      label: 'Earn Basic',              minDisplayLS: 10,   minTC: 0.8 },
  { feature: 'referral_rewards', label: 'Referral Rewards',       minDisplayLS: 50 },
  { feature: 'earn_advanced',   label: 'Earn Advanced',           minDisplayLS: 100 },
  { feature: 'governance_vote', label: 'Governance Vote',         minDisplayLS: 200 },
  { feature: 'proposal_submit', label: 'Proposal Submit',         minDisplayLS: 500 },
  { feature: 'validator_curator', label: 'Validator / Curator',   minDisplayLS: 1000 },
];

export function checkActivation(
  feature: string,
  displayLS: number,
  trustConfidence?: number,
): boolean {
  const threshold = ACTIVATION_THRESHOLDS.find(t => t.feature === feature);
  if (!threshold) return false;
  if (displayLS < threshold.minDisplayLS) return false;
  if (threshold.minTC && (trustConfidence ?? 0) < threshold.minTC) return false;
  return true;
}

// ===== XIV. DISPLAY NORMALIZATION =====

/** Raw LS → Display LS: 100 × log(1 + RawLS) */
export function rawToDisplay(rawLS: number): number {
  return round2(100 * Math.log(1 + Math.max(0, rawLS)));
}

/** Display LS → Raw LS (inverse) */
export function displayToRaw(displayLS: number): number {
  return Math.exp(displayLS / 100) - 1;
}

// ===== UTILITY =====

function lerp(a: number, b: number, t: number): number {
  return round4(a + (b - a) * Math.max(0, Math.min(1, t)));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
