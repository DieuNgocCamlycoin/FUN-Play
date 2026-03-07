/**
 * Reputation NFT Types & Config (Phase 2)
 * 
 * Defines the structure for dynamic, soulbound-friendly Reputation NFTs.
 */

import { LIGHT_LEVELS, REPUTATION_BADGES, type LightLevel, type BadgeDefinition } from './light-score-pillars';
import type { PillarScores } from './light-score-pillar-engine';

// ===== NFT METADATA =====

export interface ReputationNFTMetadata {
  /** Token ID on-chain */
  tokenId?: string;
  /** Owner wallet address */
  owner: string;
  /** User ID in platform */
  userId: string;
  /** Current Light Level */
  level: LightLevel;
  /** Current 5-pillar scores */
  pillarScores: PillarScores;
  /** Final Light Score */
  lightScore: number;
  /** Earned badges */
  badges: BadgeDefinition[];
  /** Number of epochs contributed */
  epochsContributed: number;
  /** Longest streak */
  longestStreak: number;
  /** Total FUN minted */
  totalFunMinted: number;
  /** Last updated */
  updatedAt: string;
  /** NFT image URL (dynamic based on level) */
  imageUrl: string;
  /** Soulbound flag */
  soulbound: boolean;
}

// ===== NFT IMAGE GENERATION CONFIG =====

export const NFT_LEVEL_IMAGES: Record<string, { background: string; glow: string }> = {
  light_seed: {
    background: 'linear-gradient(135deg, #4a5568, #718096)',
    glow: 'none',
  },
  light_builder: {
    background: 'linear-gradient(135deg, #48bb78, #38a169)',
    glow: '0 0 20px rgba(72, 187, 120, 0.5)',
  },
  light_guardian: {
    background: 'linear-gradient(135deg, #4299e1, #3182ce)',
    glow: '0 0 30px rgba(66, 153, 225, 0.6)',
  },
  light_leader: {
    background: 'linear-gradient(135deg, #ed8936, #dd6b20)',
    glow: '0 0 40px rgba(237, 137, 54, 0.7)',
  },
  cosmic_contributor: {
    background: 'linear-gradient(135deg, #9f7aea, #ed64a6, #f6ad55)',
    glow: '0 0 50px rgba(159, 122, 234, 0.8)',
  },
};

// ===== BADGE ELIGIBILITY CHECK =====

export function checkBadgeEligibility(
  pillarScores: PillarScores,
  streakDays: number,
  riskScore: number,
  walletAgeDays: number,
  accountAgeDays: number,
): BadgeDefinition[] {
  const earned: BadgeDefinition[] = [];

  // Community Builder: Activity >= 70 & streak >= 30
  if (pillarScores.activity >= 70 && streakDays >= 30) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'community_builder')!);
  }

  // Transparent Wallet: Transparency >= 80
  if (pillarScores.transparency >= 80) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'transparent_wallet')!);
  }

  // Long-term Holder: Alignment >= 70 & wallet age >= 6 months
  if (pillarScores.alignment >= 70 && walletAgeDays >= 180) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'long_term_holder')!);
  }

  // Pure Contributor: All pillars >= 60 & risk < 0.1
  const allAbove60 = Object.values(pillarScores).every(s => s >= 60);
  if (allAbove60 && riskScore < 0.1) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'pure_contributor')!);
  }

  // Early Supporter: Account age >= 1 year & Alignment >= 60
  if (accountAgeDays >= 365 && pillarScores.alignment >= 60) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'early_supporter')!);
  }

  return earned.filter(Boolean);
}

// ===== NFT METADATA BUILDER =====

export function buildNFTMetadata(params: {
  owner: string;
  userId: string;
  pillarScores: PillarScores;
  lightScore: number;
  streakDays: number;
  riskScore: number;
  walletAgeDays: number;
  accountAgeDays: number;
  epochsContributed: number;
  totalFunMinted: number;
}): Omit<ReputationNFTMetadata, 'tokenId'> {
  const level = LIGHT_LEVELS.find(l =>
    params.lightScore >= l.minScore && (l.maxScore === null || params.lightScore <= l.maxScore)
  ) || LIGHT_LEVELS[0];

  const badges = checkBadgeEligibility(
    params.pillarScores,
    params.streakDays,
    params.riskScore,
    params.walletAgeDays,
    params.accountAgeDays,
  );

  return {
    owner: params.owner,
    userId: params.userId,
    level,
    pillarScores: params.pillarScores,
    lightScore: params.lightScore,
    badges,
    epochsContributed: params.epochsContributed,
    longestStreak: params.streakDays,
    totalFunMinted: params.totalFunMinted,
    updatedAt: new Date().toISOString(),
    imageUrl: '', // Generated dynamically
    soulbound: true,
  };
}
