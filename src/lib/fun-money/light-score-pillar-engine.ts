/**
 * Light Score 5-Pillar Scoring Engine
 * 
 * Calculates sub-scores for each of the 5 pillars, then combines
 * with existing LS-Math v1.0 scoring to produce an enriched Light Score.
 * 
 * Architecture: EXTENDS LS-Math v1.0, does NOT replace it.
 * The final Light Score = LS-Math result + 5-pillar sub-scores for display/analysis.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  PILLAR_WEIGHTS_V1,
  PILLAR_LIST,
  getLightLevel,
  STREAK_BONUS,
  type PillarName,
} from './light-score-pillars';

// ===== PILLAR SCORE RESULTS =====

export interface PillarScores {
  identity: number;
  activity: number;
  onchain: number;
  transparency: number;
  alignment: number;
}

export interface PillarScoreResult {
  pillarScores: PillarScores;
  weightedTotal: number;
  riskPenalty: number;
  streakBonus: number;
  finalScore: number;
  level: ReturnType<typeof getLightLevel>;
}

// ===== IDENTITY SCORE =====

interface IdentitySignals {
  hasDisplayName: boolean;
  hasAvatar: boolean;
  hasVerifiedEmail: boolean;
  hasWallet: boolean;
  hasWeb3Profile: boolean;
  accountAgeDays: number;
  consistencyDays: number;
  hasBio: boolean;
}

export function calculateIdentityScore(signals: IdentitySignals): number {
  let score = 0;

  // Basic profile completeness (max 30)
  if (signals.hasDisplayName) score += 8;
  if (signals.hasAvatar) score += 8;
  if (signals.hasBio) score += 7;
  if (signals.hasVerifiedEmail) score += 7;

  // Web3 identity (max 20)
  if (signals.hasWallet) score += 10;
  if (signals.hasWeb3Profile) score += 10;

  // Account maturity (max 30)
  if (signals.accountAgeDays >= 365) score += 30;
  else if (signals.accountAgeDays >= 180) score += 25;
  else if (signals.accountAgeDays >= 90) score += 20;
  else if (signals.accountAgeDays >= 30) score += 15;
  else if (signals.accountAgeDays >= 7) score += 8;

  // Behavioral consistency (max 20)
  if (signals.consistencyDays >= 90) score += 20;
  else if (signals.consistencyDays >= 30) score += 15;
  else if (signals.consistencyDays >= 7) score += 8;

  return Math.min(100, score);
}

// ===== ACTIVITY SCORE =====

interface ActivitySignals {
  /** From LS-Math v1.0: action base + content daily score combined */
  lsMathRawScore: number;
  /** Total posts this epoch */
  postCount: number;
  /** Total comments this epoch */
  commentCount: number;
  /** Total videos this epoch */
  videoCount: number;
  /** Total likes given */
  likesGiven: number;
  /** Total shares */
  shareCount: number;
  /** Total help/bounty */
  helpCount: number;
  /** Daily check-ins this epoch */
  checkinCount: number;
  /** Consistency streak days */
  streakDays: number;
  /** Sequence bonus total */
  sequenceBonus: number;
}

export function calculateActivityScore(signals: ActivitySignals): number {
  let score = 0;

  // Content creation diversity (max 40)
  const contentTypes = [
    signals.postCount > 0,
    signals.commentCount > 0,
    signals.videoCount > 0,
    signals.shareCount > 0,
    signals.helpCount > 0,
  ].filter(Boolean).length;
  score += Math.min(40, contentTypes * 8);

  // Volume with diminishing returns (max 30)
  const totalActions = signals.postCount + signals.commentCount + signals.videoCount +
    signals.likesGiven + signals.shareCount + signals.helpCount + signals.checkinCount;
  score += Math.min(30, Math.floor(Math.sqrt(totalActions) * 3));

  // Consistency (max 20)
  if (signals.streakDays >= 30) score += 20;
  else if (signals.streakDays >= 14) score += 15;
  else if (signals.streakDays >= 7) score += 10;
  else if (signals.streakDays >= 3) score += 5;

  // Sequences (max 10)
  score += Math.min(10, signals.sequenceBonus * 2);

  return Math.min(100, score);
}

// ===== ON-CHAIN HISTORY SCORE =====

