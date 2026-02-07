/**
 * FUN Money Contract Helpers
 * SDK v1.0
 */

import { Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import {
  getContractAddress,
  FUN_MONEY_ABI,
  BSC_TESTNET_CONFIG,
  createActionHash,
  checkContractExists,
  getNonce as getContractNonce
} from './web3-config';
import {
  signPPLP,
  verifyPPLPSignatureWithDetails,
  preparePPLPData,
  createEvidenceHash
} from './eip712-signer';

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
 * Validate all conditions before minting
 * Run this BEFORE showing the sign/mint button
 */
export async function validateBeforeMint(
  provider: BrowserProvider,
  attesterAddress: string,
  actionType: string
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

    // 3. Check contract not paused
    let isPaused = false;
    try {
      isPaused = await contract.pauseTransitions();
      details.push({
        key: 'paused',
        label: 'Contract Active',
        labelVi: 'Contract đang hoạt động',
        passed: !isPaused,
        value: isPaused ? 'Paused' : 'Active ✓',
        hint: isPaused ? 'Contract is paused, cannot mint' : undefined,
        status: isPaused ? 'error' : 'success'
      });
      if (isPaused) {
        issues.push('Contract is PAUSED');
      }
    } catch {
      details.push({
        key: 'paused',
        label: 'Contract Active',
        labelVi: 'Contract đang hoạt động',
        passed: false,
        value: 'Check failed',
        status: 'warning'
      });
    }

    // 4. Check attester status
    let isAttester = false;
    try {
      isAttester = await contract.isAttester(attesterAddress);
      details.push({
        key: 'attester',
        label: 'Attester Status',
        labelVi: 'Quyền Attester',
        passed: isAttester,
        value: isAttester ? 'Verified ✓' : 'Not Attester',
        hint: !isAttester ? 'This wallet is not registered as an Attester' : undefined,
        status: isAttester ? 'success' : 'error'
      });
      if (!isAttester) {
        issues.push('Wallet is not registered as Attester');
      }
    } catch {
      details.push({
        key: 'attester',
        label: 'Attester Status',
        labelVi: 'Quyền Attester',
        passed: false,
        value: 'Check failed',
        status: 'warning'
      });
      issues.push('Could not verify Attester status');
    }

    // 5. Check threshold
    let thresholdOk = true;
    try {
      const threshold = await contract.attesterThreshold();
      const thresholdNum = Number(threshold);
      thresholdOk = thresholdNum === 1;
      details.push({
        key: 'threshold',
        label: 'Signature Threshold',
        labelVi: 'Ngưỡng chữ ký',
        passed: thresholdOk,
        value: `${thresholdNum} signature(s)`,
        hint: !thresholdOk ? `Need ${thresholdNum} signatures (multi-sig)` : undefined,
        status: thresholdOk ? 'success' : 'error'
      });
      if (!thresholdOk) {
        issues.push(`Contract requires ${thresholdNum} signatures (multi-sig)`);
      }
    } catch {
      details.push({
        key: 'threshold',
        label: 'Signature Threshold',
        labelVi: 'Ngưỡng chữ ký',
        passed: false,
        value: 'Check failed',
        status: 'warning'
      });
    }

    // 6. Check action registered
    let actionExists = false;
    try {
      const actionHash = createActionHash(actionType);
      const actionInfo = await contract.actions(actionHash);
      actionExists = actionInfo[0] === true;
      const actionVersion = Number(actionInfo[1] || 0);
      
      details.push({
        key: 'action',
        label: 'Action Registered',
        labelVi: 'Action đã đăng ký',
        passed: actionExists,
        value: actionExists ? `${actionType} (v${actionVersion})` : 'Not Found',
        hint: !actionExists ? `Action "${actionType}" not registered. Use govRegisterAction() to register.` : undefined,
        status: actionExists ? 'success' : 'error'
      });
      if (!actionExists) {
        issues.push(`Action "${actionType}" not registered on contract`);
      }
    } catch {
      details.push({
        key: 'action',
        label: 'Action Registered',
        labelVi: 'Action đã đăng ký',
        passed: false,
        value: 'Check failed',
        status: 'warning'
      });
      issues.push(`Could not verify action "${actionType}"`);
    }

    // Determine if can mint
    const hardIssues = issues.filter(i => !i.startsWith('Could not'));
    const canMint = hardIssues.length === 0;

    return { canMint, issues, details, contractAddress };

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
 * Complete minting flow
 * 
 * @param signer - JsonRpcSigner from Attester wallet
 * @param recipientAddress - Address to receive tokens
 * @param actionType - Action type string (e.g., "CONTENT_CREATE")
 * @param amount - Amount in atomic units
 * @param evidenceData - Evidence object for hashing
 * @returns Transaction hash
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
  const signerAddress = await signer.getAddress();

  // 1. Get nonce for RECIPIENT (not signer!)
  const nonce = await contract.nonces(recipientAddress);

  // 2. Prepare signing data
  const { pplpData, evidenceHash } = preparePPLPData({
    recipientAddress,
    actionType,
    amount,
    evidenceData,
    nonce
  });

  // 3. Sign with EIP-712
  const signature = await signPPLP(signer, pplpData);

  // 4. Verify signature off-chain (optional but recommended)
  const verification = verifyPPLPSignatureWithDetails(pplpData, signature, signerAddress);
  if (!verification.isValid) {
    throw new Error(
      `Signature mismatch! Recovered: ${verification.recoveredAddress}, Expected: ${signerAddress}. ` +
      `Check EIP-712 domain version (using: ${verification.domain.version})`
    );
  }

  // 5. Preflight check with estimateGas
  try {
    await contract.lockWithPPLP.estimateGas(
      recipientAddress,
      actionType,
      amount,
      evidenceHash,
      [signature]
    );
  } catch (err: any) {
    const revertData = err.data || err.info?.error?.data;
    const decoded = decodeRevertError(revertData);
    throw new Error(`Preflight failed: ${decoded}`);
  }

  // 6. Execute transaction
  const tx = await contract.lockWithPPLP(
    recipientAddress,
    actionType,      // STRING, not hash!
    amount,
    evidenceHash,
    [signature]      // ARRAY!
  );

  // 7. Wait for confirmation
  const receipt = await tx.wait();
  return receipt.hash;
}

// ===== ERROR DECODING =====

/**
 * Decode revert errors from contract
 */
export function decodeRevertError(data: string | null): string {
  if (!data || data === "0x") {
    return "No revert data (silent revert)";
  }

  const selector = data.slice(0, 10).toLowerCase();

  // Standard Error(string)
  if (selector === "0x08c379a0" && data.length > 10) {
    try {
      const hexString = data.slice(10);
      const length = parseInt(hexString.slice(64, 128), 16);
      const messageHex = hexString.slice(128, 128 + length * 2);
      const message = Buffer.from(messageHex, 'hex').toString('utf8');
      return `Revert: "${message}"`;
    } catch {
      return "Error(string) - Could not decode";
    }
  }

  // Known contract errors
  const knownErrors: Record<string, string> = {
    "NOT_GOV": "Caller is not governance",
    "PAUSED": "Transitions are paused",
    "SIG_LIMIT": "Too many signatures (max 5)",
    "ACTION_INVALID": "Action not allowed or deprecated",
    "EPOCH_CAP": "Epoch mint cap exceeded",
    "SIGS_LOW": "Not enough valid attester signatures",
    "LOCK_LOW": "Insufficient locked amount",
    "ACT_LOW": "Insufficient activated amount"
  };

  for (const [key, desc] of Object.entries(knownErrors)) {
    if (data.toLowerCase().includes(Buffer.from(key).toString('hex').toLowerCase())) {
      return `${key}: ${desc}`;
    }
  }

  return `Unknown error: ${selector}`;
}

// ===== DEBUG BUNDLE =====

export interface MintDebugBundle {
  timestamp: string;
  network: {
    chainId: number;
    expectedChainId: number;
    isCorrect: boolean;
  };
  contract: {
    address: string;
    exists: boolean;
  };
  wallet: {
    address: string;
    isAttester: boolean | null;
  };
  action: {
    type: string;
    hash: string;
    isRegistered: boolean | null;
  };
  pplp: {
    user: string;
    amount: string;
    evidenceHash: string;
    nonce: string;
  };
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  signature: {
    value: string;
    recoveredAddress: string;
    expectedAddress: string;
    isValid: boolean;
  };
  preflight: {
    success: boolean;
    error: string | null;
  };
  error: {
    code: string | number | null;
    message: string | null;
  } | null;
}

/**
 * Create empty debug bundle
 */
export function createDebugBundle(): MintDebugBundle {
  return {
    timestamp: new Date().toISOString(),
    network: { chainId: 0, expectedChainId: 97, isCorrect: false },
    contract: { address: "", exists: false },
    wallet: { address: "", isAttester: null },
    action: { type: "", hash: "", isRegistered: null },
    pplp: { user: "", amount: "0", evidenceHash: "", nonce: "0" },
    domain: { name: "", version: "", chainId: 0, verifyingContract: "" },
    signature: { value: "", recoveredAddress: "", expectedAddress: "", isValid: false },
    preflight: { success: false, error: null },
    error: null
  };
}

/**
 * Format debug bundle as JSON string for copying
 */
export function formatDebugBundle(bundle: MintDebugBundle): string {
  return JSON.stringify(bundle, null, 2);
}
