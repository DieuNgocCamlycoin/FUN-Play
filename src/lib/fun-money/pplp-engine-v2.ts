/**
 * PPLP Engine v2.0 — 15Apr2026
 * Human Value Recognition Engine
 * 
 * 5 PILLARS (Spec v2.0):
 * 1. Sám Hối (Repentance)
 * 2. Biết Ơn (Gratitude)
 * 3. Phụng Sự (Service)
 * 4. Giúp Đỡ (Help)
 * 5. Trao Tặng (Giving)
 * 
 * FORMULA: LightScore = ∑(Intent × Depth × Impact × Consistency × TrustFactor)
 * Scale: ∞ (uncapped, accumulative)
 * 
 * 5 CRITICAL RULES:
 * 1. No Proof → No Score
 * 2. Quality over quantity
 * 3. High Ego → Score reduction
 * 4. Helping others → Strong boost
 * 5. Fraud → Exponential decay
 */

// ===== PILLAR DEFINITIONS =====

export type PillarV2 = 'repentance' | 'gratitude' | 'service' | 'help' | 'giving';

export const PILLAR_V2_LIST: PillarV2[] = ['repentance', 'gratitude', 'service', 'help', 'giving'];

export interface PillarV2Config {
  id: PillarV2;
  label: string;
  labelVi: string;
  emoji: string;
  description: string;
}

export const PILLAR_V2_CONFIGS: Record<PillarV2, PillarV2Config> = {
  repentance: {
    id: 'repentance',
    label: 'Repentance',
    labelVi: 'Sám Hối',
    emoji: '🙏',
    description: 'Nhận ra lỗi lầm, chuyển hoá bản thân, buông bỏ bản ngã',
  },
  gratitude: {
    id: 'gratitude',
    label: 'Gratitude',
    labelVi: 'Biết Ơn',
    emoji: '💛',
    description: 'Lòng biết ơn chân thành, tri ân cuộc sống và người khác',
  },
  service: {
    id: 'service',
    label: 'Service',
    labelVi: 'Phụng Sự',
    emoji: '🙌',
    description: 'Phụng sự sự sống, hành động vì cộng đồng',
  },
  help: {
    id: 'help',
    label: 'Help',
    labelVi: 'Giúp Đỡ',
    emoji: '🤝',
    description: 'Giúp đỡ người khác, hỗ trợ thực tế, có kết quả',
  },
  giving: {
    id: 'giving',
    label: 'Giving',
    labelVi: 'Trao Tặng',
    emoji: '🎁',
    description: 'Cho đi vô điều kiện, quyên góp, chia sẻ tài nguyên',
  },
};

// ===== INPUT TYPES =====

export type ActivityPlatform = 'facebook' | 'telegram' | 'zoom' | 'youtube' | 'internal';
export type ActivityType = 'post' | 'livestream' | 'comment' | 'donation' | 'coaching' | 'volunteer' | 'report' | 'meditation' | 'sharing';

export interface PPLPv2Input {
  user_id: string;
  activity_type: ActivityType;
  platform: ActivityPlatform;
  content: string;
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    watch_time?: number; // seconds
    participants?: number;
    amount?: number; // for donations
  };
  timestamp: string;
  proof_link: string;
}

// ===== FEATURE EXTRACTION OUTPUT =====

export interface FeatureExtraction {
  // NLP Analysis
  gratitude_score: number;    // 0-1
  repentance_score: number;   // 0-1
  ego_signal: number;         // 0-1 (higher = more ego)
  authenticity: number;       // 0-1
  love_tone: number;          // 0-1

  // Behavior Analysis
  consistency: number;        // 0-1
  depth: number;              // 0-1
  response_quality: number;   // 0-1
  community_impact: number;   // 0-1

  // Engagement Quality (not raw counts)
  engagement_quality: number; // 0-1
}

// ===== FRAUD DETECTION OUTPUT =====

export interface FraudResult {
  fraud_score: number;   // 0-1
  confidence: number;    // 0-1
  flags: string[];
}

// ===== SCORING DIMENSIONS =====

export interface ScoringDimensions {
  intent: number;       // f(gratitude + repentance + low_ego)
  depth: number;        // content transformation quality
  impact: number;       // helped others, spread positivity
  consistency: number;  // sustained over time
  trust_factor: number; // identity × anti_fraud × community_validation
}

