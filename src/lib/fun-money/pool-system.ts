/**
 * FUN Money Pool System
 * 4 Core Pools as defined in THE 5D WHITEPAPER
 */

// ===== METADATA =====
export const WHITEPAPER_VERSION = 'v0.1-5D';
export const CONSTITUTION_VERSION = 'v2.0';
export const PROTOCOL_NAME = 'Proof of Pure Love Protocol';

/** AI Agent Role — Guardian of Flow (Constitution v2.0, Chương VII) */
export const GUARDIAN_ROLE = 'Guardian of Flow – Người Gác Dòng Chảy' as const;

// ===== POOL ALLOCATION =====

export interface PoolAllocation {
  communityPool: string;
  platformActivation: string;
  recyclePool: string;
  guardianPool: string;
}

export const POOL_PERCENTAGES = {
  communityPool: 0.40,
  platformActivation: 0.30,
  recyclePool: 0.20,
  guardianPool: 0.10,
} as const;

/**
 * Calculate pool distribution from a mint amount
 * @param mintAmountAtomic - Total mint amount in atomic units (string)
 * @returns PoolAllocation with each pool's share in atomic units
 */
export function calculatePoolDistribution(mintAmountAtomic: string): PoolAllocation {
  const total = BigInt(mintAmountAtomic);

  const community = (total * 40n) / 100n;
  const platform = (total * 30n) / 100n;
  const recycle = (total * 20n) / 100n;
  // Guardian gets the remainder to avoid rounding loss
  const guardian = total - community - platform - recycle;

  return {
    communityPool: community.toString(),
    platformActivation: platform.toString(),
    recyclePool: recycle.toString(),
    guardianPool: guardian.toString(),
  };
}

// ===== INACTIVITY DECAY (Anti-Hoarding) =====

export const INACTIVITY_CONFIG = {
  gracePeriodDays: 90,
  decayRatePerDay: 0.001, // 0.1% per day
  maxDecayPercent: 0.50,  // max 50% total decay
  recycleDestination: 'communityPool' as const,
} as const;

export interface InactivityDecayResult {
  decayAmountAtomic: string;
  remainingBalanceAtomic: string;
  decayPercent: number;
  daysOverGrace: number;
  recycleDestination: string;
}

/**
 * Calculate inactivity decay (Luật Không Tích Trữ)
 * FUN that has been inactive beyond the grace period slowly returns to Community Pool
 *
 * @param balanceAtomic - Current balance in atomic units
 * @param inactiveDays  - Total days of inactivity
 */
export function calculateInactivityDecay(
  balanceAtomic: string,
  inactiveDays: number
): InactivityDecayResult {
  const balance = BigInt(balanceAtomic);

  if (inactiveDays <= INACTIVITY_CONFIG.gracePeriodDays) {
    return {
      decayAmountAtomic: '0',
      remainingBalanceAtomic: balanceAtomic,
      decayPercent: 0,
      daysOverGrace: 0,
      recycleDestination: INACTIVITY_CONFIG.recycleDestination,
    };
  }

  const daysOver = inactiveDays - INACTIVITY_CONFIG.gracePeriodDays;
  const rawDecay = daysOver * INACTIVITY_CONFIG.decayRatePerDay;
  const cappedDecay = Math.min(rawDecay, INACTIVITY_CONFIG.maxDecayPercent);

  // Use basis-point math: cappedDecay * 10000 → integer
  const bps = BigInt(Math.floor(cappedDecay * 10000));
  const decayAmount = (balance * bps) / 10000n;
  const remaining = balance - decayAmount;

  return {
    decayAmountAtomic: decayAmount.toString(),
    remainingBalanceAtomic: remaining.toString(),
    decayPercent: Math.round(cappedDecay * 10000) / 100, // e.g. 12.30%
    daysOverGrace: daysOver,
    recycleDestination: INACTIVITY_CONFIG.recycleDestination,
  };
}