interface OnChainSignals {
  /** Wallet age in days */
  walletAgeDays: number;
  /** Total on-chain transactions */
  transactionCount: number;
  /** Has interacted with FUN contract */
  hasContractInteraction: boolean;
  /** Total FUN minted on-chain */
  totalMinted: number;
  /** Has claimed FUN */
  hasClaimed: boolean;
  /** Number of distinct contract interactions */
  distinctContracts: number;
}

export function calculateOnChainScore(signals: OnChainSignals): number {
  let score = 0;

  // Wallet age (max 30)
  if (signals.walletAgeDays >= 365) score += 30;
  else if (signals.walletAgeDays >= 180) score += 25;
  else if (signals.walletAgeDays >= 90) score += 20;
  else if (signals.walletAgeDays >= 30) score += 10;

  // Transaction history (max 25)
  if (signals.transactionCount >= 50) score += 25;
  else if (signals.transactionCount >= 20) score += 20;
  else if (signals.transactionCount >= 5) score += 12;
  else if (signals.transactionCount > 0) score += 5;

  // Ecosystem interaction (max 25)
  if (signals.hasContractInteraction) score += 15;
  if (signals.hasClaimed) score += 10;

  // Diversity of interactions (max 20)
  score += Math.min(20, signals.distinctContracts * 5);

  return Math.min(100, score);
}

// ===== WALLET TRANSPARENCY SCORE =====

interface TransparencySignals {
  /** Anti-farm risk score from features_user_day (0-1) */
  antiFarmRisk: number;
  /** Is wallet blacklisted */
  isBlacklisted: boolean;
  /** Number of wallet changes in 30 days */
  walletChanges30d: number;
  /** Is in suspicious IP cluster */
  isInCluster: boolean;
  /** Has normal transaction pattern */
  normalPattern: boolean;
  /** Risk status from wallet change */
  walletRiskStatus: string;
}

export function calculateTransparencyScore(signals: TransparencySignals): number {
  if (signals.isBlacklisted) return 0;

  let score = 100;

  // Anti-farm risk reduction (0-40 penalty)
  score -= Math.min(40, Math.floor(signals.antiFarmRisk * 50));

  // Wallet changes penalty
  if (signals.walletChanges30d >= 3) score -= 30;
  else if (signals.walletChanges30d >= 2) score -= 15;

  // Cluster detection
  if (signals.isInCluster) score -= 25;

  // Wallet risk status
  if (signals.walletRiskStatus === 'BLOCKED') score -= 40;
  else if (signals.walletRiskStatus === 'REVIEW') score -= 20;
  else if (signals.walletRiskStatus === 'WATCH') score -= 10;

  // Natural pattern bonus
  if (signals.normalPattern) score += 10;

  return Math.max(0, Math.min(100, score));
}

// ===== ECOSYSTEM ALIGNMENT SCORE =====

interface AlignmentSignals {
  /** Holds Camly Coin */
  holdsCamly: boolean;
  /** Camly balance amount */
  camlyBalance: number;
  /** Total donations made */
  donationCount: number;
  /** Participates in governance (has voted/attested) */
  participatesGovernance: boolean;
  /** Uses multiple FUN platforms */
  platformsUsed: number;
  /** Account age in months */
  accountAgeMonths: number;
  /** Has bounty submissions */
  hasBountyContributions: boolean;
  /** PPLP charter accepted */
  pplpAccepted: boolean;
  /** Total FUN held */
  funBalance: number;
}

export function calculateAlignmentScore(signals: AlignmentSignals): number {
  let score = 0;

  // Holds Camly (max 20)
  if (signals.holdsCamly) {
    score += 10;
    if (signals.camlyBalance >= 100) score += 10;
    else if (signals.camlyBalance >= 10) score += 5;
  }

  // FUN Money holding (max 15)
  if (signals.funBalance > 0) {
    score += Math.min(15, Math.floor(Math.log10(signals.funBalance + 1) * 5));
  }

  // Community contributions (max 20)
  if (signals.donationCount >= 5) score += 20;
  else if (signals.donationCount >= 1) score += 10;

  // Platform engagement (max 15)
  score += Math.min(15, signals.platformsUsed * 5);

  // Long-term alignment (max 15)
  if (signals.accountAgeMonths >= 12) score += 15;
  else if (signals.accountAgeMonths >= 6) score += 10;
  else if (signals.accountAgeMonths >= 3) score += 5;

  // Governance & bounty (max 10)
  if (signals.participatesGovernance) score += 5;
  if (signals.hasBountyContributions) score += 5;

  // PPLP Charter (max 5)
  if (signals.pplpAccepted) score += 5;

  return Math.min(100, score);
}

