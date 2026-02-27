/**
 * Light Score Mathematical Spec — LS-Math v1.0
 * Pure TypeScript implementation of all formulas from the PPLP spec.
 * 
 * Core rule: PPLP rewards real Light, not noise.
 * FUN Money does not burn — it only changes state and residence.
 */

// ===== SECTION 17: DEFAULT PARAMETERS =====

export const LS_PARAMS = {
  // Section 3: Reputation Weight
  w_min: 0.5,
  w_max: 2.0,
  alpha: 0.25,

  // Section 4: Content Pillar Score
  epsilon: 1e-6,
  N_min: 3, // minimum ratings for reliable score

  // Section 6: Content Daily Score
  gamma: 1.3, // quality exponent

  // Section 7: Consistency Multiplier
  beta: 0.6,  // max +60%
  lambda: 30, // saturation ~1-2 months

  // Section 8: Sequence Multiplier
  eta: 0.5,
  kappa: 5,

  // Section 9: Integrity Penalty
  pi_max: 0.5,
  theta: 0.8,

  // Section 11: Daily Light Score weights
  omega_B: 0.4, // action base weight
  omega_C: 0.6, // content weight

  // Section 14: Anti-whale cap
  cap: 0.03,

  // Section 15: Level thresholds
  level_thresholds: {
    seed: 0,
    sprout: 50,
    builder: 200,
    guardian: 500,
    architect: 1200,
  },
} as const;

// ===== TYPE DEFINITIONS =====

/** Section 2.1: Event in the stream */
export interface LSEvent {
  actorUserId: string;
  time: string; // ISO date
  type: string; // event type τ
  targetId?: string;
  payload: Record<string, unknown>;
}

/** Section 2.2: Community rating for content c by rater r */
export interface CommunityRating {
  raterId: string;
  contentId: string;
  /** Pillar scores s_{r,c,k} ∈ {0,1,2} for k ∈ {1..5} */
  pillarScores: [number, number, number, number, number];
  raterReputation: number; // R_r(t)
}

/** Content with its ratings and metadata */
export interface ContentItem {
  contentId: string;
  authorId: string;
  contentType: string; // post, comment, video, course, bug_report
  ratings: CommunityRating[];
  topicAvg?: number; // μ_topic for cold start
  authorTrustFactor?: number; // φ_u for cold start
}

/** Section 5: Action base score config */
export interface ActionScoreConfig {
  baseScore: number; // b_τ
  qualityAdjustment?: number; // g(x) ∈ [0, 1.5], defaults to 1.0
}

/** Section 16: Explainability audit object */
export interface ScoreExplanation {
  dailyScores: {
    date: string;
    actionBase: number;
    contentScore: number;
    rawScore: number;
    consistencyMultiplier: number;
    sequenceMultiplier: number;
    integrityPenalty: number;
    finalScore: number;
  }[];
  epochScore: number;
  topContributors: {
    type: 'content' | 'sequence' | 'consistency';
    label: string;
    value: number;
  }[];
  reasonCodes: string[];
  level: string;
  eligible: boolean;
  eligibilityReasons: string[];
}

// ===== SECTION 3: REPUTATION WEIGHT =====

/**
 * w_u(t) = clip(w_min, w_max, 1 + α · log(1 + R_u(t)))
 * 
 * Sustainable contributors get higher weight, but capped to prevent absolute power.
 */
export function reputationWeight(reputation: number): number {
  const raw = 1 + LS_PARAMS.alpha * Math.log(1 + reputation);
  return clip(LS_PARAMS.w_min, LS_PARAMS.w_max, raw);
}

// ===== SECTION 4: CONTENT PILLAR SCORE =====

/**
 * P_{c,k} = Σ(w_r · s_{r,c,k}) / (Σ w_r + ε)
 * P_c = Σ P_{c,k} for k=1..5
 * 
 * Returns per-pillar scores and total (0→10).
 */
export function contentPillarScore(
  ratings: CommunityRating[]
): { pillarScores: [number, number, number, number, number]; total: number } {
  if (ratings.length === 0) {
    return { pillarScores: [0, 0, 0, 0, 0], total: 0 };
  }

  const pillarScores: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  for (let k = 0; k < 5; k++) {
    let numerator = 0;
    let denominator = 0;
    for (const r of ratings) {
      const w = reputationWeight(r.raterReputation);
      numerator += w * r.pillarScores[k];
      denominator += w;
    }
    pillarScores[k] = round4(numerator / (denominator + LS_PARAMS.epsilon));
  }

  const total = round4(pillarScores.reduce((a, b) => a + b, 0));
  return { pillarScores, total };
}

