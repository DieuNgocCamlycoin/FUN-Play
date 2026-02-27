/**
 * Scoring Simulation & Test Suite — LS-Math v1.0
 * 
 * End-to-end examples and unit test cases for dev verification.
 * All numbers match the spec document exactly.
 */

import {
  contentPillarScore,
  contentDailyScore,
  actionBaseScore,
  dailyLightScore,
  consistencyMultiplier,
  sequenceMultiplier,
  integrityPenalty,
  calculateMintAllocations,
  type CommunityRating,
  type DailyScoreInput,
} from './light-score-math';

// ===== SIMULATION RESULT TYPES =====

export interface SimulationResult {
  label: string;
  epoch: string;
  contentScore: number;
  actionBase: number;
  rawScore: number;
  consistencyMul: number;
  sequenceMul: number;
  integrityPen: number;
  finalLightScore: number;
  mintAllocation: number;
  details: Record<string, unknown>;
}

export interface TestCaseResult {
  name: string;
  description: string;
  expectedBehavior: string;
  actualValue: number;
  passed: boolean;
  details: Record<string, unknown>;
}

// ===== HELPER: Create mock ratings =====

function mockRatings(
  pillarTotals: [number, number, number, number, number],
  count: number = 5,
  avgReputation: number = 50
): CommunityRating[] {
  return Array.from({ length: count }, (_, i) => ({
    raterId: `rater_${i}`,
    contentId: 'content_mock',
    pillarScores: pillarTotals as [number, number, number, number, number],
    raterReputation: avgReputation,
  }));
}

// ===== PHẦN B: simulateUserLy() =====

/**
 * Exact simulation from the spec document:
 * - User: u_ly, Epoch: Feb 2026
 * - 3 posts, 1 mentor chain, 30-day streak, risk 0.1
 * - Expected: Light Score ~8.67, Mint ~86.7 FUN
 */
export function simulateUserLy(): SimulationResult {
  // === Content Scoring ===
  // Post 1: P_c = 8.5 → h = (0.85)^1.3 ≈ 0.80
  const post1Pillar = 8.5;
  // Post 2: P_c = 7.2 → h = (0.72)^1.3 ≈ 0.65
  const post2Pillar = 7.2;
  // Post 3: P_c = 9.0 → h = (0.90)^1.3 ≈ 0.88
  const post3Pillar = 9.0;

  const C = contentDailyScore([
    { contentTypeWeight: 1.0, pillarTotal: post1Pillar },
    { contentTypeWeight: 1.0, pillarTotal: post2Pillar },
    { contentTypeWeight: 1.0, pillarTotal: post3Pillar },
  ]);

  // === Action Base Score ===
  // Checkin: 3.0, Mentor chain: 5.0, Comments: 2.0
  const B = actionBaseScore([
    { baseScore: 3.0 },
    { baseScore: 5.0 },
    { baseScore: 2.0 },
  ]);

  // === Daily Score with multipliers ===
  const input: DailyScoreInput = {
    actionBase: B,        // 10
    contentScore: C,      // ~2.33
    streakDays: 30,
    sequenceBonus: 3,     // mentor chain bonus
    riskScore: 0.1,
  };

  const result = dailyLightScore(input);

  // === Mint Allocation ===
  const mintPool = 100_000;
  const totalSystemLight = 10_000;

  const share = result.finalScore / totalSystemLight;
  const mintAllocation = mintPool * share;

  // Anti-whale check
  const capAmount = 0.03 * mintPool; // 3,000 FUN
  const finalMint = Math.min(mintAllocation, capAmount);

  return {
    label: 'User u_ly — Feb 2026',
    epoch: '2026-02',
    contentScore: C,
    actionBase: B,
    rawScore: result.rawScore,
    consistencyMul: result.consistencyMul,
    sequenceMul: result.sequenceMul,
    integrityPen: result.integrityPen,
    finalLightScore: result.finalScore,
    mintAllocation: Math.round(finalMint * 100) / 100,
    details: {
      post1_h: Math.pow(post1Pillar / 10, 1.3),
      post2_h: Math.pow(post2Pillar / 10, 1.3),
      post3_h: Math.pow(post3Pillar / 10, 1.3),
      mintPool,
      totalSystemLight,
      share,
      capAmount,
      antiWhalePassed: mintAllocation <= capAmount,
    },
  };
}

