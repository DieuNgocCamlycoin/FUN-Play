/**
 * FUN Money Contract Helpers
 * SDK v2.0 — FUNMoneyMinter (direct mint, no EIP-712)
 */

import { Contract, BrowserProvider, JsonRpcSigner, keccak256, toUtf8Bytes } from 'ethers';
import {
  getContractAddress,
  FUN_MONEY_ABI,
  BSC_TESTNET_CONFIG,
  checkContractExists,
} from './web3-config';

/**
 * Action string for on-chain — all actions map to this single string.
 * Specific action types are stored in DB (mint_requests.action_type).
 */
export const CONTRACT_ACTION = 'FUN_REWARD';

// ===== VALIDATION TYPES =====

export interface ValidationDetail {
  key: string;
  label: string;
  labelVi: string;
  passed: boolean;
  value: string;
  hint?: string;
  status: 'success' | 'warning' | 'error' | 'unknown';
}

export interface MintValidation {
  canMint: boolean;
  issues: string[];
  details: ValidationDetail[];
  contractAddress: string;
}

// ===== PRE-MINT VALIDATION =====

/**
 * Validate conditions before minting with FUNMoneyMinter.
 * Checks: network, contract exists, authorized minter status.
 */
export async function validateBeforeMint(
  provider: BrowserProvider,
  minterAddress: string,
  _actionType?: string
): Promise<MintValidation> {
  const contractAddress = getContractAddress();
  const issues: string[] = [];
  const details: ValidationDetail[] = [];

  try {
    // 1. Check network
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const correctNetwork = chainId === BSC_TESTNET_CONFIG.chainId;

    details.push({
      key: 'network',
      label: 'Network',
      labelVi: 'Mạng blockchain',
      passed: correctNetwork,
      value: correctNetwork ? 'BSC Testnet ✓' : `Chain ID: ${chainId}`,
      hint: !correctNetwork ? `Please switch to BSC Testnet (Chain ID: ${BSC_TESTNET_CONFIG.chainId})` : undefined,
      status: correctNetwork ? 'success' : 'error'
    });

    if (!correctNetwork) {
      issues.push(`Wrong network. Need BSC Testnet (Chain ID: ${BSC_TESTNET_CONFIG.chainId})`);
      return { canMint: false, issues, details, contractAddress };
    }

    // 2. Check contract exists
    const contractExists = await checkContractExists(provider, contractAddress);

    details.push({
      key: 'contract',
      label: 'Contract Exists',
      labelVi: 'Contract tồn tại',
      passed: contractExists,
      value: contractExists ? 'Deployed ✓' : 'Not Found',
      hint: !contractExists ? `No contract at ${contractAddress.slice(0, 10)}...` : undefined,
      status: contractExists ? 'success' : 'error'
    });

    if (!contractExists) {
      issues.push('Contract not deployed at this address');
      return { canMint: false, issues, details, contractAddress };
    }

    const contract = new Contract(contractAddress, FUN_MONEY_ABI, provider);

    // 3. Check if caller is authorized minter
    let isMinter = false;
    try {
      isMinter = await contract.authorizedMinters(minterAddress);
      details.push({
        key: 'minter',
        label: 'Authorized Minter',
        labelVi: 'Quyền Minter',
        passed: isMinter,
        value: isMinter ? 'Authorized ✓' : 'Not Authorized',
        hint: !isMinter ? 'This wallet is not an authorized minter' : undefined,
        status: isMinter ? 'success' : 'error'
      });
      if (!isMinter) {
        issues.push('Wallet is not an authorized minter');
      }
    } catch {
      details.push({
        key: 'minter',
        label: 'Authorized Minter',
        labelVi: 'Quyền Minter',
        passed: false,
        value: 'Check failed',
        status: 'warning'
      });
      issues.push('Could not verify minter status');
    }

    const hardIssues = issues.filter(i => !i.startsWith('Could not'));
    return { canMint: hardIssues.length === 0, issues, details, contractAddress };
  } catch (err: any) {
    return {
      canMint: false,
      issues: [`Validation error: ${err.message?.slice(0, 80)}`],
      details: [
        ...details,
        {
          key: 'error',
          label: 'Connection Error',
          labelVi: 'Lỗi kết nối',
          passed: false,
          value: 'Failed',
          hint: err.message,
          status: 'error'
        }
      ],
      contractAddress
    };
  }
}

