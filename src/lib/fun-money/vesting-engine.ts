/**
 * Vesting Engine v1.0
 * 
 * Token States: PENDING → MINTED_LOCKED → VESTING_UNLOCKABLE → CLAIMABLE
 * 
 * Lock: 15% instant, 85% locked (adjustable by trust band)
 * Unlock: time + value conditions (contribution, usage, consistency)
 */

export type TokenState = 'pending' | 'minted_locked' | 'vesting_unlockable' | 'claimable';

export interface VestingSchedule {
  userId: string;
  epochId: string;
  totalAmount: number;
  instantAmount: number;
  lockedAmount: number;
  unlockedAmount: number;
  claimedAmount: number;
  tokenState: TokenState;
  nextUnlockAt: Date | null;
  unlockHistory: UnlockEvent[];
  contributionUnlock: number;
  usageUnlock: number;
  consistencyUnlock: number;
  dormantAt: Date | null;
}

export interface UnlockEvent {
  date: string;
  amount: number;
  type: 'base_vesting' | 'contribution' | 'usage' | 'consistency';
  details?: string;
}

export interface UnlockConditions {
  daysSinceMint: number;
  baseVestingIntervalDays: number; // 7
  totalVestingDays: number;        // 28
  continuedPplpActivity: boolean;
  funUsedInEcosystem: number;      // FUN spent on services
  scoresMaintained: boolean;
  userActive: boolean;
  lastActivityDaysAgo: number;
}

// ─── Constants ───────────────────────────────────────────────

const BASE_VESTING_INTERVAL = 7;   // days
const TOTAL_VESTING_PERIOD = 28;   // days
const DORMANT_THRESHOLD_DAYS = 60;
const DORMANT_VAULT_DAYS = 180;

// ─── Base Vesting Calculator ─────────────────────────────────

/**
 * Calculate base vesting unlock amount (time-based)
 * Linear over 28 days in 7-day intervals = 4 tranches of 25% each
 */
export function calculateBaseVesting(
  lockedAmount: number,
  alreadyUnlocked: number,
  daysSinceMint: number
): number {
  const intervals = Math.floor(daysSinceMint / BASE_VESTING_INTERVAL);
  const maxIntervals = Math.floor(TOTAL_VESTING_PERIOD / BASE_VESTING_INTERVAL); // 4
  const effectiveIntervals = Math.min(intervals, maxIntervals);

  const totalShouldBeUnlocked = (effectiveIntervals / maxIntervals) * lockedAmount;
  const newUnlock = Math.max(0, totalShouldBeUnlocked - alreadyUnlocked);

  return Math.round(newUnlock * 100) / 100;
}

// ─── Contribution Unlock ─────────────────────────────────────

/**
 * Bonus unlock when user continues PPLP activity after minting
 * Up to 10% of locked amount as bonus
 */
export function calculateContributionUnlock(
  lockedAmount: number,
  alreadyContributionUnlocked: number,
  continuedActivity: boolean
): number {
  if (!continuedActivity) return 0;

  const maxContributionBonus = lockedAmount * 0.10;
  const bonusPerCheck = maxContributionBonus / 4; // spread over 4 check intervals
  const newUnlock = Math.min(bonusPerCheck, maxContributionBonus - alreadyContributionUnlocked);

  return Math.max(0, Math.round(newUnlock * 100) / 100);
}

// ─── Usage Unlock ────────────────────────────────────────────

/**
 * Bonus unlock when user uses FUN in ecosystem
 * Up to 8% of locked amount
 */
export function calculateUsageUnlock(
  lockedAmount: number,
  alreadyUsageUnlocked: number,
  funUsedInEcosystem: number
): number {
  if (funUsedInEcosystem <= 0) return 0;

  const maxUsageBonus = lockedAmount * 0.08;
  // Proportional to usage: sqrt to avoid gaming
  const usageRatio = Math.min(1, Math.sqrt(funUsedInEcosystem / Math.max(1, lockedAmount)));
  const totalUsageUnlock = maxUsageBonus * usageRatio;
  const newUnlock = Math.max(0, totalUsageUnlock - alreadyUsageUnlocked);

  return Math.round(newUnlock * 100) / 100;
}

// ─── Consistency Unlock ──────────────────────────────────────

/**
 * Bonus unlock when user maintains scores in rolling window
 * Up to 7% of locked amount
 */
export function calculateConsistencyUnlock(
  lockedAmount: number,
  alreadyConsistencyUnlocked: number,
  scoresMaintained: boolean
): number {
  if (!scoresMaintained) return 0;

  const maxConsistencyBonus = lockedAmount * 0.07;
  const bonusPerCheck = maxConsistencyBonus / 4;
  const newUnlock = Math.min(bonusPerCheck, maxConsistencyBonus - alreadyConsistencyUnlocked);

  return Math.max(0, Math.round(newUnlock * 100) / 100);
}

