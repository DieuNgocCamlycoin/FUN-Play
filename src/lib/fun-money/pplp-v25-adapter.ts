/**
 * PPLP v2.5 Mint Adapter — bridges legacy MintRequestInput to v2.5 VVU pipeline.
 *
 * Responsibilities:
 *  1. Map legacy action_type → v2.5 action_code
 *  2. Build PPLPv25PipelineInput from profile + features_user_day + on-the-fly signals
 *  3. Run runPPLPv25PipelineWithLiveTrust to get VVU + live trust + SBT bonus
 *  4. Convert VVU → FUN amount (atomic + formatted) using a calibrated rate
 *
 * Calibration: 1 VVU = 0.5 FUN base, then multiplied by quality of evidence.
 * This keeps emission below the 20M epoch cap while still rewarding high-VVU events.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  runPPLPv25PipelineWithLiveTrust,
  type PPLPv25PipelineInput,
  type PPLPv25PipelineOutput,
  type RawEvent,
  type ContextTag,
  type QualitySignals,
  type IntentionSignals,
  type ImpactSignals,
  type AbuseSignals,
} from './pplp-engine-v25';
import { LEGACY_ACTION_MAP } from './light-score-params-v1';

// ===== CALIBRATION =====
/** 1 VVU = N FUN. Tuned so that average daily user (VVU≈4) earns ~2 FUN/action. */
export const VVU_TO_FUN_RATE = 0.5;
/** Min FUN to allow mint (avoid dust/0 mints). */
export const MIN_FUN_AMOUNT = 0.01;
/** Max FUN per single mint request (anti-whale, 3% of 5M monthly pool / 30 days). */
export const MAX_FUN_PER_REQUEST = 5000;

// ===== ACTION CODE MAP =====
/** Legacy hook action_type → v2.5 action_code (light-score-params-v1) */
const ACTION_TO_V25_CODE: Record<string, string> = {
  WATCH_VIDEO: 'learning_completed',
  LIKE_VIDEO: 'daily_checkin',
  COMMENT: 'content_created',
  SHARE: 'daily_checkin',
  UPLOAD_VIDEO: 'content_created',
  CREATE_POST: 'content_created',
  LIGHT_ACTIVITY: 'daily_checkin',
  SIGNUP: 'profile_completed',
  WALLET_CONNECT: 'profile_completed',
};

export function mapActionToV25Code(actionType: string): string {
  return (
    ACTION_TO_V25_CODE[actionType] ??
    LEGACY_ACTION_MAP[actionType.toLowerCase()] ??
    'daily_checkin'
  );
}

