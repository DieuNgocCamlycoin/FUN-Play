/**
 * FUN Money SDK v1.0
 * Central export file
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

// Web3 Configuration
export * from './web3-config';

// EIP-712 Signer (exclude duplicates from web3-config)
export { 
  getEip712Domain, 
  PPLP_TYPES, 
  type PPLPData, 
  type SignatureVerification,
  createPPLPTypedData,
  signPPLP,
  verifyPPLPSignature,
  verifyPPLPSignatureWithDetails,
  preparePPLPData
} from './eip712-signer';

// Contract Helpers
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