// ===== PHẦN D: runTestCases() =====

/**
 * 4 test scenarios from the spec document.
 * Each validates a core system behavior.
 */
export function runTestCases(): TestCaseResult[] {
  return [
    testSpamBurst(),
    testViralDrama(),
    testSilentConsistent(),
    testRatingRing(),
  ];
}

/** Test 1 — Spam burst: 50 low-quality posts → low score */
function testSpamBurst(): TestCaseResult {
  // 50 posts with very low pillar scores (P_c = 2.0 each)
  const contents = Array.from({ length: 50 }, () => ({
    contentTypeWeight: 1.0,
    pillarTotal: 2.0, // low quality
  }));

  const C = contentDailyScore(contents);
  const B = actionBaseScore([{ baseScore: 1.0 }]); // minimal action

  const result = dailyLightScore({
    actionBase: B,
    contentScore: C,
    streakDays: 1,
    sequenceBonus: 0,
    riskScore: 0.3, // spam detection raises risk
  });

  // Compare with a quality user who posts 3 good posts
  const qualityC = contentDailyScore([
    { contentTypeWeight: 1.0, pillarTotal: 9.0 },
    { contentTypeWeight: 1.0, pillarTotal: 8.5 },
    { contentTypeWeight: 1.0, pillarTotal: 8.0 },
  ]);
  const qualityResult = dailyLightScore({
    actionBase: 10,
    contentScore: qualityC,
    streakDays: 30,
    sequenceBonus: 2,
    riskScore: 0,
  });

  // The quality exponent (1.3) makes low scores drop dramatically:
  // (2/10)^1.3 ≈ 0.148 vs (9/10)^1.3 ≈ 0.868
  // Even 50 * 0.148 = 7.4 content score, but risk + no multipliers = low final
  const passed = result.finalScore < qualityResult.finalScore;

  return {
    name: 'Test 1 — Spam Burst',
    description: '50 low-quality posts should score lower than 3 high-quality posts with consistency',
    expectedBehavior: 'Content exponent crushes low-quality volume; risk penalty reduces further',
    actualValue: result.finalScore,
    passed,
    details: {
      spamScore: result.finalScore,
      qualityScore: qualityResult.finalScore,
      spamContentScore: C,
      qualityContentScore: qualityC,
      ratio: qualityResult.finalScore / result.finalScore,
    },
  };
}

/** Test 2 — Viral drama: high ratings but healing=0 → low P_c */
function testViralDrama(): TestCaseResult {
  // High in truth, sustain, service, unity — but healing = 0
  const ratings = mockRatings([2, 2, 0, 2, 2], 10, 100);
  const pillarResult = contentPillarScore(ratings);
  // P_c = ~8.0 (missing one pillar entirely: 2+2+0+2+2 = 8)

  const fullRatings = mockRatings([2, 2, 2, 2, 2], 10, 100);
  const fullPillarResult = contentPillarScore(fullRatings);
  // P_c = 10.0

  const dramaH = Math.pow(pillarResult.total / 10, 1.3);
  const fullH = Math.pow(fullPillarResult.total / 10, 1.3);

  // Missing one pillar reduces total by 20% → with γ=1.3, reduction is amplified
  const passed = pillarResult.total < fullPillarResult.total;

  return {
    name: 'Test 2 — Viral Drama',
    description: 'High ratings but healing pillar = 0 should reduce content score',
    expectedBehavior: 'Missing pillar lowers P_c → quality exponent amplifies the penalty',
    actualValue: pillarResult.total,
    passed,
    details: {
      dramaPillarTotal: pillarResult.total,
      fullPillarTotal: fullPillarResult.total,
      dramaH,
      fullH,
      reductionPercent: ((1 - dramaH / fullH) * 100).toFixed(1) + '%',
    },
  };
}

