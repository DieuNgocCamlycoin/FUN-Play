/**
 * FUN Money Constitution v2.0 Contract Info
 * Reference metadata for the Solidity contract
 */

export const CONSTITUTION_V2_CONTRACT_INFO = {
  name: 'FUNMoneyProductionV1_2_1',
  version: '1.2.1',
  standard: 'BEP-20 (ERC-20 compatible)',
  compiler: 'solidity ^0.8.20',
  license: 'MIT',
  sourceFile: 'FUNMoney-v1.2.1-final.sol',
  deployedAddress: '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6',
  chain: 'BSC Testnet (Chain ID: 97)',
  status: 'deployed' as const,

  features: {
    fourPools: true,        // Community, Platform, Recycle, Guardian
    stateMachine: true,     // LOCKED → ACTIVATED → FLOWING → RECYCLE
    recycleTimer: true,     // Anti-Hoarding: 90-day grace, 0.1%/day decay
    guardianTimelock: true, // All Guardian actions time-locked on-chain
    pureLoveProof: true,    // Event log for PPLP attestations
    noTeamPool: true,       // ❌ FORBIDDEN by Constitution
    noInvestorPool: true,   // ❌ FORBIDDEN by Constitution
    noBurn: true,           // FUN Money không tiêu hủy, chỉ đổi trạng thái
  },

  pools: {
    communityPool:  { percent: 40, description: 'Trái tim của FUN Money — nơi FUN được sinh ra & quay về' },
    platformPool:   { percent: 30, description: 'Kích hoạt dịch vụ, AI, game, tính năng' },
    recyclePool:    { percent: 20, description: 'Thu hồi FUN không còn dòng chảy' },
    guardianPool:   { percent: 10, description: 'Giữ Luật — ổn định hệ thống' },
  },

  lifecycle: ['LOCKED', 'ACTIVATED', 'FLOWING', 'RECYCLE'] as const,

  events: [
    'PureLoveAccepted(address indexed user, bytes32 indexed action, uint256 amount, uint32 version)',
    'Activated(address indexed user, uint256 amount)',
    'Claimed(address indexed user, uint256 amount)',
    'Recycled(address indexed user, uint256 amount, uint256 inactiveDays)',
    'GuardianActionQueued(bytes32 indexed actionId, uint256 executeAfter)',
    'GuardianActionExecuted(bytes32 indexed actionId)',
  ],

  /** Constitution reference */
  constitution: 'v2.0 — Unified Charter for AI Agent & Smart Contract',
  whitepaper: 'THE 5D WHITEPAPER v0.1',
  author: 'CamLy Duong (Guardian)',
} as const;
