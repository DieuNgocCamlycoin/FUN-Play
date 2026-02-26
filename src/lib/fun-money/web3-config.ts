/**
 * FUN Money Web3 Configuration
 * SDK v1.0
 */

import { Contract, BrowserProvider, keccak256, toUtf8Bytes } from 'ethers';

// ===== CONTRACT CONFIGURATION =====

/**
 * Default FUN Money contract address on BSC Testnet
 * Update this after deploying to mainnet
 */
export const DEFAULT_CONTRACT_ADDRESS = '0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2';

/**
 * Storage key for custom contract address
 */
const CONTRACT_ADDRESS_KEY = 'fun_money_contract_address';

/**
 * Get current contract address (from localStorage or default)
 */
export function getContractAddress(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CONTRACT_ADDRESS_KEY) || DEFAULT_CONTRACT_ADDRESS;
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

/**
 * Set custom contract address
 */
export function setContractAddress(address: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONTRACT_ADDRESS_KEY, address);
  }
}

// ===== CHAIN CONFIGURATION =====

export const BSC_TESTNET_CONFIG = {
  chainId: 97,
  chainIdHex: '0x61',
  name: 'BNB Smart Chain Testnet',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  explorerUrl: 'https://testnet.bscscan.com',
  explorerTxUrl: (txHash: string) => `https://testnet.bscscan.com/tx/${txHash}`,
  explorerAddressUrl: (address: string) => `https://testnet.bscscan.com/address/${address}`,
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18
  }
};

export const BSC_MAINNET_CONFIG = {
  chainId: 56,
  chainIdHex: '0x38',
  name: 'BNB Smart Chain',
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  explorerUrl: 'https://bscscan.com',
  explorerTxUrl: (txHash: string) => `https://bscscan.com/tx/${txHash}`,
  explorerAddressUrl: (address: string) => `https://bscscan.com/address/${address}`,
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18
  }
};

// ===== CONTRACT ABI =====

/**
 * FUN Money Constitution v2.0 ABI
 * 
 * CRITICAL NOTES:
 * - lockWithPPLP takes `string action` (NOT bytes32 hash!)
 * - Contract hashes the action string internally
 * - Nonce is read from recipient address, not signer
 * - 4 Pool structure (Community, Platform, Recycle, Guardian)
 * - Token State Machine: LOCKED → ACTIVATED → FLOWING → RECYCLE
 * - Anti-Hoarding: recycleInactive() returns dormant FUN to Community Pool
 */
export const FUN_MONEY_ABI = [
  // ===== READ FUNCTIONS - Basic ERC20 =====
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function nonces(address user) view returns (uint256)',
  
  // ===== READ FUNCTIONS - PPLP Specific =====
  'function pauseTransitions() view returns (bool)',
  'function isAttester(address) view returns (bool)',
  'function attesterThreshold() view returns (uint256)',
  'function epochMintCap() view returns (uint256)',
  'function epochDuration() view returns (uint256)',
  'function epochs(bytes32) view returns (uint64 start, uint256 minted)',
  'function actions(bytes32) view returns (bool allowed, uint32 version, bool deprecated)',
  'function guardianGov() view returns (address)',
  'function alloc(address) view returns (uint256 locked, uint256 activated)',

  // ===== READ FUNCTIONS - 4 Pool Structure (Constitution v2.0, Chương VI) =====
  'function communityPool() view returns (address)',
  'function platformPool() view returns (address)',
  'function recyclePool() view returns (address)',
  'function guardianPool() view returns (address)',
  
  // ===== READ FUNCTIONS - Recycle / Anti-Hoarding (Chương V) =====
  'function lastActivity(address user) view returns (uint256)',
  'function gracePeriod() view returns (uint256)',
  'function decayRateBps() view returns (uint256)',
  'function maxDecayBps() view returns (uint256)',
  
  // ===== READ FUNCTIONS - Guardian Timelock (Chương VII-VIII) =====
  'function timelockDelay() view returns (uint256)',
  'function pendingAction(bytes32 actionId) view returns (uint256 executeAfter, bool executed)',
  
  // ===== WRITE FUNCTIONS =====
  
  /**
   * Core minting function — Constitution v2.0 Chương III (PPLP)
   * @param user - Recipient address (NOT signer!)
   * @param action - Action string (e.g., "CONTENT_CREATE")
   * @param amount - Amount in atomic units (18 decimals)
   * @param evidenceHash - keccak256 hash of evidence
   * @param sigs - Array of EIP-712 signatures
   */
  'function lockWithPPLP(address user, string action, uint256 amount, bytes32 evidenceHash, bytes[] sigs) external',
  
  /**
   * Activate locked tokens: LOCKED → ACTIVATED (Chương IV)
   */
  'function activate(uint256 amount) external',
  
  /**
   * Claim activated tokens: ACTIVATED → FLOWING (Chương IV)
   */
  'function claim(uint256 amount) external',
  
  /**
   * Recycle inactive balance: FLOWING → RECYCLE → Community Pool (Chương V)
   * Anyone can call this for any address after grace period
   * "FUN không sinh ra để ngủ yên. FUN sinh ra để chảy như Ánh Sáng."
   */
  'function recycleInactive(address user) external',
  
  /**
   * Guardian: queue a timelock action (Chương VII)
   */
  'function queueGuardianAction(bytes32 actionId, bytes calldata data) external',
  
  /**
   * Guardian: execute a queued timelock action (Chương VII)
   */
  'function executeGuardianAction(bytes32 actionId) external',
  
  // ===== EVENTS =====
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event PureLoveAccepted(address indexed user, bytes32 indexed action, uint256 amount, uint32 version)',
  'event Activated(address indexed user, uint256 amount)',
  'event Claimed(address indexed user, uint256 amount)',
  'event Recycled(address indexed user, uint256 amount, uint256 inactiveDays)',
  'event GuardianActionQueued(bytes32 indexed actionId, uint256 executeAfter)',
  'event GuardianActionExecuted(bytes32 indexed actionId)'
];