/** Test 3 — Silent consistent: 60-day streak, few high-quality posts → beats noisy users */
function testSilentConsistent(): TestCaseResult {
  // Silent contributor: 2 excellent posts, 60-day streak
  const silentC = contentDailyScore([
    { contentTypeWeight: 1.0, pillarTotal: 9.5 },
    { contentTypeWeight: 1.0, pillarTotal: 9.0 },
  ]);

  const silentResult = dailyLightScore({
    actionBase: 5,
    contentScore: silentC,
    streakDays: 60,
    sequenceBonus: 1,
    riskScore: 0,
  });

  // Noisy user: 10 medium posts, no streak
  const noisyC = contentDailyScore(
    Array.from({ length: 10 }, () => ({
      contentTypeWeight: 1.0,
      pillarTotal: 5.0,
    }))
  );

  const noisyResult = dailyLightScore({
    actionBase: 15,
    contentScore: noisyC,
    streakDays: 3,
    sequenceBonus: 0,
    riskScore: 0.15,
  });

  const passed = silentResult.finalScore > noisyResult.finalScore;

  return {
    name: 'Test 3 — Silent Consistent',
    description: '60-day streak with few excellent posts should beat noisy medium-quality users',
    expectedBehavior: 'Consistency multiplier + quality exponent > volume of mediocre content',
    actualValue: silentResult.finalScore,
    passed,
    details: {
      silentScore: silentResult.finalScore,
      noisyScore: noisyResult.finalScore,
      silentConsistencyMul: silentResult.consistencyMul,
      noisyConsistencyMul: noisyResult.consistencyMul,
      silentContentScore: silentC,
      noisyContentScore: noisyC,
    },
  };
}

/** Test 4 — Rating ring: 5 users rating each other → penalty activates */
function testRatingRing(): TestCaseResult {
  // Ring users have high risk scores detected by anti-farm system
  const ringRiskScore = 0.6; // detected as rating ring

  const ringResult = dailyLightScore({
    actionBase: 8,
    contentScore: 3.0,
    streakDays: 10,
    sequenceBonus: 1,
    riskScore: ringRiskScore,
  });

  // Normal user with same base scores but clean behavior
  const normalResult = dailyLightScore({
    actionBase: 8,
    contentScore: 3.0,
    streakDays: 10,
    sequenceBonus: 1,
    riskScore: 0,
  });

  const penaltyFactor = integrityPenalty(ringRiskScore);
  const passed = ringResult.finalScore < normalResult.finalScore && penaltyFactor < 0.6;

  return {
    name: 'Test 4 — Rating Ring',
    description: '5 users rating each other should trigger integrity penalty',
    expectedBehavior: 'High risk score → integrity penalty reduces final score by ~50%',
    actualValue: ringResult.finalScore,
    passed,
    details: {
      ringScore: ringResult.finalScore,
      normalScore: normalResult.finalScore,
      penaltyFactor,
      reductionPercent: ((1 - ringResult.finalScore / normalResult.finalScore) * 100).toFixed(1) + '%',
      ringRiskScore,
    },
  };
}

// ===== RUNNER =====

/** Run all simulations and tests, returns a summary */
export function runFullSimulation(): {
  userLy: SimulationResult;
  testCases: TestCaseResult[];
  allPassed: boolean;
  summary: string;
} {
  const userLy = simulateUserLy();
  const testCases = runTestCases();
  const allPassed = testCases.every(t => t.passed);

  const summary = [
    `=== LS-Math v1.0 Simulation Report ===`,
    ``,
    `User u_ly Light Score: ${userLy.finalLightScore} (expected ~8.67)`,
    `Mint Allocation: ${userLy.mintAllocation} FUN (expected ~86.7)`,
    ``,
    `Test Results:`,
    ...testCases.map(t => `  ${t.passed ? '✅' : '❌'} ${t.name}: ${t.actualValue.toFixed(4)}`),
    ``,
    `All tests ${allPassed ? 'PASSED ✅' : 'FAILED ❌'}`,
  ].join('\n');

  return { userLy, testCases, allPassed, summary };
}
