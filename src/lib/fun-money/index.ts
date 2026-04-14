/**
 * FUN Money SDK v2.0
 * Central export file — FUNMoneyMinter contract
 */

// PPLP Scoring Engine
export * from './pplp-engine';

// Scoring Config V1
export { SCORING_RULES_V1, type ScoringRulesV1 } from './scoring-config-v1';

// Scoring Simulation & Tests
export { simulateUserLy, runTestCases, runFullSimulation } from './scoring-simulation';

// Pool System & Inactivity Decay (5D Whitepaper)
export * from './pool-system';

// Constitution v2.0 — Unified Charter
export * from './constitution';

// Web3 Configuration (FUNMoneyMinter)
export * from './web3-config';

// Contract Helpers (direct mint, no EIP-712)
export { 
  type ValidationDetail,
  type MintValidation,
  validateBeforeMint,
  mintFunMoney,
  decodeRevertError,
  type MintDebugBundle,
  createDebugBundle,
  formatDebugBundle,
  CONTRACT_ACTION
} from './contract-helpers';

// Contract Source Reference
export { CONSTITUTION_V2_CONTRACT_INFO } from './contracts/contract-info';

// GOV Config (governance groups — used for management UI)
export * from './gov-config';