// ===== SCORING RESULT =====

export interface PPLPv2Result {
  user_id: string;
  light_score_delta: number;  // amount added from this action
  total_light_score: number;  // cumulative (∞ scale)
  level: LightLevelV2;
  trust_factor: number;
  fraud_risk: 'low' | 'medium' | 'high';
  dimensions: ScoringDimensions;
  pillar_contributions: Record<PillarV2, number>;
}

// ===== LIGHT LEVELS (∞ scale) =====

export interface LightLevelV2 {
  id: string;
  label: string;
  emoji: string;
  minScore: number;
  maxScore: number | null;
  color: string;
}

export const LIGHT_LEVELS_V2: LightLevelV2[] = [
  { id: 'light_seed', label: 'Light Seed', emoji: '🌱', minScore: 0, maxScore: 99, color: 'from-gray-400 to-gray-500' },
  { id: 'light_sprout', label: 'Light Sprout', emoji: '🌿', minScore: 100, maxScore: 499, color: 'from-green-400 to-emerald-500' },
  { id: 'light_builder', label: 'Light Builder', emoji: '🔨', minScore: 500, maxScore: 1999, color: 'from-cyan-400 to-blue-500' },
  { id: 'light_guardian', label: 'Light Guardian', emoji: '🛡️', minScore: 2000, maxScore: 4999, color: 'from-blue-400 to-indigo-500' },
  { id: 'light_leader', label: 'Light Leader', emoji: '👑', minScore: 5000, maxScore: 14999, color: 'from-amber-400 to-orange-500' },
  { id: 'cosmic_contributor', label: 'Cosmic Contributor', emoji: '✨', minScore: 15000, maxScore: null, color: 'from-purple-400 via-pink-500 to-amber-400' },
];

export function getLightLevelV2(score: number): LightLevelV2 {
  for (let i = LIGHT_LEVELS_V2.length - 1; i >= 0; i--) {
    if (score >= LIGHT_LEVELS_V2[i].minScore) return LIGHT_LEVELS_V2[i];
  }
  return LIGHT_LEVELS_V2[0];
}

// ===== CORE SCORING ENGINE =====

/**
 * Calculate scoring dimensions from feature extraction
 */
export function calculateDimensions(features: FeatureExtraction, fraud: FraudResult): ScoringDimensions {
  // RULE #3: High Ego → Score reduction
  const egoDiscount = 1 - features.ego_signal * 0.6; // ego_signal=1 → 40% remaining

  // Intent = f(gratitude + repentance + low_ego)
  const intent = (
    features.gratitude_score * 0.35 +
    features.repentance_score * 0.25 +
    features.authenticity * 0.25 +
    features.love_tone * 0.15
  ) * egoDiscount;

  // Depth = content transformation quality
  const depth = features.depth;

  // Impact = helped others + community spread
  // RULE #4: Helping others → Strong boost (1.5x multiplier)
  const helpBoost = features.community_impact > 0.5 ? 1.5 : 1.0;
  const impact = Math.min(1, features.community_impact * helpBoost);

  // Consistency = sustained over time
  const consistency = features.consistency;

  // Trust Factor = identity × anti_fraud × community_validation
  // RULE #5: Fraud → Exponential decay
  const antifraudFactor = Math.exp(-fraud.fraud_score * 5);
  const trust_factor = features.response_quality * antifraudFactor;

  return {
    intent: round4(intent),
    depth: round4(depth),
    impact: round4(impact),
    consistency: round4(consistency),
    trust_factor: round4(trust_factor),
  };
}

/**
 * Calculate pillar contributions from features
 * Each action contributes to relevant pillars based on NLP analysis
 */
