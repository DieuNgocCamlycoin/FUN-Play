/**
 * FUN Money Web3 Configuration
 * SDK v2.0 — FUNMoneyMinter contract
 */

import { Contract, BrowserProvider, keccak256, toUtf8Bytes } from 'ethers';

// ===== CONTRACT CONFIGURATION =====

/**
 * FUNMoneyMinter contract address on BSC Testnet
 * TODO: Update after deploying FUNMoneyMinter
 */
export const DEFAULT_CONTRACT_ADDRESS = '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6';

const CONTRACT_ADDRESS_KEY = 'fun_money_contract_address';

export function getContractAddress(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CONTRACT_ADDRESS_KEY) || DEFAULT_CONTRACT_ADDRESS;
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

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

// ===== CONTRACT ABI — FUNMoneyMinter =====

/**
 * FUNMoneyMinter ABI
 * Replaces the legacy v1.2.1 3-step flow (lockWithPPLP → activate → claim)
 * with a 1-step direct mint: mintValidatedAction
 * 
 * 99/1 split is enforced on-chain via USER_BPS/PLATFORM_BPS constants.
 */
export const FUN_MONEY_ABI = [
  // ===== READ — ERC20-like =====
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',

  // ===== READ — FUNMoneyMinter =====
  'function owner() view returns (address)',
  'function funToken() view returns (address)',
  'function platformTreasury() view returns (address)',
  'function authorizedMinters(address) view returns (bool)',
  'function processedActionIds(bytes32) view returns (bool)',
  'function USER_BPS() view returns (uint16)',
  'function PLATFORM_BPS() view returns (uint16)',
  'function BPS_DENOMINATOR() view returns (uint16)',

  // ===== READ — Locked Grants =====
  'function getLockedGrants(address user) view returns (tuple(uint256 amount, uint64 releaseAt, bool claimed)[])',
  'function previewSplit(uint256 totalMint) view returns (uint256 userMint, uint256 platformMint)',

  // ===== WRITE — Mint =====
  /**
   * Direct mint for validated action (authorized minter only)
   * 99% → user, 1% → platform treasury (on-chain enforced)
   */
  'function mintValidatedAction(bytes32 actionId, address user, uint256 totalMint, bytes32 validationDigest) external',
  
  /**
   * Mint with time-locked portion
   */
  'function mintValidatedActionLocked(bytes32 actionId, address user, uint256 totalMint, uint256 userClaimableNow, uint64 releaseAt, bytes32 validationDigest) external',

  /**
   * User releases locked grant after releaseAt timestamp
   */
  'function releaseLockedGrant(uint256 index) external',

  // ===== WRITE — Owner =====
  'function transferOwnership(address newOwner) external',
  'function setAuthorizedMinter(address account, bool allowed) external',
  'function setPlatformTreasury(address newTreasury) external',
  'function setToken(address newToken) external',

  // ===== EVENTS =====
  'event ActionMinted(bytes32 indexed actionId, address indexed user, uint256 totalMint, uint256 userMint, uint256 platformMint, bytes32 validationDigest)',
  'event ActionMintedLocked(bytes32 indexed actionId, address indexed user, uint256 totalMint, uint256 userClaimable, uint256 userLocked, uint256 platformMint, uint64 releaseAt, bytes32 validationDigest)',
  'event LockedBalanceReleased(address indexed user, uint256 amount)',
  'event MinterSet(address indexed account, bool allowed)',
  'event OwnerTransferred(address indexed previousOwner, address indexed newOwner)',
  'event PlatformTreasuryUpdated(address indexed previousTreasury, address indexed newTreasury)',
  'event TokenUpdated(address indexed previousToken, address indexed newToken)',
];

// ===== HELPER FUNCTIONS =====

export function getContract(provider: BrowserProvider): Contract {
  return new Contract(getContractAddress(), FUN_MONEY_ABI, provider);
}

export async function getContractWithSigner(provider: BrowserProvider): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(getContractAddress(), FUN_MONEY_ABI, signer);
}

export function createActionHash(actionType: string): string {
  return keccak256(toUtf8Bytes(actionType));
}

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
 * Get FUN token balance (direct ERC20 balance)
 */
export async function getBalance(provider: BrowserProvider, address: string): Promise<bigint> {
  const contract = getContract(provider);
  return await contract.balanceOf(address);
}

/**
 * Check if an address is an authorized minter
 */
export async function isAuthorizedMinter(provider: BrowserProvider, address: string): Promise<boolean> {
  const contract = getContract(provider);
  return await contract.authorizedMinters(address);
}

/**
 * Get locked grants for a user
 */
export interface LockedGrant {
  amount: bigint;
  releaseAt: number;
  claimed: boolean;
}

export async function getLockedGrants(provider: BrowserProvider, address: string): Promise<LockedGrant[]> {
  const contract = getContract(provider);
  const grants = await contract.getLockedGrants(address);
  return grants.map((g: any) => ({
    amount: BigInt(g.amount),
    releaseAt: Number(g.releaseAt),
    claimed: g.claimed,
  }));
}

/**
 * Release a locked grant (user calls this)
 */
export async function releaseLockedGrant(provider: BrowserProvider, index: number): Promise<string> {
  const contract = await getContractWithSigner(provider);
  const tx = await contract.releaseLockedGrant(index);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Preview the 99/1 split for a given amount
 */
export async function previewSplit(provider: BrowserProvider, totalMint: bigint): Promise<{ userMint: bigint; platformMint: bigint }> {
  const contract = getContract(provider);
  const [userMint, platformMint] = await contract.previewSplit(totalMint);
  return { userMint, platformMint };
}

/**
 * Check if contract exists at address
 */
export async function checkContractExists(provider: BrowserProvider, address: string): Promise<boolean> {
  const code = await provider.getCode(address);
  return code !== '0x' && code !== '0x0' && code.length > 2;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

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

// ===== IMPORTANT ADDRESSES =====

export const KNOWN_ADDRESSES = {
  governance: '0x7d037462503bea2f61cDB9A482aAc72a8f4F3f0f',
  communityPool: '0x57da82dD53E3254576F7e578016d6d274290d949',
  angelAiAttester: '0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D'
};