// ─── Full Unlock Check ───────────────────────────────────────

export interface UnlockResult {
  totalNewUnlock: number;
  baseUnlock: number;
  contributionUnlock: number;
  usageUnlock: number;
  consistencyUnlock: number;
  newTokenState: TokenState;
  newNextUnlockAt: Date | null;
  isDormant: boolean;
  events: UnlockEvent[];
}

export function processUnlockCheck(
  schedule: VestingSchedule,
  conditions: UnlockConditions
): UnlockResult {
  const events: UnlockEvent[] = [];
  const now = new Date();

  // Check dormancy
  let isDormant = false;
  if (!conditions.userActive && conditions.lastActivityDaysAgo >= DORMANT_VAULT_DAYS) {
    isDormant = true;
    // Dormant: no new unlocks, stays locked
    return {
      totalNewUnlock: 0,
      baseUnlock: 0,
      contributionUnlock: 0,
      usageUnlock: 0,
      consistencyUnlock: 0,
      newTokenState: 'minted_locked',
      newNextUnlockAt: null,
      isDormant: true,
      events: [{ date: now.toISOString(), amount: 0, type: 'base_vesting', details: 'dormant_vault' }],
    };
  }

  // Slow vesting mode for inactive users
  const inSlowMode = !conditions.userActive && conditions.lastActivityDaysAgo >= DORMANT_THRESHOLD_DAYS;

  // Base vesting
  let baseUnlock = calculateBaseVesting(
    schedule.lockedAmount,
    schedule.unlockedAmount,
    conditions.daysSinceMint
  );
  if (inSlowMode) {
    baseUnlock *= 0.5; // Half speed in slow mode
  }

  if (baseUnlock > 0) {
    events.push({ date: now.toISOString(), amount: baseUnlock, type: 'base_vesting' });
  }

  // Contribution unlock (only if active)
  let contribUnlock = 0;
  if (conditions.userActive) {
    contribUnlock = calculateContributionUnlock(
      schedule.lockedAmount,
      schedule.contributionUnlock,
      conditions.continuedPplpActivity
    );
    if (contribUnlock > 0) {
      events.push({ date: now.toISOString(), amount: contribUnlock, type: 'contribution' });
    }
  }

  // Usage unlock
  let usageUnlock = 0;
  if (conditions.funUsedInEcosystem > 0) {
    usageUnlock = calculateUsageUnlock(
      schedule.lockedAmount,
      schedule.usageUnlock,
      conditions.funUsedInEcosystem
    );
    if (usageUnlock > 0) {
      events.push({ date: now.toISOString(), amount: usageUnlock, type: 'usage' });
    }
  }

  // Consistency unlock
  let consistencyUnlockAmt = 0;
  if (conditions.userActive) {
    consistencyUnlockAmt = calculateConsistencyUnlock(
      schedule.lockedAmount,
      schedule.consistencyUnlock,
      conditions.scoresMaintained
    );
    if (consistencyUnlockAmt > 0) {
      events.push({ date: now.toISOString(), amount: consistencyUnlockAmt, type: 'consistency' });
    }
  }

  const totalNewUnlock = baseUnlock + contribUnlock + usageUnlock + consistencyUnlockAmt;
  const totalUnlocked = schedule.unlockedAmount + totalNewUnlock;
  const remainingLocked = schedule.lockedAmount - totalUnlocked;

  // Determine token state
  let newTokenState: TokenState = schedule.tokenState;
  if (totalUnlocked > 0 && schedule.tokenState === 'minted_locked') {
    newTokenState = 'vesting_unlockable';
  }
  if (remainingLocked <= 0.01) {
    newTokenState = 'claimable'; // Fully unlocked
  }

  // Next unlock date
  let newNextUnlockAt: Date | null = null;
  if (remainingLocked > 0.01) {
    newNextUnlockAt = new Date(now.getTime() + BASE_VESTING_INTERVAL * 24 * 60 * 60 * 1000);
  }

  return {
    totalNewUnlock: Math.round(totalNewUnlock * 100) / 100,
    baseUnlock: Math.round(baseUnlock * 100) / 100,
    contributionUnlock: Math.round(contribUnlock * 100) / 100,
    usageUnlock: Math.round(usageUnlock * 100) / 100,
    consistencyUnlock: Math.round(consistencyUnlockAmt * 100) / 100,
    newTokenState,
    newNextUnlockAt,
    isDormant,
    events,
  };
}

// ─── Claimable Amount ────────────────────────────────────────

/**
 * Total claimable = instant + unlocked - already claimed
 */
export function getClaimableAmount(schedule: VestingSchedule): number {
  const totalAvailable = schedule.instantAmount + schedule.unlockedAmount;
  const claimable = totalAvailable - schedule.claimedAmount;
  return Math.max(0, Math.round(claimable * 100) / 100);
}