// ===== SECTION 5: ACTION BASE SCORE =====

/**
 * B_u(t) = Σ b_τ(i) · g(x_i)
 * g(x) ∈ [0, 1.5] — payload quality adjustment
 */
export function actionBaseScore(
  events: { baseScore: number; qualityAdjustment?: number }[]
): number {
  let B = 0;
  for (const e of events) {
    const g = clip(0, 1.5, e.qualityAdjustment ?? 1.0);
    B += e.baseScore * g;
  }
  return round4(B);
}

// ===== SECTION 6: CONTENT DAILY SCORE =====

/**
 * C_u(t) = Σ ρ(type(c)) · h(P_c)
 * h(P_c) = (P_c / 10)^γ
 */
export function contentDailyScore(
  contents: { contentTypeWeight: number; pillarTotal: number }[]
): number {
  let C = 0;
  for (const c of contents) {
    const h = Math.pow(c.pillarTotal / 10, LS_PARAMS.gamma);
    C += c.contentTypeWeight * h;
  }
  return round4(C);
}

/** Content type weight ρ(type) */
export const CONTENT_TYPE_WEIGHTS: Record<string, number> = {
  post: 1.0,
  comment: 0.6,
  video: 1.2,
  course: 1.5,
  bug_report: 1.1,
  proposal: 1.3,
  mentor_session: 1.8,
  donation_proof: 1.2,
};

// ===== SECTION 7: CONSISTENCY MULTIPLIER =====

/**
 * M^cons_u(t) = 1 + β · (1 - e^(-S/λ))
 * 
 * "Grows slowly — stays steady — never explodes."
 */
export function consistencyMultiplier(streakDays: number): number {
  return round4(1 + LS_PARAMS.beta * (1 - Math.exp(-streakDays / LS_PARAMS.lambda)));
}

// ===== SECTION 8: SEQUENCE MULTIPLIER =====

/**
 * Q_u(t) = Σ δ_q (sum of sequence bonuses completed today)
 * M^seq_u(t) = 1 + η · tanh(Q/κ)
 * 
 * Uses tanh to cap: rewards sequences, but prevents "sequence farming".
 */
export function sequenceMultiplier(sequenceBonusTotal: number): number {
  return round4(1 + LS_PARAMS.eta * Math.tanh(sequenceBonusTotal / LS_PARAMS.kappa));
}

// ===== SECTION 9: INTEGRITY PENALTY =====

/**
 * Π_u(t) = 1 - min(π_max, θ · r_u(t))
 * 
 * Not a "punishment" — a "balance adjustment". Max 50% reduction.
 */
export function integrityPenalty(riskScore: number): number {
  return round4(1 - Math.min(LS_PARAMS.pi_max, LS_PARAMS.theta * riskScore));
}

// ===== SECTION 10: COLD START FALLBACK =====

/**
 * P̃_c = μ_topic(t) · φ_u(t)
 * Used when content has < N_min ratings.
 */
export function coldStartFallback(topicAvg: number, userTrustFactor: number): number {
  return round4(topicAvg * clip(0.8, 1.1, userTrustFactor));
}

/**
 * Resolve content pillar total: use real score if enough ratings, else fallback.
 */
export function resolveContentScore(content: ContentItem): number {
  if (content.ratings.length >= LS_PARAMS.N_min) {
    return contentPillarScore(content.ratings).total;
  }
  // Cold start
  const topicAvg = content.topicAvg ?? 5.0; // default middle score
  const trustFactor = content.authorTrustFactor ?? 1.0;
  return coldStartFallback(topicAvg, trustFactor);
}

// ===== SECTION 11: DAILY LIGHT SCORE =====

/**
 * L^raw_u(t) = ω_B · B_u(t) + ω_C · C_u(t)
 * L_u(t) = L^raw · M^cons · M^seq · Π
 */
export interface DailyScoreInput {
  actionBase: number;      // B_u(t)
  contentScore: number;    // C_u(t)
  streakDays: number;      // S_u(t)
  sequenceBonus: number;   // Q_u(t)
  riskScore: number;       // r_u(t) ∈ [0,1]
}