// ===== BUILDERS =====
function getTimeOfDay(): ContextTag['time_of_day'] {
  const h = new Date().getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export interface AdapterInput {
  userId: string;
  actionType: string;
  walletAddress: string;
  evidence?: {
    description?: string;
    contentLength?: number;
    proofVerified?: boolean;
    isFirstTime?: boolean;
    videoId?: string;
  };
}

export interface AdapterOutput {
  vvu: number;
  funAmount: number;
  funAmountAtomic: string;
  decision: 'APPROVE' | 'REVIEW_HOLD' | 'REJECT';
  reasonCodes: string[];
  pipeline: PPLPv25PipelineOutput & {
    live_tc?: number;
    live_tier?: string;
    sybil_risk?: number;
    sbt_bonus?: number;
  };
  metadata: {
    action_code: string;
    base_value: number;
    quality: number;
    trust: number;
    iis: number;
    im: number;
    aaf: number;
    erp: number;
    live_tc?: number;
    live_tier?: string;
    sbt_bonus?: number;
    sybil_risk?: number;
  };
}

/**
 * Run the full v2.5 pipeline for a user action, fetching live profile + features.
 */
export async function runV25MintAdapter(input: AdapterInput): Promise<AdapterOutput> {
  const { userId, actionType, evidence = {} } = input;

  // 1) Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at, avatar_verified, light_score, suspicious_score')
    .eq('id', userId)
    .single();

  const accountAgeDays = profile
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // 2) Features (last day)
  const { data: features } = await (supabase as any)
    .from('features_user_day')
    .select(
      'consistency_streak, sequence_count, anti_farm_risk, content_pillar_score, ' +
        'avg_rating_weighted, count_help, count_donations, count_comments, count_shares, ' +
        'count_likes_given, count_videos, count_posts, count_reports_valid, onchain_value_score',
    )
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const f = features ?? {};
  const totalActions =
    (f.count_likes_given ?? 0) +
    (f.count_comments ?? 0) +
    (f.count_shares ?? 0) +
    (f.count_videos ?? 0) +
    (f.count_posts ?? 0) +
    (f.count_help ?? 0);
  const usefulActions =
    (f.count_comments ?? 0) +
    (f.count_videos ?? 0) +
    (f.count_posts ?? 0) +
    (f.count_help ?? 0) +
    (f.count_donations ?? 0);
  const riskScore: number = f.anti_farm_risk ?? 0;

  // 3) Build pipeline input
  const action_code = mapActionToV25Code(actionType);
  const event: RawEvent = {
    event_id: `${userId}-${Date.now()}`,
    user_id: userId,
    category: 'social_interaction',
    action_code,
    timestamp: new Date().toISOString(),
    metadata: { source: 'mint-adapter', original_action: actionType, video_id: evidence.videoId },
  };

  const context: ContextTag = {
    platform: 'fun.rich',
    is_first_time: !!evidence.isFirstTime,
    time_of_day: getTimeOfDay(),
    day_of_week: new Date().getDay(),
    user_trust_tier: 'T0', // overridden by live trust
    account_age_days: accountAgeDays,
  };

  const quality: QualitySignals = {
    content_length: evidence.contentLength ?? (action_code === 'content_created' ? 200 : 50),
    content_originality: f.content_pillar_score ? Math.min(1, f.content_pillar_score / 10) : 0.7,
    response_time_minutes: 0,
    completion_rate: f.avg_rating_weighted ? Math.min(1, f.avg_rating_weighted / 5) : 0.8,
    proof_verified: evidence.proofVerified ?? !!profile?.avatar_verified,
  };

  const intention: IntentionSignals = {
    active_streak_days: f.consistency_streak ?? 0,
    total_actions_30d: Math.max(totalActions, 1),
    useful_actions_30d: usefulActions,
    farm_pattern_actions_30d: Math.round(totalActions * riskScore),
    manipulation_flags: riskScore > 0.5 ? 1 : 0,
    value_before_reward_ratio: 0.6,
    self_vs_network_ratio: usefulActions > 0 ? Math.min(1, (f.count_help ?? 0) / usefulActions) : 0.3,
    consistency_variance: Math.max(0, 1 - (f.consistency_streak ?? 0) / 30),
  };

  const impact: ImpactSignals = {
    helped_newbie_activate: f.count_help ?? 0,
    helped_others_trust_increase: f.count_donations ?? 0,
    content_saved_count: 0,
    content_reused_count: 0,
    referral_active_count: 0,
    referral_total_count: 0,
    proposal_improvement_score: 0,
    retention_contribution: f.consistency_streak ? Math.min(1, f.consistency_streak / 30) : 0,
    community_quality_contribution: f.content_pillar_score ? Math.min(1, f.content_pillar_score / 10) : 0,
    knowledge_contribution: 0,
    healthy_liquidity_contribution: 0,
  };

  const abuse: AbuseSignals = {
    fraud_score: (profile?.suspicious_score ?? 0) / 10,
    sybil_probability: 0, // overridden by live sybil_risk
    velocity_violation: false,
    duplicate_content: false,
    community_reports: f.count_reports_valid ?? 0,
    ip_collision_score: 0,
  };

  const pipelineInput: PPLPv25PipelineInput = {
    event,
    context,
    quality,
    intention,
    impact,
    abuse,
  };

  // 4) Run with live trust (resolves TC + SBT bonus + sybil)
  const pipeline = await runPPLPv25PipelineWithLiveTrust(pipelineInput, userId);

  // 5) VVU → FUN
  const rawFun = pipeline.vvu * VVU_TO_FUN_RATE;
  const funAmount = Math.max(0, Math.min(MAX_FUN_PER_REQUEST, Number(rawFun.toFixed(4))));
  const funAmountAtomic = BigInt(Math.round(funAmount * 1e18)).toString();

  // 6) Decision
  let decision: AdapterOutput['decision'] = 'APPROVE';
  const reasonCodes: string[] = [];
  if (funAmount < MIN_FUN_AMOUNT) {
    decision = 'REJECT';
    reasonCodes.push('AMOUNT_BELOW_MIN');
  }
  if ((pipeline.sybil_risk ?? 0) >= 60) {
    decision = 'REJECT';
    reasonCodes.push('SYBIL_RISK_BLOCKED');
  } else if ((pipeline.sybil_risk ?? 0) >= 40) {
    decision = decision === 'REJECT' ? decision : 'REVIEW_HOLD';
    reasonCodes.push('SYBIL_RISK_REVIEW');
  }
  if (pipeline.aaf < 0.3) {
    decision = decision === 'REJECT' ? decision : 'REVIEW_HOLD';
    reasonCodes.push('AAF_LOW');
  }

  return {
    vvu: pipeline.vvu,
    funAmount,
    funAmountAtomic,
    decision,
    reasonCodes,
    pipeline,
    metadata: {
      action_code,
      base_value: pipeline.components.base_value,
      quality: pipeline.components.quality,
      trust: pipeline.components.trust,
      iis: pipeline.components.iis,
      im: pipeline.components.im,
      aaf: pipeline.components.aaf,
      erp: pipeline.components.erp,
      live_tc: pipeline.live_tc,
      live_tier: pipeline.live_tier,
      sbt_bonus: pipeline.sbt_bonus,
      sybil_risk: pipeline.sybil_risk,
    },
  };
}