// ===== COMBINED SCORING =====

export function calculatePillarScores(
  identity: IdentitySignals,
  activity: ActivitySignals,
  onchain: OnChainSignals,
  transparency: TransparencySignals,
  alignment: AlignmentSignals,
  riskScore: number = 0,
): PillarScoreResult {
  const pillarScores: PillarScores = {
    identity: calculateIdentityScore(identity),
    activity: calculateActivityScore(activity),
    onchain: calculateOnChainScore(onchain),
    transparency: calculateTransparencyScore(transparency),
    alignment: calculateAlignmentScore(alignment),
  };

  // Weighted total (0-100)
  const weights = PILLAR_WEIGHTS_V1;
  let weightedTotal = 0;
  for (const pillar of PILLAR_LIST) {
    weightedTotal += pillarScores[pillar] * weights[pillar];
  }
  weightedTotal = Math.round(weightedTotal);

  // Risk penalty
  const riskPenalty = Math.min(80, Math.floor(riskScore * 100));

  // Streak bonus
  const streak = activity.streakDays;
  let streakBonus = 0;
  if (streak >= 90) streakBonus = STREAK_BONUS[90];
  else if (streak >= 30) streakBonus = STREAK_BONUS[30];
  else if (streak >= 7) streakBonus = STREAK_BONUS[7];

  // Final score
  const baseAfterPenalty = Math.max(0, weightedTotal - riskPenalty);
  const finalScore = Math.round(baseAfterPenalty * (1 + streakBonus));

  return {
    pillarScores,
    weightedTotal,
    riskPenalty,
    streakBonus,
    finalScore,
    level: getLightLevel(finalScore),
  };
}

// ===== FETCH PILLAR DATA FROM DB =====

export async function fetchPillarSignals(userId: string) {
  const [profileRes, featuresRes, mintRes, donationRes, bountyRes, claimRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('features_user_day')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
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

  // Aggregate features for epoch
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

  const identity: IdentitySignals = {
    hasDisplayName: !!profile.display_name,
    hasAvatar: !!profile.avatar_url,
    hasVerifiedEmail: !!profile.display_name, // Email verified via auth (proxy: has display name)
    hasWallet: !!profile.wallet_address,
    hasWeb3Profile: !!profile.wallet_address,
    accountAgeDays,
    consistencyDays: profile.consistency_days || maxStreak,
    hasBio: !!(profile as any).bio,
  };

  const activity: ActivitySignals = {
    lsMathRawScore: profile.light_score || 0,
    postCount: totalPosts,
    commentCount: totalComments,
    videoCount: totalVideos,
    likesGiven: totalLikes,
    shareCount: totalShares,
    helpCount: totalHelp,
    checkinCount: checkins,
    streakDays: maxStreak,
    sequenceBonus: totalSequences,
  };

  const mintedCount = mintRes.data?.length || 0;
  const claimedCount = claimRes.data?.length || 0;

  const onchain: OnChainSignals = {
    walletAgeDays: profile.wallet_address ? accountAgeDays : 0,
    transactionCount: mintedCount + claimedCount + (donationRes.data?.length || 0),
    hasContractInteraction: mintedCount > 0,
    totalMinted: mintedCount,
    hasClaimed: claimedCount > 0,
    distinctContracts: mintedCount > 0 ? 1 : 0, // FUN contract
  };

  const transparency: TransparencySignals = {
    antiFarmRisk: avgRisk,
    isBlacklisted: profile.banned || false,
    walletChanges30d: (profile as any).wallet_change_count_30d || 0,
    isInCluster: false, // Would need IP cluster check
    normalPattern: avgRisk < 0.2,
    walletRiskStatus: (profile as any).wallet_risk_status || 'NORMAL',
  };

  const alignment: AlignmentSignals = {
    holdsCamly: false, // Would need on-chain check
    camlyBalance: 0,
    donationCount: donationRes.data?.length || 0,
    participatesGovernance: false,
    platformsUsed: 1, // FUN.PLAY
    accountAgeMonths: Math.floor(accountAgeDays / 30),
    hasBountyContributions: (bountyRes.data?.length || 0) > 0,
    pplpAccepted: !!(profile as any).pplp_accepted_at,
    funBalance: 0, // Would need on-chain check
  };

  return { identity, activity, onchain, transparency, alignment, riskScore: avgRisk };
}
