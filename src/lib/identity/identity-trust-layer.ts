/**
 * Identity + Trust Layer — v1.0
 * 16Apr2026
 * 
 * Calculates real TC_e (Trust Confidence) from:
 * 1. DID verification level
 * 2. SBT status
 * 3. Behavioral trust signals
 * 4. Community standing
 * 5. Contribution history
 * 
 * Feeds into PPLP Engine v2.5 as the authoritative TC_e source
 */

import {
  type DIDLevel,
  type DIDVerification,
  type DIBScore,
  getDIDLevel,
  DID_TO_TRUST_TIER,
} from './soulbound-types';
import { getTrustConfidence, TRUST_LEVELS } from '../fun-money/light-score-params-v1';

// ===== IDENTITY SIGNAL WEIGHTS =====

const IDENTITY_WEIGHTS = {
  did_level: 0.30,        // Verification level (biggest single factor)
  profile_completeness: 0.10,
  behavioral_trust: 0.25, // Long-term behavior patterns
  community_standing: 0.20,
  contribution_history: 0.15,
} as const;

// ===== DID LEVEL → BASE TC SCORE =====

const DID_BASE_TC: Record<DIDLevel, number> = {
  none: 0.5,
  email: 0.7,
  phone: 0.8,
  kyc: 1.05,
  sbt: 1.25,
};

// ===== PROFILE COMPLETENESS =====

export interface ProfileSignals {
  has_display_name: boolean;
  has_avatar: boolean;
  has_bio: boolean;
  has_wallet: boolean;
  pplp_accepted: boolean;
}

export function calculateProfileCompleteness(p: ProfileSignals): number {
  let score = 0;
  if (p.has_display_name) score += 0.2;
  if (p.has_avatar) score += 0.15;
  if (p.has_bio) score += 0.15;
  if (p.has_wallet) score += 0.25;
  if (p.pplp_accepted) score += 0.25;
  return Math.min(1, score);
}

// ===== BEHAVIORAL TRUST =====

export interface BehavioralSignals {
  account_age_days: number;
  consistency_streak: number;
  total_valid_actions: number;
  total_flagged_actions: number;
  anti_farm_risk_avg: number;    // 0-1, lower is better
  reward_reversal_count: number;
}

export function calculateBehavioralTrust(b: BehavioralSignals): number {
  // Age factor: 0-1 over 365 days
  const ageFactor = Math.min(1, b.account_age_days / 365);
  
  // Consistency factor: streak normalized
  const streakFactor = Math.min(1, Math.log(1 + b.consistency_streak) / Math.log(91));
  
  // Action quality: valid vs flagged
  const totalActions = Math.max(1, b.total_valid_actions + b.total_flagged_actions);
  const validRatio = b.total_valid_actions / totalActions;
  
  // Anti-farm: invert risk
  const farmClean = Math.max(0, 1 - b.anti_farm_risk_avg);
  
  // Reversal penalty
  const reversalPenalty = Math.max(0, 1 - b.reward_reversal_count * 0.1);
  
  return round4(
    ageFactor * 0.25 +
    streakFactor * 0.2 +
    validRatio * 0.25 +
    farmClean * 0.15 +
    reversalPenalty * 0.15
  );
}

// ===== COMMUNITY STANDING =====

export interface CommunitySignals {
  endorsements_received: number;
  flags_received: number;
  community_reports_valid: number;
  peer_ratings_avg: number;       // 0-5
  mentor_sessions_completed: number;
}

export function calculateCommunityStanding(c: CommunitySignals): number {
  const endorseScore = Math.min(1, Math.sqrt(c.endorsements_received) * 0.2);
  const flagPenalty = Math.min(0.5, c.flags_received * 0.05);
  const reportPenalty = Math.min(0.3, c.community_reports_valid * 0.1);
  const ratingScore = Math.min(1, (c.peer_ratings_avg || 0) / 5);
  const mentorBonus = Math.min(0.2, c.mentor_sessions_completed * 0.02);
  
  return round4(Math.max(0, Math.min(1,
    endorseScore * 0.3 +
    ratingScore * 0.3 +
    mentorBonus +
    0.2 - flagPenalty - reportPenalty
  )));
}

// ===== CONTRIBUTION HISTORY =====

export interface ContributionSignals {
  total_light_score: number;
  proposals_accepted: number;
  bugs_reported: number;
  content_pieces_valued: number;   // content with high impact
  governance_votes: number;
}

export function calculateContributionHistory(c: ContributionSignals): number {
  const lsNorm = Math.min(1, Math.log(1 + c.total_light_score) / 10);
  const proposalScore = Math.min(0.3, c.proposals_accepted * 0.05);
  const bugScore = Math.min(0.1, c.bugs_reported * 0.02);
  const contentScore = Math.min(0.3, Math.sqrt(c.content_pieces_valued) * 0.1);
  const govScore = Math.min(0.2, c.governance_votes * 0.01);
  
  return round4(Math.min(1,
    lsNorm * 0.4 + proposalScore + bugScore + contentScore + govScore
  ));
}

// ===== MAIN: CALCULATE DIB SCORE + REAL TC_e =====

export interface IdentityTrustInput {
  did: Partial<DIDVerification>;
  profile: ProfileSignals;
  behavioral: BehavioralSignals;
  community: CommunitySignals;
  contribution: ContributionSignals;
}

/**
 * Calculate full DIB Score and derive real TC_e
 * This replaces the static tier-based TC_e with dynamic identity scoring
 */
export function calculateIdentityTrust(input: IdentityTrustInput): DIBScore {
  const didLevel = getDIDLevel(input.did);
  
  // Component scores
  const identity_completeness = calculateProfileCompleteness(input.profile);
  const behavioral_trust = calculateBehavioralTrust(input.behavioral);
  const community_standing = calculateCommunityStanding(input.community);
  const contribution_history = calculateContributionHistory(input.contribution);
  
  // DID base TC
  const didBase = DID_BASE_TC[didLevel];
  
  // Weighted aggregate (0-1)
  const aggregate = round4(
    identity_completeness * IDENTITY_WEIGHTS.profile_completeness +
    behavioral_trust * IDENTITY_WEIGHTS.behavioral_trust +
    community_standing * IDENTITY_WEIGHTS.community_standing +
    contribution_history * IDENTITY_WEIGHTS.contribution_history
  );
  
  // Final TC_e: DID base + aggregate bonus, bounded to spec range 0.5-1.5
  const tc_e = round4(Math.max(0.5, Math.min(1.5,
    didBase * 0.6 + aggregate * 0.8 + (didLevel === 'sbt' ? 0.15 : 0)
  )));
  
  return {
    user_id: '',  // filled by caller
    did_level: didLevel,
    identity_completeness,
    behavioral_trust,
    community_standing,
    contribution_history,
    aggregate_score: aggregate,
    tc_e,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Quick TC_e from DID level only (fallback when full signals unavailable)
 */
export function quickTCFromDID(did: Partial<DIDVerification>): number {
  const level = getDIDLevel(did);
  const tier = DID_TO_TRUST_TIER[level];
  return getTrustConfidence(tier);
}

/**
 * Map DIB score to trust tier ID for use in existing systems
 */
export function dibToTrustTier(dib: DIBScore): string {
  if (dib.tc_e >= 1.4) return 'core';
  if (dib.tc_e >= 1.2) return 'strong';
  if (dib.tc_e >= 1.0) return 'verified';
  if (dib.tc_e >= 0.8) return 'basic';
  return 'unknown';
}

// ===== UTILITY =====

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