// ===== MINTING FUNCTION =====

/**
 * Direct mint via FUNMoneyMinter.mintValidatedAction
 * No EIP-712 signatures required — caller must be authorizedMinter.
 * 99/1 split is handled on-chain.
 */
export async function mintFunMoney(
  signer: JsonRpcSigner,
  recipientAddress: string,
  actionType: string,
  amount: bigint,
  evidenceData: object
): Promise<string> {
  const contractAddress = getContractAddress();
  const contract = new Contract(contractAddress, FUN_MONEY_ABI, signer);

  // Create actionId from evidence (unique per action)
  const actionId = keccak256(toUtf8Bytes(JSON.stringify({
    recipient: recipientAddress,
    actionType,
    amount: amount.toString(),
    timestamp: Date.now(),
  })));

  // Create validation digest from evidence
  const validationDigest = keccak256(toUtf8Bytes(JSON.stringify(evidenceData)));

  // Preflight gas estimate
  try {
    await contract.mintValidatedAction.estimateGas(
      actionId,
      recipientAddress,
      amount,
      validationDigest
    );
  } catch (err: any) {
    const decoded = decodeRevertError(err.data || err.info?.error?.data);
    throw new Error(`Preflight failed: ${decoded}`);
  }

  // Execute
  const tx = await contract.mintValidatedAction(
    actionId,
    recipientAddress,
    amount,
    validationDigest
  );

  const receipt = await tx.wait();
  return receipt.hash;
}

// ===== ERROR DECODING =====

export function decodeRevertError(data: string | null): string {
  if (!data || data === "0x") {
    return "No revert data (silent revert)";
  }

  const selector = data.slice(0, 10).toLowerCase();

  if (selector === "0x08c379a0" && data.length > 10) {
    try {
      const hexString = data.slice(10);
      const length = parseInt(hexString.slice(64, 128), 16);
      const messageHex = hexString.slice(128, 128 + length * 2);
      const bytes = new Uint8Array(
        (messageHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16))
      );
      return `Revert: "${new TextDecoder().decode(bytes)}"`;
    } catch {
      return "Error(string) - Could not decode";
    }
  }

  const knownErrors: Record<string, string> = {
    "NotOwner": "Caller is not the owner",
    "NotAuthorizedMinter": "Caller is not an authorized minter",
    "ZeroAddress": "Cannot use zero address",
    "AlreadyProcessed": "Action already processed (duplicate mint)",
    "InvalidAmount": "Amount must be > 0",
    "InvalidClaimableAmount": "Claimable amount exceeds user mint",
  };

  for (const [key, desc] of Object.entries(knownErrors)) {
    const keyHex = Array.from(new TextEncoder().encode(key))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    if (data.toLowerCase().includes(keyHex.toLowerCase())) {
      return `${key}: ${desc}`;
    }
  }

  return `Unknown error: ${selector}`;
}

// ===== DEBUG BUNDLE =====

export interface MintDebugBundle {
  timestamp: string;
  network: { chainId: number; expectedChainId: number; isCorrect: boolean };
  contract: { address: string; exists: boolean };
  wallet: { address: string; isAuthorizedMinter: boolean | null };
  mint: {
    actionId: string;
    user: string;
    totalMint: string;
    validationDigest: string;
  };
  preflight: { success: boolean; error: string | null };
  error: { code: string | number | null; message: string | null } | null;
}

export function createDebugBundle(): MintDebugBundle {
  return {
    timestamp: new Date().toISOString(),
    network: { chainId: 0, expectedChainId: 97, isCorrect: false },
    contract: { address: "", exists: false },
    wallet: { address: "", isAuthorizedMinter: null },
    mint: { actionId: "", user: "", totalMint: "0", validationDigest: "" },
    preflight: { success: false, error: null },
    error: null
  };
}

export function formatDebugBundle(bundle: MintDebugBundle): string {
  return JSON.stringify(bundle, null, 2);
}