export function calculatePillarContributions(
  features: FeatureExtraction,
  activityType: ActivityType,
): Record<PillarV2, number> {
  const base = {
    repentance: features.repentance_score,
    gratitude: features.gratitude_score,
    service: 0,
    help: features.community_impact,
    giving: 0,
  };

  // Activity-type boosts
  switch (activityType) {
    case 'donation':
      base.giving += 0.8;
      base.service += 0.3;
      break;
    case 'volunteer':
      base.service += 0.7;
      base.help += 0.5;
      break;
    case 'coaching':
      base.help += 0.8;
      base.service += 0.4;
      break;
    case 'livestream':
      base.service += 0.5;
      base.gratitude += features.love_tone * 0.3;
      break;
    case 'sharing':
      base.giving += 0.4;
      base.gratitude += 0.3;
      break;
    case 'meditation':
      base.repentance += 0.5;
      base.gratitude += 0.4;
      break;
    default:
      base.service += 0.3;
      break;
  }

  return {
    repentance: round4(Math.min(1, base.repentance)),
    gratitude: round4(Math.min(1, base.gratitude)),
    service: round4(Math.min(1, base.service)),
    help: round4(Math.min(1, base.help)),
    giving: round4(Math.min(1, base.giving)),
  };
}

/**
 * CORE FORMULA:
 * LightScore_delta = ∑(Intent × Depth × Impact × Consistency × TrustFactor) × ScaleFactor
 * 
 * ScaleFactor = 100 (so each high-quality action adds ~20-80 points)
 * LightScore accumulates infinitely — never resets
 */
export function calculateLightScoreDelta(
  dimensions: ScoringDimensions,
  pillarContributions: Record<PillarV2, number>,
  hasProof: boolean,
): number {
  // RULE #1: No Proof → No Score
  if (!hasProof) return 0;

  const { intent, depth, impact, consistency, trust_factor } = dimensions;

  // Core product
  const coreProduct = intent * depth * impact * consistency * trust_factor;

  // Pillar bonus: sum of all pillar contributions (0-5 range)
  const pillarBonus = Object.values(pillarContributions).reduce((sum, v) => sum + v, 0);

  // Scale factor: meaningful delta per action
  const SCALE_FACTOR = 100;

  // Final delta = (core_product + pillar_bonus_weight) × scale
  const delta = (coreProduct * 0.6 + (pillarBonus / 5) * 0.4) * SCALE_FACTOR;

  return Math.max(0, round2(delta));
}

/**
 * Full scoring pipeline for a single action
 */
export function scoreActionV2(
  input: PPLPv2Input,
  features: FeatureExtraction,
  fraud: FraudResult,
  currentTotalScore: number,
): PPLPv2Result {
  const hasProof = !!input.proof_link && input.proof_link.length > 0;
  const dimensions = calculateDimensions(features, fraud);
  const pillarContributions = calculatePillarContributions(features, input.activity_type);
  const delta = calculateLightScoreDelta(dimensions, pillarContributions, hasProof);

  const newTotal = round2(currentTotalScore + delta);
  const level = getLightLevelV2(newTotal);

  let fraudRisk: 'low' | 'medium' | 'high' = 'low';
  if (fraud.fraud_score >= 0.7) fraudRisk = 'high';
  else if (fraud.fraud_score >= 0.3) fraudRisk = 'medium';

  return {
    user_id: input.user_id,
    light_score_delta: delta,
    total_light_score: newTotal,
    level,
    trust_factor: dimensions.trust_factor,
    fraud_risk: fraudRisk,
    dimensions,
    pillar_contributions: pillarContributions,
  };
}

// ===== ENGAGEMENT QUALITY (RULE #2) =====

/**
 * Calculate engagement quality from raw metrics
 * RULE #2: Score tăng theo chất lượng, không theo số lượng
 */
export function calculateEngagementQuality(metrics: PPLPv2Input['metrics']): number {
  const commentWeight = 0.4;
  const watchTimeWeight = 0.35;
  const interactionDepthWeight = 0.25;

  // Comment quality: diminishing returns after 10
  const commentQ = Math.min(1, Math.sqrt((metrics.comments || 0) / 10));

  // Watch time quality: meaningful if > 5 min
  const watchTimeMinutes = (metrics.watch_time || 0) / 60;
  const watchQ = Math.min(1, Math.sqrt(watchTimeMinutes / 30));

  // Interaction depth: ratio of comments+shares to likes
  const likes = metrics.likes || 1;
  const depth = ((metrics.comments || 0) + (metrics.shares || 0)) / likes;
  const depthQ = Math.min(1, depth);

  return round4(
    commentQ * commentWeight +
    watchQ * watchTimeWeight +
    depthQ * interactionDepthWeight
  );
}

// ===== UTILITY =====

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