// ===== HELPER FUNCTIONS =====

/**
 * Create contract instance for read operations
 */
export function getContract(provider: BrowserProvider): Contract {
  return new Contract(getContractAddress(), FUN_MONEY_ABI, provider);
}

/**
 * Create contract instance for write operations (with signer)
 */
export async function getContractWithSigner(provider: BrowserProvider): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(getContractAddress(), FUN_MONEY_ABI, signer);
}

/**
 * Create action hash from action type string
 * @param actionType - e.g., "CONTENT_CREATE"
 * @returns bytes32 hash
 */
export function createActionHash(actionType: string): string {
  return keccak256(toUtf8Bytes(actionType));
}

/**
 * Create evidence hash from evidence data
 * @param data - Evidence object to hash
 * @returns bytes32 hash
 */
export function createEvidenceHash(data: {
  actionType: string;
  timestamp: number;
  pillars?: Record<string, number>;
  metadata?: Record<string, unknown>;
}): string {
  const json = JSON.stringify(data);
  return keccak256(toUtf8Bytes(json));
}

/**
 * Get nonce for an address
 * CRITICAL: Always get nonce for RECIPIENT, not signer!
 */
export async function getNonce(provider: BrowserProvider, address: string): Promise<bigint> {
  const contract = getContract(provider);
  return await contract.nonces(address);
}

/**
 * Get FUN token balance (FLOWING state)
 */
export async function getBalance(provider: BrowserProvider, address: string): Promise<bigint> {
  const contract = getContract(provider);
  return await contract.balanceOf(address);
}

/**
 * Get allocation (LOCKED + ACTIVATED states)
 */
export async function getAllocation(provider: BrowserProvider, address: string): Promise<{
  locked: bigint;
  activated: bigint;
}> {
  const contract = getContract(provider);
  const result = await contract.alloc(address);
  return {
    locked: result.locked ?? result[0] ?? 0n,
    activated: result.activated ?? result[1] ?? 0n
  };
}

/**
 * Check if contract exists at address
 */
export async function checkContractExists(provider: BrowserProvider, address: string): Promise<boolean> {
  const code = await provider.getCode(address);
  return code !== '0x' && code !== '0x0' && code.length > 2;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format FUN amount for display
 * @param amountAtomic - Amount in atomic units (BigInt or string)
 * @returns Formatted string like "125.50 FUN"
 */
export function formatFunDisplay(amountAtomic: bigint | string): string {
  const amount = typeof amountAtomic === 'string' ? BigInt(amountAtomic) : amountAtomic;
  const decimals = 18n;
  const whole = amount / (10n ** decimals);
  const fraction = amount % (10n ** decimals);
  
  if (fraction === 0n) {
    return `${whole.toLocaleString()} FUN`;
  }
  
  const fractionStr = fraction.toString().padStart(Number(decimals), '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fractionStr} FUN`;
}

// ===== TOKEN LIFECYCLE FUNCTIONS =====

/**
 * Activate tokens: LOCKED → ACTIVATED
 * @param provider - BrowserProvider with connected wallet
 * @param amount - Amount to activate
 * @returns Transaction hash
 */
export async function activateTokens(provider: BrowserProvider, amount: bigint): Promise<string> {
  const contract = await getContractWithSigner(provider);
  const tx = await contract.activate(amount);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Claim tokens: ACTIVATED → FLOWING
 * @param provider - BrowserProvider with connected wallet
 * @param amount - Amount to claim
 * @returns Transaction hash
 */
export async function claimTokens(provider: BrowserProvider, amount: bigint): Promise<string> {
  const contract = await getContractWithSigner(provider);
  const tx = await contract.claim(amount);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ===== RECYCLE / ANTI-HOARDING FUNCTIONS (Constitution v2.0, Chương V) =====

/**
 * Get last activity timestamp for an address
 */
export async function getLastActivity(provider: BrowserProvider, address: string): Promise<bigint> {
  const contract = getContract(provider);
  return await contract.lastActivity(address);
}

/**
 * Recycle inactive balance back to Community Pool
 * Anyone can call this for any address after grace period expires
 * "FUN không sinh ra để ngủ yên. FUN sinh ra để chảy như Ánh Sáng."
 */
export async function recycleInactive(provider: BrowserProvider, userAddress: string): Promise<string> {
  const contract = await getContractWithSigner(provider);
  const tx = await contract.recycleInactive(userAddress);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Get all 4 pool addresses from contract
 */
export async function getPoolAddresses(provider: BrowserProvider): Promise<{
  communityPool: string;
  platformPool: string;
  recyclePool: string;
  guardianPool: string;
}> {
  const contract = getContract(provider);
  const [community, platform, recycle, guardian] = await Promise.all([
    contract.communityPool(),
    contract.platformPool(),
    contract.recyclePool(),
    contract.guardianPool()
  ]);
  return {
    communityPool: community,
    platformPool: platform,
    recyclePool: recycle,
    guardianPool: guardian
  };
}

// ===== IMPORTANT ADDRESSES =====

export const KNOWN_ADDRESSES = {
  // Governance wallet
  governance: '0x7d037462503bea2f61cDB9A482aAc72a8f4F3f0f',
  // Community Pool (receives 99% of mints)
  communityPool: '0x57da82dD53E3254576F7e578016d6d274290d949',
  // Angel AI Attester (default attester)
  angelAiAttester: '0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D'
};
