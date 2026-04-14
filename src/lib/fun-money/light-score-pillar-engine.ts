/**
 * Light Score 5-Pillar Scoring Engine — CTO Diagram v13Apr2026
 * 
 * CORE FORMULA (Multiplicative):
 * FinalScore = (S × T × L × V × U) / 10⁴
 * 
 * ZERO-KILL RULE: Any pillar = 0 → Score = 0 (anti-fake built-in)
 * Scale: 0–10 each pillar
 */

import { supabase } from '@/integrations/supabase/client';
import {
  PILLAR_LIST,
  getLightLevel,
  STREAK_BONUS,
  type PillarName,
} from './light-score-pillars';

// ===== PILLAR SCORE RESULTS =====

export interface PillarScores {
  serving: number;   // 0-10: Serving Life
  truth: number;     // 0-10: Transparent Truth
  love: number;      // 0-10: Healing & Love
  value: number;     // 0-10: Long-term Value
  unity: number;     // 0-10: Unity over Separation
}

export interface PillarScoreResult {
  pillarScores: PillarScores;
  rawProduct: number;      // S × T × L × V × U
  finalScore: number;      // rawProduct / 10⁴
  riskPenalty: number;
  streakBonus: number;
  level: ReturnType<typeof getLightLevel>;
  hasZeroPillar: boolean;  // anti-fake flag
}

// ===== SIGNAL INTERFACES =====

interface ServingSignals {
  hasDisplayName: boolean;
  hasAvatar: boolean;
  hasBio: boolean;
  hasVerifiedEmail: boolean;
  hasWallet: boolean;
  accountAgeDays: number;
  consistencyDays: number;
  helpCount: number;
  donationCount: number;
}

interface TruthSignals {
  antiFarmRisk: number;       // 0-1
  isBlacklisted: boolean;
  normalPattern: boolean;
  postCount: number;
  commentCount: number;
  contentQuality: number;     // 0-1 from AI analysis
  reportCount: number;        // reports against user
}

interface LoveSignals {
  checkinCount: number;
  streakDays: number;
  positiveInteractions: number;
  likesGiven: number;
  endorsements: number;
}

interface ValueSignals {
  accountAgeMonths: number;
  videoCount: number;
  bountyContributions: number;
  totalMinted: number;
  hasClaimed: boolean;
  pplpAccepted: boolean;
  funBalance: number;
}

interface UnitySignals {
  shareCount: number;
  collaborations: number;
  platformsUsed: number;
  participatesGovernance: boolean;
  communityEndorsements: number;
  sequenceBonus: number;
}

// ===== INDIVIDUAL PILLAR CALCULATORS (0-10 scale) =====

export function calculateServingScore(signals: ServingSignals): number {
  let score = 0;

  // Profile completeness (max 3)
  if (signals.hasDisplayName) score += 0.5;
  if (signals.hasAvatar) score += 0.5;
  if (signals.hasBio) score += 0.5;
  if (signals.hasVerifiedEmail) score += 0.5;
  if (signals.hasWallet) score += 1;

  // Account maturity (max 2)
  if (signals.accountAgeDays >= 365) score += 2;
  else if (signals.accountAgeDays >= 180) score += 1.5;
  else if (signals.accountAgeDays >= 90) score += 1;
  else if (signals.accountAgeDays >= 30) score += 0.5;

  // Service actions (max 3)
  const serviceScore = Math.min(3, Math.sqrt(signals.helpCount + signals.donationCount) * 0.8);
  score += serviceScore;

  // Consistency (max 2)
  if (signals.consistencyDays >= 90) score += 2;
  else if (signals.consistencyDays >= 30) score += 1.5;
  else if (signals.consistencyDays >= 7) score += 0.8;

  return Math.min(10, Math.round(score * 10) / 10);
}