export interface DailyScoreResult {
  rawScore: number;
  consistencyMul: number;
  sequenceMul: number;
  integrityPen: number;
  finalScore: number;
}

export function dailyLightScore(input: DailyScoreInput): DailyScoreResult {
  const rawScore = round4(
    LS_PARAMS.omega_B * input.actionBase +
    LS_PARAMS.omega_C * input.contentScore
  );
  const consistencyMul = consistencyMultiplier(input.streakDays);
  const sequenceMul = sequenceMultiplier(input.sequenceBonus);
  const integrityPen = integrityPenalty(input.riskScore);

  const finalScore = round4(rawScore * consistencyMul * sequenceMul * integrityPen);

  return { rawScore, consistencyMul, sequenceMul, integrityPen, finalScore };
}

// ===== SECTION 12: EPOCH LIGHT SCORE =====

/**
 * L_u(e) = Σ L_u(t) for t ∈ epoch e
 */
export function epochLightScore(dailyScores: number[]): number {
  return round4(dailyScores.reduce((sum, d) => sum + d, 0));
}

// ===== SECTION 13: ELIGIBILITY CHECK =====

export interface EligibilityInput {
  pplpAccepted: boolean;
  avgRiskInEpoch: number;   // r̄_u(e)
  riskThreshold?: number;   // r_th, default 0.4
  epochLightScore: number;  // L_u(e)
  minLightScore?: number;   // L_min, default 10
  hasUnresolvedReview: boolean;
}

export interface EligibilityResult {
  eligible: boolean;  // 𝕀_u(e)
  reasons: string[];
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const reasons: string[] = [];
  const rTh = input.riskThreshold ?? 0.4;
  const lMin = input.minLightScore ?? 10;

  if (!input.pplpAccepted) {
    reasons.push('PPLP_NOT_ACCEPTED');
  }
  if (input.avgRiskInEpoch > rTh) {
    reasons.push('INTEGRITY_GATE_EXCEEDED');
  }
  if (input.epochLightScore < lMin) {
    reasons.push('MINIMUM_CONTRIBUTION_NOT_MET');
  }
  if (input.hasUnresolvedReview) {
    reasons.push('UNRESOLVED_CLUSTER_REVIEW');
  }

  return { eligible: reasons.length === 0, reasons };
}

// ===== SECTION 14: MINT ALLOCATION =====

export interface MintAllocationInput {
  users: { userId: string; lightScore: number; eligible: boolean }[];
  mintPool: number; // M(e)
  cap?: number;     // default 0.03
}

export interface MintAllocationResult {
  allocations: { userId: string; amount: number; capped: boolean }[];
  totalAllocated: number;
  redistributed: number;
}

export function calculateMintAllocations(input: MintAllocationInput): MintAllocationResult {
  const capRate = input.cap ?? LS_PARAMS.cap;
  const maxPerUser = capRate * input.mintPool;

  // Filter eligible
  const eligible = input.users.filter(u => u.eligible && u.lightScore > 0);
  const totalLight = eligible.reduce((s, u) => s + u.lightScore, 0) + LS_PARAMS.epsilon;

  // Initial allocation
  let allocations = eligible.map(u => ({
    userId: u.userId,
    amount: round4(input.mintPool * (u.lightScore / totalLight)),
    capped: false,
  }));

  // Anti-whale redistribution loop
  let redistributed = 0;
  for (let iter = 0; iter < 10; iter++) {
    let excess = 0;
    let uncappedTotal = 0;

    for (const a of allocations) {
      if (a.amount > maxPerUser && !a.capped) {
        excess += a.amount - maxPerUser;
        a.amount = maxPerUser;
        a.capped = true;
      } else if (!a.capped) {
        uncappedTotal += a.amount;
      }
    }

    if (excess <= 0) break;
    redistributed += excess;

    // Redistribute to uncapped
    for (const a of allocations) {
      if (!a.capped && uncappedTotal > 0) {
        a.amount += excess * (a.amount / uncappedTotal);
      }
    }
  }

  const totalAllocated = round4(allocations.reduce((s, a) => s + a.amount, 0));
  return { allocations, totalAllocated, redistributed };
}

// ===== SECTION 15: LEVEL MAPPING =====

