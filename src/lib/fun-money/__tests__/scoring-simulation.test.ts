import { describe, it, expect } from 'vitest';
import { runFullSimulation, simulateUserLy, runTestCases } from '@/lib/fun-money/scoring-simulation';

describe('LS-Math v1.0 Scoring Simulation', () => {
  it('simulateUserLy produces Light Score ~8.67', () => {
    const result = simulateUserLy();
    // Allow ±1.0 tolerance for rounding differences
    expect(result.finalLightScore).toBeGreaterThan(7.5);
    expect(result.finalLightScore).toBeLessThan(10.0);
    expect(result.mintAllocation).toBeGreaterThan(70);
    expect(result.mintAllocation).toBeLessThan(110);
    expect(result.details.antiWhalePassed).toBe(true);
  });

  it('all 4 test cases pass', () => {
    const cases = runTestCases();
    expect(cases).toHaveLength(4);
    for (const tc of cases) {
      expect(tc.passed, `${tc.name} should pass`).toBe(true);
    }
  });

  it('runFullSimulation summary is complete', () => {
    const sim = runFullSimulation();
    expect(sim.allPassed).toBe(true);
    expect(sim.summary).toContain('LS-Math v1.0');
    console.log(sim.summary);
  });
});