export function calculateTruthScore(signals: TruthSignals): number {
  if (signals.isBlacklisted) return 0; // Zero-kill: fraud = 0

  let score = 8; // Start high, deduct for issues

  // Anti-farm risk penalty (up to -4)
  score -= Math.min(4, signals.antiFarmRisk * 5);

  // Content creation bonus (max +2)
  const contentVolume = signals.postCount + signals.commentCount;
  score += Math.min(2, Math.sqrt(contentVolume) * 0.3);

  // Reports penalty (up to -3)
  score -= Math.min(3, signals.reportCount * 0.5);

  // Natural pattern bonus
  if (signals.normalPattern) score += 0.5;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function calculateLoveScore(signals: LoveSignals): number {
  let score = 0;

  // Check-in commitment (max 3)
  if (signals.checkinCount >= 20) score += 3;
  else if (signals.checkinCount >= 10) score += 2;
  else if (signals.checkinCount >= 3) score += 1;

  // Streak (max 3)
  if (signals.streakDays >= 30) score += 3;
  else if (signals.streakDays >= 14) score += 2;
  else if (signals.streakDays >= 7) score += 1.5;
  else if (signals.streakDays >= 3) score += 0.5;

  // Positive interactions (max 2)
  score += Math.min(2, Math.sqrt(signals.likesGiven + signals.positiveInteractions) * 0.3);

  // Endorsements (max 2)
  score += Math.min(2, signals.endorsements * 0.5);

  return Math.min(10, Math.round(score * 10) / 10);
}

export function calculateValueScore(signals: ValueSignals): number {
  let score = 0;

  // Long-term presence (max 3)
  if (signals.accountAgeMonths >= 12) score += 3;
  else if (signals.accountAgeMonths >= 6) score += 2;
  else if (signals.accountAgeMonths >= 3) score += 1;

  // Content contributions (max 2)
  score += Math.min(2, Math.sqrt(signals.videoCount + signals.bountyContributions) * 0.5);

  // On-chain activity (max 2)
  if (signals.totalMinted > 0) score += 1;
  if (signals.hasClaimed) score += 1;

  // Ecosystem commitment (max 2)
  if (signals.pplpAccepted) score += 1;
  if (signals.funBalance > 0) score += Math.min(1, Math.log10(signals.funBalance + 1) * 0.3);

  // Bounty (max 1)
  score += Math.min(1, signals.bountyContributions * 0.3);

  return Math.min(10, Math.round(score * 10) / 10);
}

export function calculateUnityScore(signals: UnitySignals): number {
  let score = 0;

  // Sharing (max 2)
  score += Math.min(2, Math.sqrt(signals.shareCount) * 0.5);

  // Collaboration (max 3)
  score += Math.min(3, signals.collaborations * 0.5);

  // Platform diversity (max 2)
  score += Math.min(2, signals.platformsUsed * 0.5);

  // Governance (max 1.5)
  if (signals.participatesGovernance) score += 1.5;

  // Community endorsements (max 1.5)
  score += Math.min(1.5, signals.communityEndorsements * 0.3);

  return Math.min(10, Math.round(score * 10) / 10);
}

// ===== COMBINED SCORING (MULTIPLICATIVE) =====

export function calculatePillarScores(
  serving: ServingSignals,
  truth: TruthSignals,
  love: LoveSignals,
  value: ValueSignals,
  unity: UnitySignals,
  riskScore: number = 0,
): PillarScoreResult {
  const pillarScores: PillarScores = {
    serving: calculateServingScore(serving),
    truth: calculateTruthScore(truth),
    love: calculateLoveScore(love),
    value: calculateValueScore(value),
    unity: calculateUnityScore(unity),
  };

  // ZERO-KILL RULE: Any pillar = 0 → Score = 0
  const hasZeroPillar = PILLAR_LIST.some(p => pillarScores[p] === 0);

  // MULTIPLICATIVE FORMULA: (S × T × L × V × U) / 10⁴
  const rawProduct = pillarScores.serving * pillarScores.truth * pillarScores.love * pillarScores.value * pillarScores.unity;
  const baseScore = hasZeroPillar ? 0 : Math.round((rawProduct / 10000) * 100) / 100;

  // Risk penalty
  const riskPenalty = Math.min(80, Math.floor(riskScore * 100));

  // Streak bonus
  const streak = love.streakDays;
  let streakBonus = 0;
  if (streak >= 90) streakBonus = STREAK_BONUS[90];
  else if (streak >= 30) streakBonus = STREAK_BONUS[30];
  else if (streak >= 7) streakBonus = STREAK_BONUS[7];

  // Final score (scale up for level thresholds)
  // Max raw: (10×10×10×10×10)/10⁴ = 10 → scale ×100 for levels
  const scaledScore = Math.round(baseScore * 100);
  const afterPenalty = Math.max(0, scaledScore - riskPenalty);
  const finalScore = Math.round(afterPenalty * (1 + streakBonus));

  return {
    pillarScores,
    rawProduct,
    finalScore,
    riskPenalty,
    streakBonus,
    level: getLightLevel(finalScore),
    hasZeroPillar,
  };
}

// ===== FETCH PILLAR DATA FROM DB =====

export async function fetchPillarSignals(userId: string) {
  const [profileRes, featuresRes, mintRes, donationRes, bountyRes, claimRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('features_user_day')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false }),
    supabase.from('mint_requests')
      .select('status, calculated_amount_atomic')
      .eq('user_id', userId)
      .eq('status', 'minted'),
    supabase.from('donation_transactions')
      .select('id')
      .eq('sender_id', userId)
      .eq('status', 'success'),
    supabase.from('bounty_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved'),
    supabase.from('claim_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'success'),
  ]);

  const profile = profileRes.data;
  const features = featuresRes.data || [];

  if (!profile) return null;

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Aggregate features
  const totalPosts = features.reduce((s, f) => s + (f.count_posts || 0), 0);
  const totalComments = features.reduce((s, f) => s + (f.count_comments || 0), 0);
  const totalVideos = features.reduce((s, f) => s + (f.count_videos || 0), 0);
  const totalLikes = features.reduce((s, f) => s + (f.count_likes_given || 0), 0);
  const totalShares = features.reduce((s, f) => s + (f.count_shares || 0), 0);
  const totalHelp = features.reduce((s, f) => s + (f.count_help || 0), 0);
  const checkins = features.filter(f => f.checkin_done).length;
  const maxStreak = features.length > 0 ? Math.max(...features.map(f => f.consistency_streak || 0)) : 0;
  const totalSequences = features.reduce((s, f) => s + (f.sequence_count || 0), 0);
  const avgRisk = features.length > 0
    ? features.reduce((s, f) => s + (f.anti_farm_risk || 0), 0) / features.length
    : 0;

  const serving: ServingSignals = {
    hasDisplayName: !!profile.display_name,
    hasAvatar: !!profile.avatar_url,
    hasBio: !!(profile as any).bio,
    hasVerifiedEmail: !!profile.display_name,
    hasWallet: !!profile.wallet_address,
    accountAgeDays,
    consistencyDays: profile.consistency_days || maxStreak,
    helpCount: totalHelp,
    donationCount: donationRes.data?.length || 0,
  };

  const truth: TruthSignals = {
    antiFarmRisk: avgRisk,
    isBlacklisted: profile.banned || false,
    normalPattern: avgRisk < 0.2,
    postCount: totalPosts,
    commentCount: totalComments,
    contentQuality: 1 - avgRisk,
    reportCount: 0,
  };

  const love: LoveSignals = {
    checkinCount: checkins,
    streakDays: maxStreak,
    positiveInteractions: totalComments + totalHelp,
    likesGiven: totalLikes,
    endorsements: 0,
  };

  const mintedCount = mintRes.data?.length || 0;
  const claimedCount = claimRes.data?.length || 0;

  const value: ValueSignals = {
    accountAgeMonths: Math.floor(accountAgeDays / 30),
    videoCount: totalVideos,
    bountyContributions: bountyRes.data?.length || 0,
    totalMinted: mintedCount,
    hasClaimed: claimedCount > 0,
    pplpAccepted: !!(profile as any).pplp_accepted_at,
    funBalance: 0,
  };

  const unity: UnitySignals = {
    shareCount: totalShares,
    collaborations: 0,
    platformsUsed: 1,
    participatesGovernance: false,
    communityEndorsements: 0,
    sequenceBonus: totalSequences,
  };

  return { serving, truth, love, value, unity, riskScore: avgRisk };
}