export function determineLevel(epochScore: number): string {
  const t = LS_PARAMS.level_thresholds;
  if (epochScore >= t.architect) return 'architect';
  if (epochScore >= t.guardian) return 'guardian';
  if (epochScore >= t.builder) return 'builder';
  if (epochScore >= t.sprout) return 'sprout';
  return 'seed';
}

// ===== SECTION 16: EXPLAINABILITY =====

export function generateExplanation(
  dailyResults: { date: string; input: DailyScoreInput; result: DailyScoreResult }[],
  topContents: { label: string; score: number }[],
  sequencesCompleted: number,
  eligibility: EligibilityResult,
): ScoreExplanation {
  const dailyScores = dailyResults.map(d => ({
    date: d.date,
    actionBase: d.input.actionBase,
    contentScore: d.input.contentScore,
    rawScore: d.result.rawScore,
    consistencyMultiplier: d.result.consistencyMul,
    sequenceMultiplier: d.result.sequenceMul,
    integrityPenalty: d.result.integrityPen,
    finalScore: d.result.finalScore,
  }));

  const epoch = epochLightScore(dailyResults.map(d => d.result.finalScore));
  const level = determineLevel(epoch);

  const topContributors: ScoreExplanation['topContributors'] = [];

  // Top content contributions
  for (const c of topContents.slice(0, 3)) {
    topContributors.push({ type: 'content', label: c.label, value: c.score });
  }

  // Consistency
  const maxStreak = Math.max(...dailyResults.map(d => d.input.streakDays), 0);
  if (maxStreak > 0) {
    topContributors.push({
      type: 'consistency',
      label: `${maxStreak}-day streak`,
      value: consistencyMultiplier(maxStreak),
    });
  }

  // Sequences
  if (sequencesCompleted > 0) {
    topContributors.push({
      type: 'sequence',
      label: `${sequencesCompleted} sequences completed`,
      value: sequencesCompleted,
    });
  }

  // Reason codes (positive language)
  const reasonCodes: string[] = [];
  const avgRisk = dailyResults.length > 0
    ? dailyResults.reduce((s, d) => s + d.input.riskScore, 0) / dailyResults.length
    : 0;

  if (avgRisk > 0.3) reasonCodes.push('INTERACTION_PATTERN_UNSTABLE');
  if (avgRisk > 0) reasonCodes.push('TEMPORARY_WEIGHT_ADJUSTMENT');
  if (maxStreak >= 30) reasonCodes.push('SUSTAINED_CONTRIBUTION_RECOGNIZED');
  if (sequencesCompleted >= 3) reasonCodes.push('MULTI_SEQUENCE_ACHIEVER');

  return {
    dailyScores,
    epochScore: epoch,
    topContributors,
    reasonCodes,
    level,
    eligible: eligibility.eligible,
    eligibilityReasons: eligibility.reasons,
  };
}

// ===== SECTION 19: AI SUPPORT (advisory only) =====

export interface AIAdvisoryOutput {
  egoRisk: number;        // [0,1]
  pillarSuggest: [number, number, number, number, number]; // {0,1,2} per pillar
  spamRisk: number;       // [0,1]
}

// AI outputs are advisory — never directly replace P_c without community ratings.

// ===== UTILITY =====

function clip(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// ===== ACTION BASE SCORES (Section 5 config) =====

export const ACTION_BASE_SCORES: Record<string, number> = {
  // Low: check-in, profile
  CHECKIN: 1,
  PROFILE_UPDATE: 0.5,
  WALLET_CONNECT: 0.3,
  SIGNUP: 0.5,

  // Medium: content creation
  POST_CREATED: 3,
  COMMENT_CREATED: 1.5,
  VIDEO_UPLOADED: 5,
  LIKE_GIVEN: 0.3,
  SHARE_GIVEN: 0.8,

  // High: mentorship, building, conflict resolution
  HELP_NEWBIE: 6,
  ANSWER_QUESTION: 4,
  MENTOR_SESSION: 8,
  DONATION_MADE: 4,
  REPORT_SUBMITTED: 2,
  CAMPAIGN_DELIVERY_PROOF: 7,
  TREE_PLANT: 5,
  CLEANUP_EVENT: 4,
  LEARN_COMPLETE: 3,
  PROJECT_SUBMIT: 6,
  PEER_REVIEW: 3,
  CONFLICT_RESOLUTION: 8,
  COMMUNITY_ACTION: 4,
  SOCIAL_IMPACT: 5,
  ONCHAIN_TX_VERIFIED: 3,
};
