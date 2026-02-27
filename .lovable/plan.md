

## Plan: Scoring Config V1 + End-to-End Test Suite ✅ COMPLETED

Add the formal scoring config, end-to-end simulation examples, and unit test cases as specified in the document.

---

### 1. ✅ Create `src/lib/fun-money/scoring-config-v1.ts`

Scoring rules config object matching the YAML spec exactly:
- `rule_version: "LS-Math-v1.0"`
- All weights, reputation, content, consistency, sequence, penalty, mint params
- Updated content type multipliers: `comment: 0.6`, `video: 1.2`, `course: 1.5`, `bug_report: 1.1`, `proposal: 1.3`

### 2. ✅ Update `CONTENT_TYPE_WEIGHTS` in `light-score-math.ts`

Aligned with the new config values:
- `comment: 0.4 → 0.6`
- `video: 1.5 → 1.2`
- `course: 2.0 → 1.5`
- `bug_report: 0.8 → 1.1`
- Added `proposal: 1.3`

### 3. ✅ Create `src/lib/fun-money/scoring-simulation.ts`

End-to-end simulation module with:
- **`simulateUserLy()`**: Exact example (u_ly, Feb 2026, 3 posts, mentor chain, 30-day streak, risk 0.1) → Light Score ~8.67, Mint ~86.7 FUN
- **`runTestCases()`**: 4 test scenarios all passing:
  - Test 1 — Spam burst: 50 low-quality posts → low score ✅
  - Test 2 — Viral drama: high ratings but healing=0 → low P_c ✅
  - Test 3 — Silent consistent: 60-day streak beats noisy users ✅
  - Test 4 — Rating ring: penalty activates on colluding users ✅
- **`runFullSimulation()`**: Combined runner with summary report

### 4. ✅ Updated `index.ts` exports and `plan.md`
