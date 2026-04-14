/**
 * Reputation NFT Types & Config (Phase 2)
 * Updated for CTO Diagram v13Apr2026 — 5 new pillars (0-10 scale)
 */

import { LIGHT_LEVELS, REPUTATION_BADGES, type LightLevel, type BadgeDefinition } from './light-score-pillars';
import type { PillarScores } from './light-score-pillar-engine';

// ===== NFT METADATA =====

export interface ReputationNFTMetadata {
  tokenId?: string;
  owner: string;
  userId: string;
  level: LightLevel;
  pillarScores: PillarScores;
  lightScore: number;
  badges: BadgeDefinition[];
  epochsContributed: number;
  longestStreak: number;
  totalFunMinted: number;
  updatedAt: string;
  imageUrl: string;
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

  // Community Builder: Serving >= 7 & streak >= 30
  if (pillarScores.serving >= 7 && streakDays >= 30) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'community_builder')!);
  }

  // Transparent Truth: Truth >= 8
  if (pillarScores.truth >= 8) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'transparent_wallet')!);
  }

  // Long-term Holder: Value >= 7 & wallet age >= 6 months
  if (pillarScores.value >= 7 && walletAgeDays >= 180) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'long_term_holder')!);
  }

  // Pure Contributor: All pillars >= 6 & risk < 0.1
  const allAbove6 = Object.values(pillarScores).every(s => s >= 6);
  if (allAbove6 && riskScore < 0.1) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'pure_contributor')!);
  }

  // Early Supporter: Account age >= 1 year & Unity >= 6
  if (accountAgeDays >= 365 && pillarScores.unity >= 6) {
    earned.push(REPUTATION_BADGES.find(b => b.id === 'early_supporter')!);
  }

  return earned.filter(Boolean);
}

// ===== GENERATE NFT METADATA =====

export function generateNFTMetadata(params: {
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
  baseImageUrl: string;
}): ReputationNFTMetadata {
  const level = LIGHT_LEVELS.find(
    l => params.lightScore >= l.minScore && (l.maxScore === null || params.lightScore <= l.maxScore)
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
    imageUrl: `${params.baseImageUrl}/${level.id}.png`,
    soulbound: true,
  };
}
